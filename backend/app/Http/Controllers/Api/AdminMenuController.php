<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminMenuController extends Controller
{
    use ResolvesRestaurant;

    // ── Categories ──────────────────────────────────────────────

    public function categories(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $categories = Category::where('restaurant_id', $restaurantId)
            ->with(['menuItems' => fn ($q) => $q->orderBy('name')])
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $category = Category::create([
            'restaurant_id' => $restaurantId,
            'name' => $request->name,
            'slug' => $this->uniqueCategorySlug($restaurantId, $request->name),
            'description' => $request->description,
            'display_order' => $request->input('display_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $category = Category::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string',
            'display_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->filled('name') && $request->name !== $category->name) {
            $data['slug'] = $this->uniqueCategorySlug($restaurantId, $request->name, $category->id);
        }

        $category->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Category updated',
            'data' => $category->fresh(),
        ]);
    }

    /**
     * Delete a category. If it still has menu items (which would cascade-delete
     * them per the FK constraint), archive it instead of destroying the data.
     */
    public function destroyCategory(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $category = Category::where('restaurant_id', $restaurantId)->findOrFail($id);

        if ($category->menuItems()->exists()) {
            $category->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Category has menu items — archived (deactivated) instead of deleted',
                'data' => $category->fresh(),
            ]);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted',
        ]);
    }

    // ── Menu Items ──────────────────────────────────────────────

    public function items(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = MenuItem::where('restaurant_id', $restaurantId)->with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('name')->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $validator = Validator::make($request->all(), [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('restaurant_id', $restaurantId)],
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'preparation_time' => 'nullable|integer|min:0',
            'spice_level' => 'nullable|in:none,mild,medium,hot,extra_hot',
            'cuisine_type' => 'nullable|string|max:50',
            'calories' => 'nullable|integer|min:0',
            'is_vegetarian' => 'nullable|boolean',
            'is_vegan' => 'nullable|boolean',
            'is_gluten_free' => 'nullable|boolean',
            'is_available' => 'nullable|boolean',
            'is_signature' => 'nullable|boolean',
            'image_url' => 'nullable|url|max:500',
            'ar_model_url' => 'nullable|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['restaurant_id'] = $restaurantId;
        $data['slug'] = $this->uniqueItemSlug($restaurantId, $data['name']);
        $data['is_available'] = $request->boolean('is_available', true);

        $item = MenuItem::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Menu item created',
            'data' => $item->load('category'),
        ], 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'category_id' => ['sometimes', 'integer', Rule::exists('categories', 'id')->where('restaurant_id', $restaurantId)],
            'name' => 'sometimes|string|max:150',
            'description' => 'sometimes|nullable|string',
            'base_price' => 'sometimes|numeric|min:0',
            'preparation_time' => 'sometimes|integer|min:0',
            'spice_level' => 'sometimes|in:none,mild,medium,hot,extra_hot',
            'cuisine_type' => 'sometimes|nullable|string|max:50',
            'calories' => 'sometimes|nullable|integer|min:0',
            'is_vegetarian' => 'sometimes|boolean',
            'is_vegan' => 'sometimes|boolean',
            'is_gluten_free' => 'sometimes|boolean',
            'is_available' => 'sometimes|boolean',
            'is_signature' => 'sometimes|boolean',
            'image_url' => 'sometimes|nullable|url|max:500',
            'ar_model_url' => 'sometimes|nullable|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->filled('name') && $request->name !== $item->name) {
            $data['slug'] = $this->uniqueItemSlug($restaurantId, $request->name, $item->id);
        }

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Menu item updated',
            'data' => $item->fresh('category'),
        ]);
    }

    public function toggleAvailability(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);

        $item->update(['is_available' => ! $item->is_available]);

        return response()->json([
            'success' => true,
            'message' => $item->is_available ? 'Menu item marked available' : 'Menu item marked unavailable',
            'data' => $item->fresh(),
        ]);
    }

    /**
     * Delete a menu item. If it has order history, archive it (is_available=false)
     * instead of a hard delete so past orders keep a valid reference.
     */
    public function destroyItem(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);

        if (OrderItem::where('menu_item_id', $item->id)->exists()) {
            $item->update(['is_available' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Menu item has order history — archived (marked unavailable) instead of deleted',
                'data' => $item->fresh(),
            ]);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu item deleted',
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────────

    protected function uniqueCategorySlug(int $restaurantId, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            Category::where('restaurant_id', $restaurantId)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    protected function uniqueItemSlug(int $restaurantId, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            MenuItem::where('restaurant_id', $restaurantId)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
