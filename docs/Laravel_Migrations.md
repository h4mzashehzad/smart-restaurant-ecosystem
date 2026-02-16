# Laravel Migrations for AI-Powered Smart Restaurant Ecosystem

## Terminal Commands to Create Migrations

Run these commands in your Laravel project root directory:

```bash
# Authentication Tables
php artisan make:migration create_users_table
php artisan make:migration create_otp_verifications_table
php artisan make:migration create_personal_access_tokens_table

# Restaurant & Tables
php artisan make:migration create_restaurants_table
php artisan make:migration create_tables_table
php artisan make:migration create_table_sessions_table
php artisan make:migration create_session_participants_table

# Menu Management
php artisan make:migration create_categories_table
php artisan make:migration create_menu_items_table
php artisan make:migration create_ingredients_table
php artisan make:migration create_menu_item_ingredients_table

# Orders & Payments
php artisan make:migration create_orders_table
php artisan make:migration create_order_items_table
php artisan make:migration create_order_item_customizations_table
php artisan make:migration create_payments_table
php artisan make:migration create_split_bill_items_table

# Reservations & Queue
php artisan make:migration create_reservations_table
php artisan make:migration create_queue_entries_table

# Service & Feedback
php artisan make:migration create_service_requests_table
php artisan make:migration create_feedback_table
php artisan make:migration create_feedback_menu_items_table

# AI/ML Tables
php artisan make:migration create_ai_recommendations_table
php artisan make:migration create_user_preferences_table
php artisan make:migration create_demand_forecasts_table

# Loyalty & Analytics
php artisan make:migration create_loyalty_transactions_table
php artisan make:migration create_loyalty_rewards_table
php artisan make:migration create_analytics_events_table
```

---

## Migration Files

### 1. Users Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email', 150)->unique();
            $table->string('phone', 20)->unique()->nullable();
            $table->string('password');
            $table->enum('role', ['customer', 'staff', 'admin'])->default('customer');
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->enum('loyalty_tier', ['bronze', 'silver', 'gold'])->default('bronze');
            $table->unsignedInteger('loyalty_points')->default(0);
            $table->timestamps();

            $table->index('email');
            $table->index('phone');
            $table->index('role');
            $table->index('loyalty_tier');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
```

### 2. OTP Verifications Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('phone', 20);
            $table->string('otp_code', 6);
            $table->timestamp('expires_at');
            $table->boolean('verified')->default(false);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['phone', 'otp_code']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_verifications');
    }
};
```

### 3. Personal Access Tokens Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['tokenable_type', 'tokenable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
```

### 4. Restaurants Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 150)->nullable();
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('slug');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
```

### 5. Tables Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('table_number', 20);
            $table->string('qr_code')->unique();
            $table->unsignedTinyInteger('capacity')->default(4);
            $table->enum('status', ['available', 'occupied', 'reserved', 'maintenance'])->default('available');
            $table->unsignedBigInteger('current_session_id')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'table_number']);
            $table->index('qr_code');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
```

### 6. Table Sessions Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained()->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('session_token', 64)->unique();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->enum('status', ['active', 'checkout_pending', 'completed'])->default('active');

            $table->index('session_token');
            $table->index(['status', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_sessions');
    }
};
```

### 7. Session Participants Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('table_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('device_id', 100)->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();

            $table->index(['session_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_participants');
    }
};
```

### 8. Categories Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['restaurant_id', 'is_active']);
            $table->index('display_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
```

