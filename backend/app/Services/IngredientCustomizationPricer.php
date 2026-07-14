<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\MenuItemIngredient;
use Illuminate\Validation\ValidationException;

class IngredientCustomizationPricer
{
    /**
     * Validate and price ingredient customizations for a menu item.
     *
     * @param  array<int, array{ingredient_id: int, action: string, quantity?: float|int|string}>  $customizations
     * @return array{
     *     unit_price_adjustment: float,
     *     normalized_rows: array<int, array{ingredient_id: int, action: string, quantity: float, price_adjustment: float}>
     * }
     *
     * @throws ValidationException
     */
    public function price(MenuItem $menuItem, array $customizations): array
    {
        if ($customizations === []) {
            return [
                'unit_price_adjustment' => 0.0,
                'normalized_rows' => [],
            ];
        }

        $pivots = $menuItem->menuItemIngredients()
            ->with('ingredient')
            ->get()
            ->keyBy('ingredient_id');

        $unitPriceAdjustment = 0.0;
        $normalizedRows = [];

        foreach ($customizations as $index => $customization) {
            $ingredientId = (int) ($customization['ingredient_id'] ?? 0);
            $action = (string) ($customization['action'] ?? '');
            $quantity = (float) ($customization['quantity'] ?? 1);

            /** @var MenuItemIngredient|null $pivot */
            $pivot = $pivots->get($ingredientId);

            if (! $pivot) {
                throw ValidationException::withMessages([
                    "customizations.{$index}.ingredient_id" => 'This ingredient is not linked to the selected menu item.',
                ]);
            }

            $name = $pivot->ingredient?->name ?? "ingredient #{$ingredientId}";
            $priceAdjustment = 0.0;

            match ($action) {
                'modify' => $this->assertModifyAllowed($pivot, $quantity, $name, $index),
                'remove' => $this->assertRemoveAllowed($pivot, $name, $index),
                'add' => $this->assertAddAllowed($pivot, $name, $index),
                default => throw ValidationException::withMessages([
                    "customizations.{$index}.action" => 'Invalid customization action.',
                ]),
            };

            if ($action === 'modify') {
                $defaultQuantity = (float) $pivot->quantity;
                $extraUnits = max(0, $quantity - $defaultQuantity);
                $priceAdjustment = round($extraUnits * (float) $pivot->extra_unit_price, 2);
            } elseif ($action === 'add') {
                $priceAdjustment = round((float) $pivot->additional_price * max(1, $quantity), 2);
            }

            $unitPriceAdjustment += $priceAdjustment;

            $normalizedRows[] = [
                'ingredient_id' => $ingredientId,
                'action' => $action,
                'quantity' => $quantity,
                'price_adjustment' => $priceAdjustment,
            ];
        }

        return [
            'unit_price_adjustment' => round($unitPriceAdjustment, 2),
            'normalized_rows' => $normalizedRows,
        ];
    }

    protected function assertModifyAllowed(
        MenuItemIngredient $pivot,
        float $quantity,
        string $name,
        int $index
    ): void {
        if (! $pivot->is_adjustable) {
            throw ValidationException::withMessages([
                "customizations.{$index}.ingredient_id" => "{$name} cannot be adjusted on this item.",
            ]);
        }

        $min = (float) $pivot->min_quantity;
        $max = $pivot->max_quantity !== null ? (float) $pivot->max_quantity : null;

        if ($quantity < $min) {
            throw ValidationException::withMessages([
                "customizations.{$index}.quantity" => "{$name} quantity cannot be less than {$min}.",
            ]);
        }

        if ($max !== null && $quantity > $max) {
            throw ValidationException::withMessages([
                "customizations.{$index}.quantity" => "{$name} quantity cannot be greater than {$max}.",
            ]);
        }
    }

    protected function assertRemoveAllowed(
        MenuItemIngredient $pivot,
        string $name,
        int $index
    ): void {
        if (! $pivot->is_removable && ! $pivot->is_optional) {
            throw ValidationException::withMessages([
                "customizations.{$index}.ingredient_id" => "{$name} cannot be removed from this item.",
            ]);
        }
    }

    protected function assertAddAllowed(
        MenuItemIngredient $pivot,
        string $name,
        int $index
    ): void {
        if (! $pivot->is_optional && ! $pivot->is_adjustable) {
            throw ValidationException::withMessages([
                "customizations.{$index}.ingredient_id" => "{$name} cannot be added as a customization on this item.",
            ]);
        }
    }
}
