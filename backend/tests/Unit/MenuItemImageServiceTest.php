<?php

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Services\MenuItemImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('menu item image uploads to restaurants slug menu path on s3', function () {
    Storage::fake('s3');

    $restaurant = new Restaurant([
        'name' => 'The Lahore Karahi',
        'slug' => 'the-lahore-karahi',
    ]);

    $item = new MenuItem([
        'name' => 'Butter Chicken',
        'slug' => 'butter-chicken',
    ]);

    $file = UploadedFile::fake()->image('dish.jpg', 400, 300);

    $url = app(MenuItemImageService::class)->upload($restaurant, $item, $file);

    Storage::disk('s3')->assertExists('restaurants/the-lahore-karahi/menu/butter-chicken.jpg');
    expect($url)->toContain('restaurants/the-lahore-karahi/menu/butter-chicken.jpg');
});

test('menu item image falls back to restaurant name slug when slug missing', function () {
    Storage::fake('s3');

    $restaurant = new Restaurant([
        'name' => 'Spice Route',
        'slug' => null,
    ]);

    $item = new MenuItem([
        'name' => 'Dal Makhani',
        'slug' => 'dal-makhani',
    ]);

    $file = UploadedFile::fake()->image('dal.png');

    app(MenuItemImageService::class)->upload($restaurant, $item, $file);

    Storage::disk('s3')->assertExists('restaurants/spice-route/menu/dal-makhani.png');
});
