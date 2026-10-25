<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\Table;
use App\Services\QRCodeGenerationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TablesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(QRCodeGenerationService $qrCodeService): void
    {
        // Get the Darbar Restaurant seeded by RestaurantMenuSeeder
        $restaurant = Restaurant::where('name', 'Darbar Restaurant')->first();

        if (! $restaurant) {
            $this->command->error('Restaurant not found. Please run RestaurantMenuSeeder first.');

            return;
        }

        $this->command->info("Seeding Tables for {$restaurant->name}...");

        // Ensure not to create duplicates if ran multiple times by cleaning up old ones for this restaurant
        // Preserve existing table tokens, sessions, and reservations on reruns.

        // Create 10 tables
        for ($i = 1; $i <= 10; $i++) {
            $tableNumber = (string) $i;
            $qrCodeUuid = Str::uuid()->toString();

            // Create table with no qr_code_url yet
            $table = Table::firstOrCreate([
                'restaurant_id' => $restaurant->id,
                'table_number' => $tableNumber,
            ], [
                'qr_code' => $qrCodeUuid,
                'capacity' => ($i <= 5) ? 4 : ($i <= 8 ? 6 : 2), // mix of 4, 6 and 2 seaters
                'status' => 'available',
            ]);

            if (! $table->wasRecentlyCreated) {
                continue;
            }

            // Hit the generation service to upload QR to S3 and get the link
            try {
                $qrUrl = $qrCodeService->generateAndStoreQrCode($restaurant, $table);

                // Update table with S3 URL
                $table->update([
                    'qr_code_url' => $qrUrl,
                ]);

                $this->command->info("Generated QR for Table {$tableNumber}: {$qrUrl}");
            } catch (\Exception $e) {
                // Failsafe catch block, mostly to point out missing credentials
                $this->command->error("Failed to generate/upload QR for Table {$tableNumber}: ".$e->getMessage());
            }
        }

        $this->command->info('Tables seeding completed.');
    }
}
