<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeGenerationService
{
    /**
     * Generate a QR Code for a given table, upload it to S3, and return the public URL.
     *
     * @return string S3 Public URL of the generated QR code image
     */
    public function generateAndStoreQrCode(Restaurant $restaurant, Table $table): string
    {
        // Construct the frontend URL encoded in the QR code
        // Prioritize QR_FRONTEND_URL (LAN IP for phone cameras) or FRONTEND_URL
        $configuredUrl = config('app.qr_frontend_url') ?: config('app.frontend_url') ?: env('QR_FRONTEND_URL', env('FRONTEND_URL', 'http://192.168.18.88:3000'));
        $origins = array_filter(array_map('trim', explode(',', (string) $configuredUrl)));
        $frontendUrl = rtrim($origins[0] ?? 'http://192.168.18.88:3000', '/');

        // This is the string that gets generated when scanned.
        // Example: http://192.168.18.88:3000/scan/550e8400-e29b-41d4-a716-446655440000
        $qrPayload = $frontendUrl.'/scan/'.$table->qr_code;

        // Generate the raw SVG image of the QR Code (avoids Imagick dependency)
        // Size 300x300, 10px margin
        $image = QrCode::format('svg')
            ->size(300)
            ->margin(1)
            ->generate($qrPayload);

        // Define the S3 storage path
        // e.g. restaurants/the-lahore-karahi/tables/table_1.svg
        $s3Path = $this->storagePath($restaurant, $table);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        // Upload to S3 disk with public visibility.
        // Note: Modern S3 buckets block ACLs by default, which can cause this to return `false` silently.
        $success = $disk->put($s3Path, $image, 'public');

        if (! $success) {
            // First attempt failed. Try uploading without the 'public' ACL flag.
            $success = $disk->put($s3Path, $image);

            if (! $success) {
                // Completely failed.
                throw new \Exception('AWS S3 rejected the upload completely. Please verify your S3 IAM Keys (especially s3:PutObject) and Bucket Name in your .env file.');
            }
        }

        // Return the public URL
        return $disk->url($s3Path);
    }

    /**
     * S3 object key for a table QR image.
     * e.g. restaurants/the-lahore-karahi/tables/table_1.svg
     */
    public function storagePath(Restaurant $restaurant, Table $table): string
    {
        $safeRestaurantName = $restaurant->slug ?: \Illuminate\Support\Str::slug($restaurant->name);
        $fileName = 'table_'.\Illuminate\Support\Str::slug($table->table_number).'.svg';

        return 'restaurants/'.$safeRestaurantName.'/tables/'.$fileName;
    }
}
