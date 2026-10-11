<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Models\Table;
use App\Services\QRCodeGenerationService;
use Illuminate\Console\Command;

class RegenerateTableQRCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tables:regenerate-qr {table_id? : Optional specific table ID to regenerate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Regenerate QR code SVG images on S3 using the configured QR frontend URL';

    /**
     * Execute the console command.
     */
    public function handle(QRCodeGenerationService $qrCodeGenerator): int
    {
        $tableId = $this->argument('table_id');
        $query = Table::query();

        if ($tableId) {
            $query->where('id', $tableId);
        }

        $tables = $query->get();

        if ($tables->isEmpty()) {
            $this->warn('No tables found.');
            return self::SUCCESS;
        }

        $this->info("Regenerating QR codes for {$tables->count()} table(s)...");

        foreach ($tables as $table) {
            $restaurant = Restaurant::find($table->restaurant_id);
            if (! $restaurant) {
                $this->warn("Skipping table {$table->id} (no restaurant found for restaurant_id: {$table->restaurant_id}).");
                continue;
            }

            try {
                $url = $qrCodeGenerator->generateAndStoreQrCode($restaurant, $table);
                $table->qr_code_url = $url;
                $table->save();
                $this->info("✓ Table {$table->table_number} (ID: {$table->id}) QR updated: {$url}");
            } catch (\Throwable $e) {
                $this->error("✗ Table {$table->table_number} (ID: {$table->id}) failed: {$e->getMessage()}");
            }
        }

        $this->info('Finished regenerating table QR codes.');
        return self::SUCCESS;
    }
}
