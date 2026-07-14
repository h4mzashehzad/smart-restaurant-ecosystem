<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * Get full menu for a restaurant (categories + items).
     */
    public function index(Restaurant $restaurant): JsonResponse
    {
        $menu = $restaurant->categories()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->with(['menuItems' => function ($q) {
                $q->where('is_available', true)->orderBy('name')->with('ingredients');
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $menu,
        ]);
    }

    /**
     * Get categories for a restaurant.
     */
    public function categories(Restaurant $restaurant): JsonResponse
    {
        $categories = $restaurant->categories()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get items in a specific category.
     */
    public function categoryItems(Category $category): JsonResponse
    {
        $items = $category->menuItems()
            ->where('is_available', true)
            ->with('ingredients')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get single menu item detail with ingredients.
     */
    public function show(MenuItem $item): JsonResponse
    {
        $item->load(['category', 'ingredients']);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Get ingredients for a menu item.
     */
    public function ingredients(MenuItem $item): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $item->ingredients,
        ]);
    }

    /**
     * Search menu items by name/description.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        $items = MenuItem::where('is_available', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%")
                    ->orWhere('cuisine_type', 'like', "%{$query}%");
            })
            ->with(['category', 'ingredients'])
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get AI-powered recommended items for the authenticated user, or popular items for guests.
     */
    public function recommended(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        if ($user) {
            // Fetch recommendations — fall back to popular items if no AI recs exist
            $recommendations = $user->aiRecommendations()
                ->with('menuItem.ingredients')
                ->orderByDesc('recommendation_score')
                ->limit(10)
                ->get();

            if ($recommendations->isNotEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => $recommendations->map(fn ($rec) => $rec->menuItem),
                    'source' => 'ai',
                ]);
            }
        }

        // Fallback: return popular items
        $items = MenuItem::where('is_available', true)
            ->with('ingredients')
            ->orderByDesc('popularity_score')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
            'source' => 'popularity',
        ]);
    }
}
