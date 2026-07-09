<?php

namespace App\Services;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptService
{
    /**
     * Generate a PDF receipt for a payment and upload it to S3.
     * Updates the payment record with receipt_url and receipt_s3_key.
     *
     * @param  Payment  $payment  Must be loaded with: order.items.menuItem, session.table, participant
     * @return string   The public S3 URL of the uploaded receipt
     *
     * @throws \Exception
     */
    public function generateAndStore(Payment $payment): string
    {
        // Load all required relationships
        $payment->loadMissing([
            'order.items.menuItem',
            'order.restaurant',
            'session.table',
            'participant',
        ]);

        // Render the Blade receipt template to HTML
        $pdf = Pdf::loadView('receipts.payment', [
            'payment' => $payment,
            'order'   => $payment->order,
            'session' => $payment->session,
        ]);

        $pdf->setPaper('A5', 'portrait');

        $pdfContent = $pdf->output();

        // Upload to S3
        $filename = $this->generateFilename($payment);
        $s3Key    = "receipts/{$filename}";

        Storage::disk('s3')->put($s3Key, $pdfContent, [
            'visibility'  => 'public',
            'ContentType' => 'application/pdf',
        ]);

        $url = Storage::disk('s3')->url($s3Key);

        // Persist on the payment record
        $payment->update([
            'receipt_url'    => $url,
            'receipt_s3_key' => $s3Key,
        ]);

        return $url;
    }

    /**
     * Generate a presigned download URL (expires in 1 hour).
     * Useful for private buckets.
     */
    public function getDownloadUrl(Payment $payment, int $expiresInMinutes = 60): string
    {
        if ($payment->receipt_s3_key) {
            return Storage::disk('s3')->temporaryUrl(
                $payment->receipt_s3_key,
                now()->addMinutes($expiresInMinutes)
            );
        }

        return $payment->receipt_url ?? '';
    }

    // ── Private helpers ──

    private function generateFilename(Payment $payment): string
    {
        $date      = now()->format('Y-m-d');
        $sessionId = $payment->session_id ?? 'no-session';
        $paymentId = $payment->id;
        $suffix    = Str::random(8);

        return "receipt_{$date}_session{$sessionId}_payment{$paymentId}_{$suffix}.pdf";
    }
}