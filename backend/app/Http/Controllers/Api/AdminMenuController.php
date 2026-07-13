<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Services\MenuItemImageService;
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
            ->with(['menuItems' => fn ($q) => $q->orderBy('name')->with('ingredients')])
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

    // ── Ingredients ─────────────────────────────────────────────

    public function ingredients(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $ingredients = Ingredient::where('restaurant_id', $restaurantId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ingredients,
        ]);
    }

    public function storeIngredient(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ingredients', 'name')->where('restaurant_id', $restaurantId),
            ],
            'unit' => 'nullable|string|max:20',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|numeric|min:0',
            'minimum_threshold' => 'nullable|numeric|min:0',
            'is_allergen' => 'nullable|boolean',
            'allergen_type' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['restaurant_id'] = $restaurantId;
        $data['unit'] = $data['unit'] ?? 'piece';
        $data['cost_per_unit'] = $data['cost_per_unit'] ?? 0;
        $data['stock_quantity'] = $data['stock_quantity'] ?? 0;
        $data['minimum_threshold'] = $data['minimum_threshold'] ?? 0;
        $data['is_allergen'] = $request->boolean('is_allergen', false);

        if (! $data['is_allergen']) {
            $data['allergen_type'] = null;
        }

        $ingredient = Ingredient::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Ingredient created',
            'data' => $ingredient,
        ], 201);
    }

    public function updateIngredient(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $ingredient = Ingredient::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('ingredients', 'name')
                    ->where('restaurant_id', $restaurantId)
                    ->ignore($ingredient->id),
            ],
            'unit' => 'sometimes|string|max:20',
            'cost_per_unit' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|numeric|min:0',
            'minimum_threshold' => 'sometimes|numeric|min:0',
            'is_allergen' => 'sometimes|boolean',
            'allergen_type' => 'sometimes|nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (array_key_exists('is_allergen', $data) && ! $data['is_allergen']) {
            $data['allergen_type'] = null;
        }

        $ingredient->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Ingredient updated',
            'data' => $ingredient->fresh(),
        ]);
    }

    // ── Menu Items ──────────────────────────────────────────────

    public function items(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = MenuItem::where('restaurant_id', $restaurantId)->with(['category', 'ingredients']);

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

        $validator = Validator::make($request->all(), $this->itemRules($restaurantId));

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $ingredients = $data['ingredients'] ?? null;
        unset($data['ingredients']);

        $data['restaurant_id'] = $restaurantId;
        $data['slug'] = $this->uniqueItemSlug($restaurantId, $data['name']);
        $data['is_available'] = $request->boolean('is_available', true);

        $item = MenuItem::create($data);

        if (is_array($ingredients)) {
            $this->syncIngredients($item, $ingredients);
        }

        return response()->json([
            'success' => true,
            'message' => 'Menu item created',
            'data' => $item->load(['category', 'ingredients']),
        ], 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), $this->itemRules($restaurantId, true));

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $hasIngredients = array_key_exists('ingredients', $data);
        $ingredients = $data['ingredients'] ?? [];
        unset($data['ingredients']);

        if ($request->filled('name') && $request->name !== $item->name) {
            $data['slug'] = $this->uniqueItemSlug($restaurantId, $request->name, $item->id);
        }

        if ($data !== []) {
            $item->update($data);
        }

        if ($hasIngredients) {
            $this->syncIngredients($item, $ingredients);
        }

        return response()->json([
            'success' => true,
            'message' => 'Menu item updated',
            'data' => $item->fresh(['category', 'ingredients']),
        ]);
    }

    public function uploadImage(Request $request, int $id, MenuItemImageService $imageService): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);
        $restaurant = Restaurant::findOrFail($restaurantId);

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png,webp,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $url = $imageService->upload($restaurant, $item, $request->file('image'));
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }

        $item->update(['image_url' => $url]);

        return response()->json([
            'success' => true,
            'message' => 'Menu item image uploaded',
            'data' => $item->fresh(['category', 'ingredients']),
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
            'data' => $item->fresh(['category', 'ingredients']),
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
                'data' => $item->fresh(['category', 'ingredients']),
            ]);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Menu item deleted',
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    protected function itemRules(int $restaurantId, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $optional = $partial ? 'sometimes' : 'nullable';

        return [
            'category_id' => [$required, 'integer', Rule::exists('categories', 'id')->where('restaurant_id', $restaurantId)],
            'name' => "$required|string|max:150",
            'description' => "$optional|nullable|string",
            'base_price' => "$required|numeric|min:0",
            'preparation_time' => "$optional|integer|min:0",
            'spice_level' => "$optional|in:none,mild,medium,hot,extra_hot",
            'cuisine_type' => "$optional|nullable|string|max:50",
            'calories' => "$optional|nullable|integer|min:0",
            'is_vegetarian' => "$optional|boolean",
            'is_vegan' => "$optional|boolean",
            'is_gluten_free' => "$optional|boolean",
            'is_available' => "$optional|boolean",
            'is_signature' => "$optional|boolean",
            'image_url' => "$optional|nullable|url|max:500",
            'ar_model_url' => "$optional|nullable|url|max:500",
            'ingredients' => "$optional|array",
            'ingredients.*.ingredient_id' => [
                'required_with:ingredients',
                'integer',
                Rule::exists('ingredients', 'id')->where('restaurant_id', $restaurantId),
            ],
            'ingredients.*.quantity' => 'required_with:ingredients|numeric|min:0',
            'ingredients.*.is_optional' => 'nullable|boolean',
            'ingredients.*.is_removable' => 'nullable|boolean',
        ];
    }

    /**
     * @param  array<int, array{ingredient_id: int, quantity: float|int|string, is_optional?: bool, is_removable?: bool}>  $ingredients
     */
    protected function syncIngredients(MenuItem $item, array $ingredients): void
    {
        $syncData = [];

        foreach ($ingredients as $row) {
            $ingredientId = (int) $row['ingredient_id'];
            $syncData[$ingredientId] = [
                'quantity' => $row['quantity'],
                'is_optional' => (bool) ($row['is_optional'] ?? false),
                'is_removable' => (bool) ($row['is_removable'] ?? true),
            ];
        }

        $item->ingredients()->sync($syncData);
    }

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