### 9. Menu Items Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name', 150);
            $table->string('slug', 150);
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->unsignedInteger('preparation_time')->default(15)->comment('Minutes');
            $table->enum('spice_level', ['none', 'mild', 'medium', 'hot', 'extra_hot'])->default('none');
            $table->string('cuisine_type', 50)->nullable();
            $table->unsignedInteger('calories')->nullable();
            $table->boolean('is_vegetarian')->default(false);
            $table->boolean('is_vegan')->default(false);
            $table->boolean('is_gluten_free')->default(false);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_signature')->default(false);
            $table->string('image_url', 500)->nullable();
            $table->string('ar_model_url', 500)->nullable();
            $table->decimal('popularity_score', 5, 2)->default(0.00);
            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->timestamps();

            $table->index(['restaurant_id', 'is_available']);
            $table->index('category_id');
            $table->index(['popularity_score']);
            $table->index('is_signature');
            $table->fullText(['name', 'description']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
```

### 10. Ingredients Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('name', 100);
            $table->string('unit', 20)->default('piece');
            $table->decimal('cost_per_unit', 10, 2)->default(0.00);
            $table->decimal('stock_quantity', 10, 2)->default(0.00);
            $table->decimal('minimum_threshold', 10, 2)->default(0.00);
            $table->boolean('is_allergen')->default(false);
            $table->string('allergen_type', 50)->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'name']);
            $table->index('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
```

### 11. Menu Item Ingredients Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->boolean('is_optional')->default(false);
            $table->boolean('is_removable')->default(true);
            $table->decimal('additional_price', 10, 2)->default(0.00);

            $table->unique(['menu_item_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_ingredients');
    }
};
```

### 12. Orders Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('table_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('order_number', 20)->unique();
            $table->enum('order_type', ['dine_in', 'takeaway'])->default('dine_in');
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('tax_amount', 10, 2)->default(0.00);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])->default('pending');
            $table->text('special_instructions')->nullable();
            $table->timestamp('placed_at')->useCurrent();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'status']);
            $table->index('session_id');
            $table->index('placed_at');
            $table->index(['status', 'placed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
```

### 13. Order Items Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('customization_notes')->nullable();

            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
```

### 14. Order Item Customizations Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_customizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->enum('action', ['add', 'remove', 'modify']);
            $table->decimal('quantity', 10, 2)->default(1.00);
            $table->decimal('price_adjustment', 10, 2)->default(0.00);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_customizations');
    }
};
```

### 15. Payments Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('participant_id')->nullable()->constrained('session_participants')->onDelete('set null');
            $table->enum('payment_method', ['cash', 'card', 'jazzcash', 'easypaisa', 'bank_transfer']);
            $table->enum('payment_type', ['full', 'split_equal', 'split_itemized'])->default('full');
            $table->decimal('amount', 10, 2);
            $table->string('transaction_id', 100)->unique()->nullable();
            $table->json('gateway_response')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('transaction_id');
            $table->index('status');
            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
```

### 16. Split Bill Items Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('split_bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('session_participants')->onDelete('cascade');
            $table->decimal('amount', 10, 2);

            $table->index('payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('split_bill_items');
    }
};
```

### 17. Reservations Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('guest_name', 100);
            $table->string('guest_phone', 20);
            $table->string('guest_email', 150)->nullable();
            $table->unsignedTinyInteger('party_size');
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->foreignId('table_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->text('special_requests')->nullable();
            $table->string('confirmation_code', 20)->unique();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'reservation_date']);
            $table->index('status');
            $table->index('confirmation_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
```

### 18. Queue Entries Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('guest_name', 100);
            $table->string('guest_phone', 20);
            $table->unsignedTinyInteger('party_size');
            $table->unsignedInteger('queue_number');
            $table->unsignedInteger('estimated_wait_time')->nullable()->comment('Minutes');
            $table->enum('status', ['waiting', 'called', 'seated', 'cancelled', 'no_show'])->default('waiting');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('seated_at')->nullable();

            $table->index(['restaurant_id', 'status']);
            $table->index('queue_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};
```

### 19. Service Requests Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('table_id')->constrained()->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('request_type', ['waiter_call', 'bill_request', 'water_refill', 'cutlery', 'complaint', 'other']);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'acknowledged', 'in_progress', 'resolved', 'cancelled'])->default('pending');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->index(['restaurant_id', 'status']);
            $table->index('priority');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
```

### 20. Feedback Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->unsignedTinyInteger('rating')->comment('Range: 1-5');
            $table->text('review_text')->nullable();
            $table->decimal('sentiment_score', 5, 4)->nullable()->comment('Range: -1 (negative) to +1 (positive)');
            $table->enum('sentiment_label', ['positive', 'neutral', 'negative'])->nullable();
            $table->decimal('sentiment_confidence', 5, 4)->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->string('flagged_reason')->nullable();
            $table->text('admin_response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'sentiment_label']);
            $table->index('is_flagged');
            $table->index('rating');
            $table->fullText('review_text');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
```

### 21. Feedback Menu Items Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('item_rating')->nullable()->comment('Range: 1-5');

            $table->unique(['feedback_id', 'menu_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_menu_items');
    }
};
```

### 22. AI Recommendations Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->decimal('recommendation_score', 5, 4);
            $table->string('recommendation_reason')->nullable();
            $table->json('context_data')->nullable()->comment('time_of_day, weather, previous_orders, etc');
            $table->boolean('was_accepted')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_recommendations');
    }
};
```

