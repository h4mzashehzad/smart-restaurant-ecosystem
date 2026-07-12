<?php

namespace App\Http\Controllers\Api;

use App\Events\SessionStateChanged;
use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTableRequest;
use App\Models\Restaurant;
use App\Models\Table;
use App\Services\QRCodeGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminTableController extends Controller
{
    use ResolvesRestaurant;

    public function __construct(protected QRCodeGenerationService $qrCodeGenerator) {}

    /**
     * List all tables for the authenticated restaurant.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $tables = Table::where('restaurant_id', $restaurantId)
            ->with('currentSession')
            ->orderBy('table_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    /**
     * Create a new table and generate its QR code.
     */
    public function store(StoreTableRequest $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $restaurant = Restaurant::findOrFail($restaurantId);

        $table = Table::create([
            'restaurant_id' => $restaurantId,
            'table_number' => $request->table_number,
            'capacity' => $request->input('capacity', 4),
            'status' => $request->input('status', 'available'),
            'qr_code' => (string) Str::uuid(),
        ]);

        try {
            $table->qr_code_url = $this->qrCodeGenerator->generateAndStoreQrCode($restaurant, $table);
            $table->save();
        } catch (\Throwable $e) {
            // Table is still usable; QR image can be regenerated later.
        }

        return response()->json([
            'success' => true,
            'message' => 'Table created',
            'data' => $table->fresh(),
        ], 201);
    }

    /**
     * Show a single table with its current session.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $table = Table::where('restaurant_id', $restaurantId)
            ->with('currentSession.participants.user')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $table,
        ]);
    }

    /**
     * Update a table's number, capacity, or status.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $table = Table::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'table_number' => "sometimes|string|max:20|unique:tables,table_number,{$table->id},id,restaurant_id,{$restaurantId}",
            'capacity' => 'sometimes|integer|min:1|max:50',
            'status' => 'sometimes|in:available,occupied,reserved,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->filled('status') && $request->status !== $table->status && $table->current_session_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot change status while the table has an active session. End the session first.',
            ], 409);
        }

        $table->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Table updated',
            'data' => $table->fresh(),
        ]);
    }

    /**
     * Delete a table. Blocked while an active session exists on it.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $table = Table::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($table->current_session_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a table with an active session. End the session first.',
            ], 409);
        }

        $table->delete();

        return response()->json([
            'success' => true,
            'message' => 'Table deleted',
        ]);
    }

    /**
     * Regenerate a table's QR code (new token + new S3 image).
     */
    public function regenerateQrCode(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $table = Table::where('restaurant_id', $restaurantId)->findOrFail($id);
        $restaurant = Restaurant::findOrFail($restaurantId);

        $table->qr_code = (string) Str::uuid();

        try {
            $table->qr_code_url = $this->qrCodeGenerator->generateAndStoreQrCode($restaurant, $table);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to regenerate the QR code image',
                'error' => $e->getMessage(),
            ], 500);
        }

        $table->save();

        return response()->json([
            'success' => true,
            'message' => 'QR code regenerated',
            'data' => $table->fresh(),
        ]);
    }

    /**
     * End the active session on a table (mirrors SessionController::end, staff-initiated).
     */
    public function endSession(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $table = Table::where('restaurant_id', $restaurantId)->findOrFail($id);

        $session = $table->currentSession;

        if (! $session) {
            return response()->json([
                'success' => false,
                'message' => 'No active session on this table',
            ], 404);
        }

        $session->update([
            'status' => 'completed',
            'ended_at' => now(),
        ]);

        $session->participants()->whereNull('left_at')->update(['left_at' => now()]);

        $table->update([
            'status' => 'available',
            'current_session_id' => null,
        ]);

        event(new SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'message' => 'Session ended',
            'data' => $table->fresh(),
        ]);
    }
}
