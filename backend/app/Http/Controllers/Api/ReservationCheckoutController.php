<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReservationCheckoutRequest;
use App\Models\PaymentRefund;
use App\Models\Reservation;
use App\Services\ReservationPreorderService;
use App\Services\ReservationRefundService;
use App\Services\SafepayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationCheckoutController extends Controller
{
    use ResolvesRestaurant;

    public function store(ReservationCheckoutRequest $request, ReservationPreorderService $service): JsonResponse
    {
        abort_unless($request->filled('items'), 422, 'Choose at least one dish to preorder.');
        $reservation = $service->create($request->validated(), $request->user('sanctum')?->id);
        $result = $service->startPayment($reservation);

        return response()->json(['success' => true, 'data' => $result + ['reservation' => $service->view($reservation), 'management_url' => $reservation->managementUrl(), 'token' => $reservation->managementToken()]], 201);
    }

    public function show(Request $request, string $code, ReservationPreorderService $service): JsonResponse
    {
        $reservation = $this->authorized($request, $code);

        return response()->json(['success' => true, 'data' => $service->view($reservation, true)]);
    }

    public function verify(Request $request, string $code, SafepayService $gateway, ReservationPreorderService $service): JsonResponse
    {
        $reservation = $this->authorized($request, $code);
        $payment = $reservation->preorder?->payments()->first();
        abort_unless($payment && $payment->safepay_tracker_token, 409, 'No card checkout is associated with this reservation.');
        if (! $payment->paid_at) {
            $status = $gateway->fetchTrackerStatus($payment->safepay_tracker_token);
            if ($gateway->isTrackerPaid($status)) {
                $service->complete($payment, ['verification' => $status]);
            }
        }

        return response()->json(['success' => true, 'data' => $service->view($reservation->fresh(), true)]);
    }

    public function cancel(Request $request, string $code, ReservationRefundService $refunds, ReservationPreorderService $service): JsonResponse
    {
        $reservation = $refunds->cancel($this->authorized($request, $code));

        return response()->json(['success' => true, 'data' => $service->view($reservation, true)]);
    }

    public function retry(Request $request, string $code, ReservationPreorderService $service): JsonResponse
    {
        $reservation = $this->authorized($request, $code);

        return response()->json(['success' => true, 'data' => $service->startPayment($reservation)]);
    }

    public function receipt(Request $request, string $code, \App\Services\ReceiptService $receipts): \Symfony\Component\HttpFoundation\Response
    {
        $reservation = $this->authorized($request, $code);
        $payment = $reservation->preorder?->payments()->first();
        abort_unless($payment?->paid_at && $payment->receipt_s3_key, 409, 'Your receipt is being prepared. Please try again shortly.');
        $key = $payment->receipt_s3_key;
        foreach (array_unique(['local', config('filesystems.default', 'local')]) as $disk) {
            if ($disk !== 's3' && \Illuminate\Support\Facades\Storage::disk($disk)->exists($key)) {
                return \Illuminate\Support\Facades\Storage::disk($disk)->download($key, $payment->transaction_id.'.pdf');
            }
        }
        $url = $receipts->presignedUrl($payment);
        abort_unless($url, 404, 'Receipt not found.');

        return redirect()->away($url);
    }

    public function reconcileRefund(Request $request, PaymentRefund $refund, ReservationRefundService $service): JsonResponse
    {
        abort_unless($refund->reservation->restaurant_id === $this->restaurantId($request), 404);
        $service->reconcile($refund);
        if ($refund->fresh()->status === 'failed') {
            $refund->update(['status' => 'pending']);
            $service->process($refund);
        }

        return response()->json(['success' => true, 'data' => $refund->fresh()]);
    }

    private function authorized(Request $request, string $code): Reservation
    {
        $reservation = Reservation::query()->where('confirmation_code', $code)->firstOrFail();
        abort_unless(hash_equals($reservation->managementToken(), (string) $request->input('token', '')), 403, 'This reservation link is invalid. Please use the link in your email.');

        return $reservation;
    }
}
