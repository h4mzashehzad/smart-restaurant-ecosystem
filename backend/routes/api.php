<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\ServiceRequestWebhookController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\TableController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically by RouteServiceProvider.
|
*/

// ──────────────────────────────────────────────
//  PUBLIC ROUTES (no authentication required)
// ──────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/register',    [AuthController::class, 'register']);
    Route::post('/login',       [AuthController::class, 'login']);
    Route::post('/request-otp', [AuthController::class, 'requestOTP']);
    Route::post('/verify-otp',  [AuthController::class, 'verifyOTP']);
});

// Public menu browsing
Route::get('/restaurants/{restaurant}/menu',       [MenuController::class, 'index']);
Route::get('/restaurants/{restaurant}/categories', [MenuController::class, 'categories']);
Route::get('/categories/{category}/items',         [MenuController::class, 'categoryItems']);
Route::get('/menu-items/search',                   [MenuController::class, 'search']);
Route::get('/menu-items/{item}',                   [MenuController::class, 'show']);
Route::get('/menu-items/{item}/ingredients',       [MenuController::class, 'ingredients']);

// Public restaurant reviews
Route::get('/restaurants/{restaurant}/reviews', [FeedbackController::class, 'restaurantReviews']);

// Public reservation lookup
Route::get('/reservations/{confirmationCode}', [ReservationController::class, 'show']);

// Public restaurant availability
Route::get('/restaurants/{restaurant}/availability', [ReservationController::class, 'availability']);

// ── Webhooks (called by socket server, no auth) ──
Route::post('/webhooks/order-status',         [OrderController::class,               'webhookUpdateStatus']);
Route::post('/webhooks/waiter-request-action', [ServiceRequestWebhookController::class, 'handle']);

// ── Service Requests (public — guests in a session may request assistance) ──
Route::post('/service-requests', [ServiceRequestController::class, 'store']);

// ── Orders (optional auth — guests may place orders without a token) ──
Route::post('/orders',                        [OrderController::class, 'store']);
Route::get('/orders/{order}',                  [OrderController::class, 'show']);
Route::get('/sessions/{session}/orders',       [OrderController::class, 'sessionOrders']);
Route::post('/orders/{order}/cancel',          [OrderController::class, 'cancel']);

// ── Public Table / QR Scan (guests + authenticated users) ──
// GET: returns table info + whether a session exists (used on scan landing page)
Route::get('/tables/{qrCode}/scan', [TableController::class, 'scan']);
// POST: creates or joins a session in a single request (used on scan landing page)
//       Optionally auth-guarded if token present, but accepts guests too
Route::post('/tables/{qrCode}/scan', [TableController::class, 'scanAndJoin']);

// ── Session Management (guests + authenticated users) ──
Route::prefix('sessions')->group(function () {
    Route::get('/{session}',              [SessionController::class, 'show']);
    Route::get('/{session}/participants', [SessionController::class, 'participants']);
    Route::post('/{session}/join',         [SessionController::class, 'join']);
    Route::post('/{session}/leave',        [SessionController::class, 'leave']);
    Route::post('/{session}/end',          [SessionController::class, 'end']);
});
Route::post('/tables/{table}/start-session', [SessionController::class, 'start']);

// ──────────────────────────────────────────────
//  AUTHENTICATED ROUTES (Sanctum token required)
// ──────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::get('/auth/me',       [AuthController::class, 'me']);
    Route::post('/auth/logout',  [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // ── Tables ──
    // (scan is now public above)

    // ── Sessions ──
    // (session routes are now public above)

    // ── Menu (authenticated extras) ──
    Route::get('/menu-items/recommended', [MenuController::class, 'recommended']);

    // ── Orders (auth-required) ──
    Route::get('/orders/history',                  [OrderController::class, 'history']);
    Route::patch('/orders/{order}/status',         [OrderController::class, 'updateStatus']);

    // ── Payments ──
    Route::post('/payments/initiate',              [PaymentController::class, 'initiate']);
    Route::post('/payments/split-bill',            [PaymentController::class, 'splitBill']);
    Route::post('/payments/{payment}/confirm',     [PaymentController::class, 'confirm']);
    Route::post('/payments/{payment}/refund',      [PaymentController::class, 'refund']);
    Route::get('/sessions/{session}/bill',         [PaymentController::class, 'sessionBill']);

    // ── Reservations ──
    Route::post('/reservations',                   [ReservationController::class, 'store']);
    Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

    // ── Queue ──
    Route::post('/queue/join',   [QueueController::class, 'join']);
    Route::get('/queue/status',  [QueueController::class, 'status']);

    // ── Service Requests (staff-only: list, acknowledge, resolve) ──
    Route::get('/service-requests',                     [ServiceRequestController::class, 'index']);
    Route::patch('/service-requests/{id}/acknowledge',  [ServiceRequestController::class, 'acknowledge']);
    Route::patch('/service-requests/{id}/resolve',      [ServiceRequestController::class, 'resolve']);

    // ── Feedback ──
    Route::post('/feedback',            [FeedbackController::class, 'store']);
    Route::get('/feedback/{orderId}',   [FeedbackController::class, 'show']);

    // ── Loyalty & Rewards ──
    Route::get('/loyalty/points',        [LoyaltyController::class, 'points']);
    Route::get('/loyalty/transactions',  [LoyaltyController::class, 'transactions']);
    Route::get('/loyalty/rewards',       [LoyaltyController::class, 'rewards']);
    Route::post('/loyalty/redeem',       [LoyaltyController::class, 'redeem']);

    // ── Admin / Analytics (role-based access should be enforced via middleware) ──
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard/stats',            [AdminController::class, 'dashboardStats']);
        Route::get('/analytics/revenue',          [AdminController::class, 'revenue']);
        Route::get('/analytics/peak-hours',       [AdminController::class, 'peakHours']);
        Route::get('/analytics/popular-items',    [AdminController::class, 'popularItems']);
        Route::get('/analytics/sentiment-summary', [AdminController::class, 'sentimentSummary']);
        Route::get('/analytics/wastage-report',   [AdminController::class, 'wastageReport']);
        Route::get('/kitchen/orders/active',      [AdminController::class, 'activeKitchenOrders']);
        Route::patch('/menu-items/{id}',          [AdminController::class, 'updateMenuItem']);
    });
});
