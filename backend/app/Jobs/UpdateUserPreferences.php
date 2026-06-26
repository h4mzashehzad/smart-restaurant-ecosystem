<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\UserPreference;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateUserPreferences implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $order;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = $this->order->user;
        
        if (!$user) {
            return; // Guest order
        }

        $this->order->load('orderItems.menuItem');

        foreach ($this->order->orderItems as $item) {
            $menuItem = $item->menuItem;
            if (!$menuItem) continue;

            $this->incrementPreference($user->id, 'cuisine_type', $menuItem->cuisine_type, 1.0);
            
            if ($menuItem->spice_level !== null) {
                $this->incrementPreference($user->id, 'spice_level', (string)$menuItem->spice_level, 0.5);
            }

            if ($menuItem->is_vegetarian) {
                $this->incrementPreference($user->id, 'is_vegetarian', '1', 0.5);
            }
            if ($menuItem->is_vegan) {
                $this->incrementPreference($user->id, 'is_vegan', '1', 0.5);
            }
            if ($menuItem->is_gluten_free) {
                $this->incrementPreference($user->id, 'is_gluten_free', '1', 0.5);
            }
        }
    }

    private function incrementPreference($userId, $type, $value, $weightInc)
    {
        if (!$value) return;

        $pref = UserPreference::firstOrCreate(
            ['user_id' => $userId, 'preference_type' => $type, 'preference_value' => $value],
            ['weight' => 0]
        );

        $pref->weight += $weightInc;
        
        // Cap weight to 10 for normalization
        if ($pref->weight > 10.0) {
            $pref->weight = 10.0;
        }

        $pref->save();
    }
}
