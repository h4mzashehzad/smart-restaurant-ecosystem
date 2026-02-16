<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\JsonResponse;

class TableController extends Controller
{
    /**
     * Scan QR code and return table info + active session.
     */
    public function scan(string $qrCode): JsonResponse
    {
        $table = Table::with('restaurant')
            ->where('qr_code', $qrCode)
            ->first();

        if (! $table) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code',
            ], 404);
        }

        $activeSession = $table->currentSession;

        return response()->json([
            'success' => true,
            'data'    => [
                'table'   => $table,
                'session' => $activeSession,
                'action'  => $activeSession ? 'join_existing_session' : 'start_new_session',
            ],
        ]);
    }
}
