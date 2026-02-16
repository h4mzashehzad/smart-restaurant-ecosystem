<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'required|string|unique:users,phone',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'role'     => 'customer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data'    => [
                'user'       => $user,
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ],
        ], 201);
    }

    /**
     * Login user and issue token.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Revoke previous tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data'    => [
                'user'       => $user,
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ],
        ]);
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
            'data'    => [
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ],
        ]);
    }

    /**
     * Request OTP for phone verification.
     */
    public function requestOTP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $otpCode = sprintf('%06d', rand(0, 999999));

        OtpVerification::create([
            'phone'      => $request->phone,
            'otp_code'   => $otpCode,
            'expires_at' => now()->addMinutes(10),
        ]);

        // TODO: Send OTP via WhatsApp Business API
        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
            'data'    => [
                'otp_code'   => $otpCode, // Remove in production!
                'expires_in' => 600,
            ],
        ]);
    }

    /**
     * Verify OTP code.
     */
    public function verifyOTP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone'    => 'required|string',
            'otp_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $otp = OtpVerification::where('phone', $request->phone)
            ->where('otp_code', $request->otp_code)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP',
            ], 400);
        }

        $otp->update(['verified' => true]);

        User::where('phone', $request->phone)->update([
            'phone_verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Phone verified successfully',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ]);
    }
}
