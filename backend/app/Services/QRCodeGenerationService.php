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
        $image = $this->generateSvg($table);

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

    public function generateSvg(Table $table): string
    {
        $configured = config('app.qr_frontend_url') ?: config('app.frontend_url') ?: 'http://localhost:3000';
        $origins = array_values(array_filter(array_map('trim', explode(',', (string) $configured))));
        $origin = rtrim($origins[0] ?? 'http://localhost:3000', '/');

        return (string) QrCode::format('svg')->size(300)->margin(1)->generate($origin.'/scan/'.$table->qr_code);
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
