<?php

use App\Mail\RegistrationOTP;
use App\Mail\RestaurantRegistrationOTP;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);
beforeEach(function () {
    Cache::flush();
    Mail::fake();
});
function partnerPayload(array $overrides = []): array
{
    return [...[
        'name' => 'Restaurant Owner', 'email' => 'owner@example.test', 'phone' => '+923001234500',
        'password' => 'OwnerPassword123!', 'password_confirmation' => 'OwnerPassword123!',
        'restaurant_name' => 'New Restaurant', 'restaurant_slug' => 'new-restaurant',
        'restaurant_address' => 'Islamabad, Pakistan', 'restaurant_email' => 'hello@example.test', 'restaurant_phone' => '+923001234501',
        'opening_time' => '11:00', 'closing_time' => '23:00', 'timezone' => 'Asia/Karachi',
    ], ...$overrides];
}
function partnerChallenge($test, array $payload = []): array
{
    $response = $test->postJson('/api/auth/restaurant-registration', partnerPayload($payload))->assertSuccessful();

    return [$response->json('data.challenge_id'), Mail::sent(RestaurantRegistrationOTP::class)->last()->otp];
}
test('verified restaurant registration creates an isolated administrator and authenticates it', function () {
    [$id, $otp] = partnerChallenge($this);
    expect(Restaurant::count())->toBe(0)->and(User::count())->toBe(0);
    $pending = Cache::get('restaurant-registration:'.$id);
    expect($pending['payload'])->not->toContain('OwnerPassword123!')->and($pending['otp'])->not->toBe($otp);
    $response = $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertCreated()->assertJsonPath('data.user.role', 'admin')->assertJsonPath('data.user.restaurant.slug', 'new-restaurant');
    $owner = User::first();
    expect(Hash::check('OwnerPassword123!', $owner->password))->toBeTrue()->and($owner->email_verified_at)->not->toBeNull()->and($owner->restaurant_id)->toBe(Restaurant::first()->id);
    $this->withToken($response->json('data.token'))->getJson('/api/admin/onboarding')->assertSuccessful()->assertJsonPath('data.setup.menu', false)->assertJsonPath('data.setup.tables', false)->assertJsonPath('data.tour.status', 'pending');
});
test('verification code cannot be replayed to create a second restaurant', function () {
    [$id, $otp] = partnerChallenge($this);
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertCreated();
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertUnprocessable();
    expect(Restaurant::count())->toBe(1)->and(User::count())->toBe(1);
});
test('expired verification does not create restaurant data', function () {
    [$id, $otp] = partnerChallenge($this);
    $this->travel(16)->minutes();
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertUnprocessable();
    expect(Restaurant::count())->toBe(0);
});
test('five wrong verification attempts exhaust the challenge', function () {
    [$id, $otp] = partnerChallenge($this);
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => '000000'])->assertUnprocessable();
    }
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertUnprocessable();
    $this->travel(61)->seconds();
    $this->postJson('/api/auth/restaurant-registration/resend', ['challenge_id' => $id])->assertUnprocessable();
    expect(Restaurant::count())->toBe(0);
});
test('resend is cooled down and replaces the old verification code', function () {
    [$id, $old] = partnerChallenge($this);
    $this->postJson('/api/auth/restaurant-registration/resend', ['challenge_id' => $id])->assertUnprocessable();
    $this->travel(61)->seconds();
    $this->postJson('/api/auth/restaurant-registration/resend', ['challenge_id' => $id])->assertSuccessful();
    $otp = Mail::sent(RestaurantRegistrationOTP::class)->last()->otp;
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $old])->assertUnprocessable();
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertCreated();
});
test('signup rejects role and restaurant association tampering', function () {
    $this->postJson('/api/auth/restaurant-registration', partnerPayload(['role' => 'admin', 'restaurant_id' => 99]))->assertUnprocessable()->assertJsonValidationErrors(['role', 'restaurant_id']);
    expect(Restaurant::count())->toBe(0);
});
test('a conflicting slug at verification creates neither an owner nor an orphan restaurant', function () {
    [$id, $otp] = partnerChallenge($this);
    Restaurant::create(['name' => 'Other', 'slug' => 'new-restaurant']);
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertUnprocessable()->assertJsonValidationErrors('restaurant_slug');
    expect(Restaurant::count())->toBe(1)->and(User::count())->toBe(0);
});
test('existing customers must authenticate and explicitly verify before becoming an owner', function () {
    $customer = User::factory()->create(['email' => 'owner@example.test', 'phone' => '+923001234500', 'loyalty_points' => 123]);
    $this->postJson('/api/auth/restaurant-registration', partnerPayload())->assertUnprocessable();
    $payload = partnerPayload();
    unset($payload['password'], $payload['password_confirmation']);
    $this->postJson('/api/auth/restaurant-registration/existing', $payload)->assertUnauthorized();
    Sanctum::actingAs($customer);
    $response = $this->postJson('/api/auth/restaurant-registration/existing', $payload)->assertSuccessful();
    expect($customer->fresh()->role)->toBe('customer');
    $otp = Mail::sent(RestaurantRegistrationOTP::class)->last()->otp;
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $response->json('data.challenge_id'), 'otp' => $otp])->assertCreated();
    expect(User::count())->toBe(1)->and($customer->fresh()->role)->toBe('admin')->and($customer->fresh()->loyalty_points)->toBe(123);
});
test('an existing operator cannot sign up and reassign their account', function () {
    $r = Restaurant::create(['name' => 'Existing', 'slug' => 'existing']);
    $admin = User::factory()->admin($r->id)->create();
    Sanctum::actingAs($admin);
    $this->postJson('/api/auth/restaurant-registration/existing', partnerPayload())->assertForbidden();
    expect($admin->fresh()->restaurant_id)->toBe($r->id);
});
test('an existing account challenge is bound to the initiating user', function () {
    $customer = User::factory()->create(['email' => 'owner@example.test', 'phone' => '+923001234500']);
    Sanctum::actingAs($customer);
    $payload = partnerPayload();
    unset($payload['password'], $payload['password_confirmation']);
    $response = $this->postJson('/api/auth/restaurant-registration/existing', $payload)->assertSuccessful();
    Sanctum::actingAs(User::factory()->create());
    $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $response->json('data.challenge_id'), 'otp' => Mail::sent(RestaurantRegistrationOTP::class)->last()->otp])->assertForbidden();
    expect(Restaurant::count())->toBe(0);
});
test('customer signup still creates a customer without a restaurant', function () {
    $payload = collect(partnerPayload())->only(['name', 'email', 'phone', 'password', 'password_confirmation'])->all();
    $this->postJson('/api/auth/register', $payload)->assertSuccessful();
    $otp = Mail::sent(RegistrationOTP::class)->last()->otp;
    $this->postJson('/api/auth/verify-otp', ['email' => $payload['email'], 'otp' => $otp])->assertCreated()->assertJsonPath('data.user.role', 'customer');
    expect(User::first()->restaurant_id)->toBeNull()->and(Restaurant::count())->toBe(0);
});

test('restaurant creation is rolled back when owner persistence fails', function () {
    [$id, $otp] = partnerChallenge($this);
    \Illuminate\Support\Facades\Event::listen('eloquent.creating: '.User::class, function () {
        throw new RuntimeException('Simulated persistence failure');
    });
    try {
        $this->postJson('/api/auth/restaurant-registration/verify', ['challenge_id' => $id, 'otp' => $otp])->assertServerError();
        expect(Restaurant::count())->toBe(0)->and(User::count())->toBe(0);
    } finally {
        \Illuminate\Support\Facades\Event::forget('eloquent.creating: '.User::class);
    }
});
