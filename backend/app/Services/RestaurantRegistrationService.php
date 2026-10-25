<?php

namespace App\Services;

use App\Mail\RestaurantRegistrationOTP;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RestaurantRegistrationService
{
    public function start(array $data, ?User $owner = null): array
    {
        $email = $owner?->email ?? $data['email'];
        $rateKey = 'partner-email:'.hash('sha256', strtolower($email));
        if (RateLimiter::tooManyAttempts($rateKey, 5)) {
            throw ValidationException::withMessages(['email' => 'Please wait before requesting another verification email.']);
        }
        RateLimiter::hit($rateKey, 3600);
        $id = (string) Str::uuid();
        $otp = (string) random_int(100000, 999999);
        $data['email'] = $email;
        if ($owner) {
            $data['name'] = $owner->name;
            $data['phone'] = $owner->phone ?? $data['phone'];
        } else {
            $data['password'] = Hash::make($data['password']);
        }
        unset($data['password_confirmation']);
        $pending = [
            'payload' => Crypt::encryptString(json_encode($data, JSON_THROW_ON_ERROR)),
            'owner_id' => $owner?->id, 'otp' => Hash::make($otp), 'attempts' => 0, 'resends' => 0,
            'sent_at' => now()->timestamp, 'expires_at' => now()->addMinutes(15)->timestamp,
        ];
        Mail::to($email)->send(new RestaurantRegistrationOTP($data['name'], $otp, $data['restaurant_name']));
        Cache::put($this->key($id), $pending, now()->addMinutes(15));

        return ['challenge_id' => $id, 'email' => $email, 'expires_at' => $pending['expires_at'], 'resend_after' => 60];
    }

    public function verify(string $id, string $otp, ?User $actor): User
    {
        return Cache::lock($this->key($id).':lock', 15)->block(5, function () use ($id, $otp, $actor) {
            $pending = $this->pending($id, $actor);
            if ($pending['attempts'] >= 5) {
                throw ValidationException::withMessages(['otp' => 'Too many attempts. Start registration again.']);
            }
            if (! Hash::check($otp, $pending['otp'])) {
                $pending['attempts']++;
                Cache::put($this->key($id), $pending, now()->setTimestamp($pending['expires_at']));
                throw ValidationException::withMessages(['otp' => 'The code is incorrect. Check your email and try again.']);
            }
            $data = json_decode(Crypt::decryptString($pending['payload']), true, flags: JSON_THROW_ON_ERROR);
            $user = DB::transaction(function () use ($data, $pending) {
                $owner = $pending['owner_id'] ? User::query()->lockForUpdate()->findOrFail($pending['owner_id']) : null;
                if ($owner && ($owner->role !== 'customer' || $owner->restaurant_id || ! $owner->is_active)) {
                    throw ValidationException::withMessages(['email' => 'This account already has a restaurant or is inactive. Sign in to your dashboard.']);
                }
                Validator::make($data, [
                    'email' => [Rule::unique('users')->ignore($owner?->id)],
                    'phone' => [Rule::unique('users')->ignore($owner?->id)],
                    'restaurant_slug' => [Rule::unique('restaurants', 'slug')],
                ])->validate();
                $restaurant = Restaurant::create([
                    'name' => $data['restaurant_name'], 'slug' => $data['restaurant_slug'],
                    'address' => $data['restaurant_address'], 'phone' => $data['restaurant_phone'],
                    'email' => $data['restaurant_email'], 'opening_time' => $data['opening_time'] ?? null,
                    'closing_time' => $data['closing_time'] ?? null, 'timezone' => $data['timezone'], 'is_active' => true,
                ]);
                $user = $owner ?? new User;
                if (! $owner) {
                    $user->fill(collect($data)->only(['name', 'email', 'phone', 'password'])->all());
                } elseif (! $user->phone) {
                    $user->phone = $data['phone'];
                }
                $user->forceFill([
                    'role' => 'admin', 'restaurant_id' => $restaurant->id, 'is_active' => true,
                    'email_verified_at' => now(),
                    'admin_onboarding' => ['version' => 1, 'step' => 0, 'status' => 'pending'],
                ])->save();

                return $user->load('restaurant:id,name,slug,is_active');
            });
            Cache::forget($this->key($id));

            return $user;
        });
    }

    public function resend(string $id, ?User $actor): array
    {
        return Cache::lock($this->key($id).':lock', 15)->block(5, function () use ($id, $actor) {
            $pending = $this->pending($id, $actor);
            if (now()->timestamp - $pending['sent_at'] < 60 || $pending['resends'] >= 5 || $pending['attempts'] >= 5) {
                throw ValidationException::withMessages(['otp' => 'Please wait a minute before resending. After repeated attempts, start again.']);
            }
            $data = json_decode(Crypt::decryptString($pending['payload']), true, flags: JSON_THROW_ON_ERROR);
            do {
                $otp = (string) random_int(100000, 999999);
            } while (Hash::check($otp, $pending['otp']));
            Mail::to($data['email'])->send(new RestaurantRegistrationOTP($data['name'], $otp, $data['restaurant_name']));
            $pending['otp'] = Hash::make($otp);
            $pending['resends']++;
            $pending['sent_at'] = now()->timestamp;
            Cache::put($this->key($id), $pending, now()->setTimestamp($pending['expires_at']));

            return ['resend_after' => 60, 'expires_at' => $pending['expires_at']];
        });
    }

    private function pending(string $id, ?User $actor): array
    {
        $pending = Cache::get($this->key($id));
        if (! $pending || $pending['expires_at'] <= now()->timestamp) {
            throw ValidationException::withMessages(['otp' => 'This verification has expired or was already completed. Start again or sign in.']);
        }
        abort_if($pending['owner_id'] && $actor?->id !== $pending['owner_id'], 403, 'Sign in to the account that started this registration.');

        return $pending;
    }

    private function key(string $id): string
    {
        return 'restaurant-registration:'.$id;
    }
}
