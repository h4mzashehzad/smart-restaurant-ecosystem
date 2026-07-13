<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuItemImageService
{
    /**
     * Upload a menu item image to S3 and return the public URL.
     *
     * Path: restaurants/{restaurant-slug}/menu/{item-slug}.{ext}
     */
    public function upload(Restaurant $restaurant, MenuItem $item, UploadedFile $file): string
    {
        $safeRestaurantName = $restaurant->slug ?: Str::slug($restaurant->name);
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $fileName = ($item->slug ?: Str::slug($item->name)).'.'.$extension;
        $s3Path = 'restaurants/'.$safeRestaurantName.'/menu/'.$fileName;

        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            throw new \RuntimeException('Could not read the uploaded image file.');
        }

        $success = Storage::disk('s3')->put($s3Path, $contents, 'public');

        if (! $success) {
            $success = Storage::disk('s3')->put($s3Path, $contents);

            if (! $success) {
                throw new \RuntimeException(
                    'AWS S3 rejected the upload. Please verify S3 credentials and bucket configuration.'
                );
            }
        }

        return Storage::disk('s3')->url($s3Path);
    }
}
