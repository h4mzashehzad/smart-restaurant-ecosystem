<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\AiRecommendation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateRecommendations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ml:generate-recommendations {user_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate AI menu recommendations for users using the ML service';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        
        $users = $userId ? User::where('id', $userId)->get() : User::all();
        $mlServiceUrl = env('ML_SERVICE_URL', 'http://localhost:5000') . '/api/ml/recommendations/generate';

        $this->info("Starting recommendation generation for {$users->count()} users...");

        foreach ($users as $user) {
            try {
                $response = Http::post($mlServiceUrl, [
                    'user_id' => $user->id,
                    'max_recommendations' => 10,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    
                    if (isset($data['success']) && $data['success'] && isset($data['recommendations'])) {
                        // Clear old recommendations
                        AiRecommendation::where('user_id', $user->id)->delete();
                        
                        // Insert new recommendations
                        foreach ($data['recommendations'] as $rec) {
                            AiRecommendation::create([
                                'user_id' => $user->id,
                                'menu_item_id' => $rec['menu_item_id'],
                                'recommendation_score' => $rec['score'] ?? 0,
                                'recommendation_reason' => $rec['reason'] ?? '',
                            ]);
                        }
                        $this->info("Successfully generated recommendations for user {$user->id}");
                    } else {
                        $this->error("ML Service returned unsuccessful response for user {$user->id}");
                    }
                } else {
                    $this->error("HTTP request failed for user {$user->id}: " . $response->status());
                }
            } catch (\Exception $e) {
                Log::error("Failed to generate recommendations for user {$user->id}: " . $e->getMessage());
                $this->error("Exception for user {$user->id}: " . $e->getMessage());
            }
        }

        $this->info('Recommendation generation completed.');
    }
}
