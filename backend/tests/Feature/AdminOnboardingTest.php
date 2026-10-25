<?php

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);
test('tour progress is persisted only on the authenticated operator', function () {
    $r = Restaurant::create(['name' => 'One', 'slug' => 'one']);
    $other = Restaurant::create(['name' => 'Two', 'slug' => 'two']);
    $admin = User::factory()->admin($r->id)->create();
    $otherAdmin = User::factory()->admin($other->id)->create();
    Sanctum::actingAs($admin);
    $this->patchJson('/api/admin/onboarding', ['status' => 'active', 'step' => 8, 'version' => 1, 'user_id' => $otherAdmin->id, 'restaurant_id' => $other->id])->assertSuccessful();
    $this->getJson('/api/admin/onboarding')->assertJsonPath('data.tour.step', 8)->assertJsonPath('data.setup.restaurant_id', $r->id);
    expect($otherAdmin->fresh()->admin_onboarding)->toBeNull();
    $this->patchJson('/api/admin/onboarding', ['status' => 'skipped', 'step' => 8, 'version' => 1])->assertSuccessful();
    $this->getJson('/api/admin/onboarding')->assertJsonPath('data.tour.status', 'skipped')->assertJsonPath('data.setup.menu', false);
});
test('customers and unbound operators cannot access onboarding', function () {
    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/admin/onboarding')->assertForbidden();
    Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'restaurant_id' => null]));
    $this->getJson('/api/admin/onboarding')->assertForbidden();
});
test('old accounts do not receive a forced tour and invalid progress is rejected', function () {
    $r = Restaurant::create(['name' => 'One', 'slug' => 'one']);
    Sanctum::actingAs(User::factory()->admin($r->id)->create());
    $this->getJson('/api/admin/onboarding')->assertJsonPath('data.tour', null);
    $this->patchJson('/api/admin/onboarding', ['status' => 'active', 'step' => 999, 'version' => 1])->assertUnprocessable();
});

test('new restaurants without hours do not advertise reservable time slots', function () {
    $restaurant = Restaurant::create(['name' => 'Unconfigured', 'slug' => 'unconfigured']);
    $this->getJson('/api/restaurants/'.$restaurant->id.'/time-slots?date='.today()->addDay()->toDateString())->assertSuccessful()->assertJsonPath('data', []);
});
