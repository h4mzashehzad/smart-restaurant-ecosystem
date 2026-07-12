<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminFeedbackController;
use App\Http\Controllers\Api\AdminMenuController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\AdminRestaurantController;
use App\Http\Controllers\Api\AdminTableController;
use App\Http\Controllers\Api\AdminTeamController;
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
use Illuminate\Support\Facades\Route;

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
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/request-otp', [AuthController::class, 'requestOTP']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);
});

// Public menu browsing
Route::get('/restaurants/{restaurant}/menu', [MenuController::class, 'index']);
Route::get('/restaurants/{restaurant}/categories', [MenuController::class, 'categories']);
Route::get('/categories/{category}/items', [MenuController::class, 'categoryItems']);
Route::get('/menu-items/search', [MenuController::class, 'search']);
Route::get('/menu-items/recommended', [MenuController::class, 'recommended']);
Route::get('/menu-items/{item}', [MenuController::class, 'show']);
Route::get('/menu-items/{item}/ingredients', [MenuController::class, 'ingredients']);

// Public restaurant reviews
Route::get('/restaurants/{restaurant}/reviews', [FeedbackController::class, 'restaurantReviews']);

// ── Public Reservation Routes ──
Route::get('/restaurants/slug/{slug}', [ReservationController::class, 'restaurantBySlug']);
Route::get('/restaurants/{restaurant}/tables/availability', [ReservationController::class, 'availability']);
Route::get('/restaurants/{restaurant}/time-slots', [ReservationController::class, 'timeSlots']);
Route::get('/reservations/{confirmationCode}', [ReservationController::class, 'show']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

// ── Public Queue Routes ──
Route::post('/queue/join', [QueueController::class, 'join']);

// ── Webhooks (called by socket server, no auth) ──
Route::post('/webhooks/order-status', [OrderController::class,               'webhookUpdateStatus']);
Route::post('/webhooks/waiter-request-action', [ServiceRequestWebhookController::class, 'handle']);
Route::post('/webhooks/reservation-status', [ReservationController::class,          'webhookUpdateStatus']);
Route::post('/webhooks/queue-status', [QueueController::class,                'webhookUpdateStatus']);

// ── Service Requests (public — guests in a session may request assistance) ──
Route::post('/service-requests', [ServiceRequestController::class, 'store']);

// ── Orders (optional auth — guests may place orders without a token) ──
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::get('/sessions/{session}/orders', [OrderController::class, 'sessionOrders']);
Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

// ── Payments (public — guests checkout; Safepay callbacks/webhooks) ──
Route::post('/payments/checkout', [PaymentController::class, 'checkout']);
Route::post('/payments/split-bill/setup', [PaymentController::class, 'setupSplitBill']);
Route::post('/payments/split-bill/unlock', [PaymentController::class, 'unlockSplitBill']);
Route::post('/payments/split-bill/claim', [PaymentController::class, 'claimItem']);
Route::post('/payments/split-bill/participant-checkout', [PaymentController::class, 'participantCheckout']);
Route::get('/payments/safepay/callback', [PaymentController::class, 'handleCallback']);
Route::post('/payments/safepay/webhook', [PaymentController::class, 'handleWebhook']);
Route::get('/sessions/{session}/bill', [PaymentController::class, 'sessionBill']);
Route::get('/sessions/{session}/payment-status', [PaymentController::class, 'paymentStatus']);
Route::get('/payments/{payment}/receipt', [PaymentController::class, 'downloadReceipt']);

// ── Feedback (public — guests + authenticated users) ──
Route::post('/feedback', [FeedbackController::class, 'store']);
Route::get('/feedback/{orderId}', [FeedbackController::class, 'show']);

// ── Public Table / QR Scan (guests + authenticated users) ──
// GET: returns table info + whether a session exists (used on scan landing page)
Route::get('/tables/{qrCode}/scan', [TableController::class, 'scan']);
// POST: creates or joins a session in a single request (used on scan landing page)
//       Optionally auth-guarded if token present, but accepts guests too
Route::post('/tables/{qrCode}/scan', [TableController::class, 'scanAndJoin']);

// ── Session Management (guests + authenticated users) ──
Route::prefix('sessions')->group(function () {
    Route::get('/{session}', [SessionController::class, 'show']);
    Route::get('/{session}/participants', [SessionController::class, 'participants']);
    Route::post('/{session}/join', [SessionController::class, 'join']);
    Route::post('/{session}/leave', [SessionController::class, 'leave']);
    Route::post('/{session}/end', [SessionController::class, 'end']);
});
Route::post('/tables/{table}/start-session', [SessionController::class, 'start']);

// ──────────────────────────────────────────────
//  AUTHENTICATED ROUTES (Sanctum token required)
// ──────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // ── Tables ──
    // (scan is now public above)

    // ── Sessions ──
    // (session routes are now public above)

    // ── Menu (authenticated extras) ──
    // Route moved to public section

    // ── Orders (auth-required) ──
    Route::get('/orders/history', [OrderController::class, 'history']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // ── Payments (staff + legacy) ──
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::post('/payments/split-bill', [PaymentController::class, 'splitBill']);
    Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm']);
    Route::post('/payments/{payment}/confirm-cash', [PaymentController::class, 'confirmCashPayment']);
    Route::post('/payments/{payment}/refund', [PaymentController::class, 'refund']);
    Route::get('/payments/cash/pending', [PaymentController::class, 'pendingCashPayments']);

    // ── Queue (authenticated) ──
    Route::get('/queue/status', [QueueController::class, 'status']);

    // ── Service Requests (staff-only: list, acknowledge, resolve) ──
    // Scoped to the staff member's own restaurant via ResolvesRestaurant — never a client-supplied id.
    Route::middleware('restaurant.role:admin,staff')->group(function () {
        Route::get('/service-requests', [ServiceRequestController::class, 'index']);
        Route::patch('/service-requests/{id}/acknowledge', [ServiceRequestController::class, 'acknowledge']);
        Route::patch('/service-requests/{id}/resolve', [ServiceRequestController::class, 'resolve']);
    });

    // ── Loyalty & Rewards ──
    Route::get('/loyalty/points', [LoyaltyController::class, 'points']);
    Route::get('/loyalty/transactions', [LoyaltyController::class, 'transactions']);
    Route::get('/loyalty/rewards', [LoyaltyController::class, 'rewards']);
    Route::post('/loyalty/redeem', [LoyaltyController::class, 'redeem']);

    // ── Admin / Analytics ──
    // Every operator here is bound to exactly one restaurant (users.restaurant_id).
    // `restaurant.role:admin,staff` enforces role + active + restaurant-bound; all
    // controllers resolve the restaurant via ResolvesRestaurant, never a route/body param.
    Route::prefix('admin')->middleware('restaurant.role:admin,staff')->group(function () {
        Route::get('/dashboard/stats', [AdminController::class, 'dashboardStats']);
        Route::get('/analytics/revenue', [AdminController::class, 'revenue']);
        Route::get('/analytics/peak-hours', [AdminController::class, 'peakHours']);
        Route::get('/analytics/popular-items', [AdminController::class, 'popularItems']);
        Route::get('/analytics/sentiment-summary', [AdminController::class, 'sentimentSummary']);
        Route::get('/analytics/wastage-report', [AdminController::class, 'wastageReport']);
        Route::get('/kitchen/orders/active', [AdminController::class, 'activeKitchenOrders']);
        Route::patch('/menu-items/{id}', [AdminController::class, 'updateMenuItem']);

        // ── Restaurant Profile (read: admin+staff, write: admin only) ──
        Route::get('/restaurant', [AdminRestaurantController::class, 'show']);

        // ── Team Management (read: admin+staff, write: admin only) ──
        Route::get('/team', [AdminTeamController::class, 'index']);

        // ── Tables (read + end-session: admin+staff, mutations: admin only) ──
        Route::get('/tables', [AdminTableController::class, 'index']);
        Route::get('/tables/{id}', [AdminTableController::class, 'show']);
        Route::post('/tables/{id}/end-session', [AdminTableController::class, 'endSession']);

        // ── Menu (read: admin+staff, mutations: admin only) ──
        Route::get('/menu/categories', [AdminMenuController::class, 'categories']);
        Route::get('/menu/items', [AdminMenuController::class, 'items']);
        Route::patch('/menu/items/{id}/toggle-availability', [AdminMenuController::class, 'toggleAvailability']);

        // ── Orders (admin+staff) ──
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{id}/cancel', [AdminOrderController::class, 'cancel']);

        // ── Feedback / Reviews (admin+staff) ──
        Route::get('/feedback', [AdminFeedbackController::class, 'index']);
        Route::patch('/feedback/{id}/respond', [AdminFeedbackController::class, 'respond']);
        Route::patch('/feedback/{id}/dismiss-flag', [AdminFeedbackController::class, 'dismissFlag']);

        // ── Payments ledger (admin+staff) — refunds are intentionally not exposed here ──
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/pending-cash', [AdminPaymentController::class, 'pendingCash']);

        // ── Reservation Management (admin+staff) — restaurant-scoped, ignores any path/body restaurant id ──
        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::patch('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);

        // ── Queue Management (admin+staff) — restaurant-scoped, ignores any path/body restaurant id ──
        Route::get('/queue', [QueueController::class, 'index']);
        Route::patch('/queue/{entry}/status', [QueueController::class, 'updateStatus']);

        // ── Admin-only mutations ──
        Route::middleware('restaurant.role:admin')->group(function () {
            Route::patch('/restaurant', [AdminRestaurantController::class, 'update']);

            Route::post('/team', [AdminTeamController::class, 'store']);
            Route::patch('/team/{id}', [AdminTeamController::class, 'update']);
            Route::patch('/team/{id}/deactivate', [AdminTeamController::class, 'deactivate']);

            Route::post('/tables', [AdminTableController::class, 'store']);
            Route::patch('/tables/{id}', [AdminTableController::class, 'update']);
            Route::delete('/tables/{id}', [AdminTableController::class, 'destroy']);
            Route::post('/tables/{id}/regenerate-qr', [AdminTableController::class, 'regenerateQrCode']);

            Route::post('/menu/categories', [AdminMenuController::class, 'storeCategory']);
            Route::patch('/menu/categories/{id}', [AdminMenuController::class, 'updateCategory']);
            Route::delete('/menu/categories/{id}', [AdminMenuController::class, 'destroyCategory']);
            Route::post('/menu/items', [AdminMenuController::class, 'storeItem']);
            Route::patch('/menu/items/{id}', [AdminMenuController::class, 'updateItem']);
            Route::delete('/menu/items/{id}', [AdminMenuController::class, 'destroyItem']);
        });
    });
});
