<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeGenerationService
{
    /**
     * Generate a QR Code for a given table, upload it to S3, and return the public URL.
     *
     * @param Restaurant $restaurant
     * @param Table $table
     * @return string S3 Public URL of the generated QR code image
     */
    public function generateAndStoreQrCode(Restaurant $restaurant, Table $table): string
    {
        // Construct the frontend URL encoded in the QR code
        // Ensure the frontend URL doesn't have a trailing slash
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        
        // This is the string that gets generated when scanned. 
        // Example: http://192.168.1.100:3000/scan/550e8400-e29b-41d4-a716-446655440000
        $qrPayload = $frontendUrl . '/scan/' . $table->qr_code;

        // Generate the raw SVG image of the QR Code (avoids Imagick dependency)
        // Size 300x300, 10px margin
        $image = QrCode::format('svg')
            ->size(300)
            ->margin(1)
            ->generate($qrPayload);

        // Define the S3 storage path
        // e.g. restaurants/the-lahore-karahi/tables/table_1.svg
        $safeRestaurantName = $restaurant->slug ?: \Illuminate\Support\Str::slug($restaurant->name);
        $fileName = 'table_' . \Illuminate\Support\Str::slug($table->table_number) . '.svg';
        $s3Path = 'restaurants/' . $safeRestaurantName . '/tables/' . $fileName;

        // Upload to S3 disk with public visibility. 
        // Note: Modern S3 buckets block ACLs by default, which can cause this to return `false` silently.
        $success = Storage::disk('s3')->put($s3Path, $image, 'public');
        
        if (!$success) {
            // First attempt failed. Try uploading without the 'public' ACL flag.
            $success = Storage::disk('s3')->put($s3Path, $image);
            
            if (!$success) {
                // Completely failed.
                throw new \Exception("AWS S3 rejected the upload completely. Please verify your S3 IAM Keys (especially s3:PutObject) and Bucket Name in your .env file.");
            }
        }

        // Return the public URL
        return Storage::disk('s3')->url($s3Path);
    }
}