### 23. User Preferences Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('preference_type', ['cuisine', 'spice_level', 'dietary', 'price_range', 'category']);
            $table->string('preference_value', 100);
            $table->decimal('weight', 3, 2)->default(1.00);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['user_id', 'preference_type', 'preference_value']);
            $table->index(['user_id', 'preference_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
```

### 24. Demand Forecasts Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demand_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->nullable()->constrained()->onDelete('cascade');
            $table->date('forecast_date');
            $table->unsignedTinyInteger('hour_of_day')->comment('Range: 0-23');
            $table->unsignedInteger('predicted_quantity');
            $table->decimal('confidence_score', 5, 4)->nullable();
            $table->unsignedInteger('actual_quantity')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'menu_item_id', 'forecast_date', 'hour_of_day']);
            $table->index(['restaurant_id', 'forecast_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demand_forecasts');
    }
};
```

### 25. Loyalty Transactions Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('transaction_type', ['earned', 'redeemed', 'expired', 'adjusted']);
            $table->integer('points')->comment('Positive for earned, negative for redeemed');
            $table->unsignedInteger('balance_after');
            $table->string('description')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
    }
};
```

### 26. Loyalty Rewards Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->enum('tier', ['bronze', 'silver', 'gold']);
            $table->enum('reward_type', ['discount_percentage', 'discount_fixed', 'free_item', 'priority_seating']);
            $table->decimal('reward_value', 10, 2);
            $table->string('description');
            $table->unsignedInteger('minimum_points')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tier', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_rewards');
    }
};
```

### 27. Analytics Events Table Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('event_type', 50);
            $table->json('event_data');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['restaurant_id', 'event_type', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
```

---

## Running the Migrations

After creating all migration files with the code above, run:

```bash
php artisan migrate
```

To rollback all migrations:

```bash
php artisan migrate:rollback
```

To fresh migrate (drop all tables and re-migrate):

```bash
php artisan migrate:fresh
```

---

## Notes

1. **Foreign Key Constraints**: All foreign keys are properly configured with `constrained()` and cascade/set null actions.

2. **Indexes**: All necessary indexes from the SQL schema have been added for performance optimization.

3. **Enums**: Laravel's enum column type is used for all enum fields.

4. **Timestamps**: Laravel's `timestamps()` method is used where appropriate, and `useCurrent()` for custom timestamp columns.

5. **Unique Constraints**: Composite unique keys are implemented using the `unique()` method with arrays.

6. **Full-Text Indexes**: Added for searchable text fields like menu item names and feedback reviews.

7. **JSON Columns**: Used for flexible data storage like gateway responses and context data.

8. **Decimal Precision**: All monetary values use `decimal(10, 2)` and scores use appropriate precision.

9. **Comments**: Important fields include comments for clarity using the `comment()` method.

10. **Migration Order**: The migrations are numbered/ordered to respect foreign key dependencies.

---

## Additional Considerations

### Seeding Data

Create seeders for initial data:

```bash
php artisan make:seeder RestaurantSeeder
php artisan make:seeder CategorySeeder
php artisan make:seeder MenuItemSeeder
```

### Model Relationships

Remember to define relationships in your Eloquent models:

```php
// Example: Order model
class Order extends Model
{
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### Database Configuration

Ensure your `.env` file is properly configured:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=restaurant_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

---

**Created for**: AI-Powered Smart Restaurant Ecosystem  
**Version**: 1.0  
**Date**: February 16, 2026
