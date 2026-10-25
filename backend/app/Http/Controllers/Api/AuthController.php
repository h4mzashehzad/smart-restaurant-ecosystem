<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new user (Step 1: Request OTP).
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'email' => 'required|email|unique:users,email',
                'phone' => 'required|string|unique:users,phone',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Generate 6 digit OTP
            $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Cache data for 15 minutes
            Cache::put('registration_otp_'.$request->email, [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'otp' => $otp,
            ], now()->addMinutes(15));

            // Send OTP Email
            Mail::to($request->email)->send(new \App\Mail\RegistrationOTP($request->name, $otp));

            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully. Please check your email.',
                'require_otp' => true,
            ]);
        } catch (\Exception $e) {
            Log::error('Registration Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'payload' => $request->except('password', 'password_confirmation'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during registration. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error',
            ], 500);
        }
    }

    /**
     * Verify OTP and complete registration.
     */
    public function verifyOTP(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $cacheKey = 'registration_otp_'.$request->email;
            $cachedData = Cache::get($cacheKey);

            if (! $cachedData || $cachedData['otp'] !== $request->otp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 400);
            }

            // Create User
            $user = User::create([
                'name' => $cachedData['name'],
                'email' => $cachedData['email'],
                'phone' => $cachedData['phone'],
                'password' => $cachedData['password'],
                'role' => 'customer',
            ]);

            Cache::forget($cacheKey);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration completed successfully',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => 86400,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('OTP Verification Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'email' => $request->email,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during verification. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error',
            ], 500);
        }
    }

    /**
     * Login user and issue token.
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $loginField = filter_var($request->identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

            $validator = Validator::make($request->all(), [
                'identifier' => 'required|string', // Contains either email or phone from frontend
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = User::where($loginField, $request->identifier)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }

            if (in_array($user->role, ['admin', 'staff'], true) && (! $user->restaurant_id || ! $user->is_active)) {
                return response()->json(['success' => false, 'message' => 'This operator account is inactive or has no restaurant. Contact your restaurant administrator.'], 403);
            }

            // Revoke previous tokens
            $user->tokens()->delete();

            $token = $user->createToken('auth_token')->plainTextToken;

            $user->load('restaurant:id,name,slug,is_active');

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => 86400,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Login Error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'identifier' => $request->identifier,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error',
            ], 500);
        }
    }

    /**
     * Logout – revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Refresh – rotate token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ],
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('restaurant:id,name,slug,address,phone,email,opening_time,closing_time,is_active');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }
}
