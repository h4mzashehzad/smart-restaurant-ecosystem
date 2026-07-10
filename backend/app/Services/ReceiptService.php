<?php

namespace App\Services;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptService
{
    public function generateAndStore(Payment $payment): Payment
    {
        $payment->loadMissing([
            'order.items.menuItem',
            'order.restaurant',
            'order.table',
            'participant',
            'splitBillItems.orderItem.menuItem',
        ]);

        $pdf = Pdf::loadView('receipts.payment', [
            'payment' => $payment,
            'order' => $payment->order,
            'restaurant' => $payment->order?->restaurant,
        ]);

        $filename = 'receipts/'.($payment->order?->order_number ?? 'PAY-'.$payment->id).'-'.$payment->id.'-'.Str::random(6).'.pdf';
        $content = $pdf->output();

        try {
            $disk = config('filesystems.default') === 's3' || filled(config('filesystems.disks.s3.bucket'))
                ? 's3'
                : config('filesystems.default', 'local');

            Storage::disk($disk)->put($filename, $content);

            $url = $disk === 's3'
                ? Storage::disk('s3')->url($filename)
                : Storage::disk($disk)->url($filename);

            $payment->update([
                'receipt_url' => $url,
                'receipt_s3_key' => $filename,
            ]);
        } catch (\Throwable $e) {
            Log::error('Receipt upload failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            // Still store a local fallback so the flow can continue.
            Storage::disk('local')->put($filename, $content);
            $payment->update([
                'receipt_url' => Storage::disk('local')->url($filename),
                'receipt_s3_key' => $filename,
            ]);
        }

        return $payment->fresh();
    }

    public function presignedUrl(Payment $payment): ?string
    {
        if (! $payment->receipt_s3_key) {
            return $payment->receipt_url;
        }

        try {
            if (filled(config('filesystems.disks.s3.bucket'))) {
                return Storage::disk('s3')->temporaryUrl(
                    $payment->receipt_s3_key,
                    now()->addMinutes(30)
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Could not create S3 temporary URL', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $payment->receipt_url;
    }
}
