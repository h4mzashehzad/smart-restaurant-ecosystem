<?php

namespace App\Console\Commands;

use App\Models\DemandForecast;
use App\Models\Restaurant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateDemandForecast extends Command
{
    protected $signature = 'ml:generate-demand-forecast
                            {restaurant_id? : Optional restaurant ID to forecast for}
                            {--date= : Forecast date (Y-m-d). Defaults to tomorrow}
                            {--lookback=60 : Days of history to send to the ML service}';

    protected $description = 'Generate ML demand forecasts for restaurants and store them in demand_forecasts';

    public function handle(): int
    {
        $restaurantId = $this->argument('restaurant_id');
        $forecastDate = $this->option('date') ?: now()->addDay()->toDateString();
        $lookback = (int) $this->option('lookback');

        $restaurants = $restaurantId
            ? Restaurant::where('id', $restaurantId)->where('is_active', true)->get()
            : Restaurant::where('is_active', true)->get();

        if ($restaurants->isEmpty()) {
            $this->warn('No active restaurants found.');

            return self::SUCCESS;
        }

        $mlServiceUrl = rtrim((string) config('services.ml.url'), '/').'/api/ml/forecast/demand';
        $this->info("Generating demand forecasts for {$restaurants->count()} restaurant(s) for {$forecastDate}...");

        foreach ($restaurants as $restaurant) {
            try {
                $response = Http::timeout(120)->post($mlServiceUrl, [
                    'restaurant_id' => $restaurant->id,
                    'forecast_date' => $forecastDate,
                    'lookback_days' => $lookback,
                ]);

                if (! $response->successful()) {
                    $body = $response->json();
                    $detail = is_array($body)
                        ? ($body['error'] ?? $response->body())
                        : $response->body();
                    $this->error("HTTP {$response->status()} for restaurant {$restaurant->id}: {$detail}");
                    Log::warning('Demand forecast request failed', [
                        'restaurant_id' => $restaurant->id,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    continue;
                }

                $data = $response->json();

                if (! ($data['success'] ?? false)) {
                    $this->error("ML service error for restaurant {$restaurant->id}: ".($data['error'] ?? 'unknown'));

                    continue;
                }

                if ($data['insufficient_data'] ?? false) {
                    $this->warn("Insufficient data for restaurant {$restaurant->id}: ".($data['reason'] ?? 'n/a'));

                    continue;
                }

                $forecasts = $data['forecasts'] ?? [];
                $upserted = 0;

                foreach ($forecasts as $item) {
                    $menuItemId = $item['menu_item_id'] ?? null;
                    if (! $menuItemId) {
                        continue;
                    }

                    foreach ($item['hourly_predictions'] ?? [] as $hourly) {
                        DemandForecast::updateOrCreate(
                            [
                                'restaurant_id' => $restaurant->id,
                                'menu_item_id' => $menuItemId,
                                'forecast_date' => $forecastDate,
                                'hour_of_day' => (int) $hourly['hour'],
                            ],
                            [
                                'predicted_quantity' => (int) ($hourly['quantity'] ?? 0),
                                'confidence_score' => $hourly['confidence'] ?? null,
                            ]
                        );
                        $upserted++;
                    }
                }

                $this->info("Restaurant {$restaurant->id}: upserted {$upserted} forecast rows.");
            } catch (\Throwable $e) {
                Log::error("Failed to generate demand forecast for restaurant {$restaurant->id}: ".$e->getMessage());
                $this->error("Exception for restaurant {$restaurant->id}: ".$e->getMessage());
            }
        }

        $this->info('Demand forecast generation completed.');

        return self::SUCCESS;
    }
}
