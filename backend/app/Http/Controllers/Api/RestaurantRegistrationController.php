<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestaurantRegistrationCodeRequest;
use App\Http\Requests\RestaurantRegistrationRequest;
use App\Services\RestaurantRegistrationService;
use Illuminate\Http\JsonResponse;

class RestaurantRegistrationController extends Controller
{
    public function store(RestaurantRegistrationRequest $request, RestaurantRegistrationService $service): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $service->start($request->validated())]);
    }

    public function existing(RestaurantRegistrationRequest $request, RestaurantRegistrationService $service): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $service->start($request->validated(), $request->user())]);
    }

    public function verify(RestaurantRegistrationCodeRequest $request, RestaurantRegistrationService $service): JsonResponse
    {
        $user = $service->verify($request->validated('challenge_id'), $request->validated('otp'), $request->user('sanctum'));
        $user->tokens()->delete();

        return response()->json(['success' => true, 'data' => [
            'user' => $user, 'token' => $user->createToken('auth_token')->plainTextToken, 'token_type' => 'Bearer',
        ]], 201);
    }

    public function resend(RestaurantRegistrationCodeRequest $request, RestaurantRegistrationService $service): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $service->resend($request->validated('challenge_id'), $request->user('sanctum'))]);
    }
}
