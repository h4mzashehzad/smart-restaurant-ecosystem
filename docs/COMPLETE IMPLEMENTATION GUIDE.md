<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# **COMPLETE IMPLEMENTATION GUIDE**

## **AI-Powered Smart Restaurant Ecosystem**

### **Junior Engineer Instructional Manual**

**Author:** Senior Software Engineer
**Target Audience:** Junior Developer
**Project Duration:** 9 Months (March - November 2026)
**Estimated Reading Time:** 45 minutes

***

## **TABLE OF CONTENTS**

1. [Prerequisites \& Environment Setup](#1-prerequisites--environment-setup)
2. [Project Initialization](#2-project-initialization)
3. [Database Setup \& Migrations](#3-database-setup--migrations)
4. [Backend Development (Laravel API)](#4-backend-development-laravel-api)
5. [Frontend Development (Next.js PWA)](#5-frontend-development-nextjs-pwa)
6. [Real-Time System (Socket.io)](#6-real-time-system-socketio)
7. [ML Service (Python/Flask)](#7-ml-service-pythonflask)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Module-by-Module Implementation](#9-module-by-module-implementation)
10. [Testing \& Quality Assurance](#10-testing--quality-assurance)
11. [Deployment Procedures](#11-deployment-procedures)
12. [Troubleshooting Guide](#12-troubleshooting-guide)

***

## **1. PREREQUISITES \& ENVIRONMENT SETUP**

### **1.1 Required Software Installation**

#### **Step 1: Install Homebrew (macOS) / Chocolatey (Windows)**

**macOS:**

```bash
# Open Terminal and run:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

**Windows:**

```powershell
# Open PowerShell as Administrator and run:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

**Linux (Ubuntu/Debian):**

```bash
# Update package manager
sudo apt update && sudo apt upgrade -y
```


***

#### **Step 2: Install Git**

```bash
# macOS
brew install git

# Windows
choco install git -y

# Linux
sudo apt install git -y

# Verify installation
git --version
# Expected output: git version 2.x.x
```

**Configure Git:**

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
```


***

#### **Step 3: Install Node.js and npm**

```bash
# macOS
brew install node@18

# Windows
choco install nodejs-lts -y

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
# Expected: v18.x.x

npm --version
# Expected: 9.x.x
```


***

#### **Step 4: Install PHP 8.2**

```bash
# macOS
brew install php@8.2
brew link php@8.2 --force

# Windows
choco install php -y

# Linux
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd php8.2-redis -y

# Verify installation
php --version
# Expected: PHP 8.2.x
```


***

#### **Step 5: Install Composer (PHP Package Manager)**

```bash
# macOS/Linux
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Windows
choco install composer -y

# Verify installation
composer --version
# Expected: Composer version 2.x.x
```


***

#### **Step 6: Install MySQL 8.0**

```bash
# macOS
brew install mysql@8.0
brew services start mysql@8.0

# Windows
choco install mysql -y

# Linux
sudo apt install mysql-server mysql-client -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
# Follow prompts:
# - Set root password: YourStrongPassword123!
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y

# Verify installation
mysql --version
# Expected: mysql Ver 8.0.x
```

**Create Database User:**

```bash
mysql -u root -p
# Enter your root password

# Run these SQL commands:
CREATE DATABASE restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'restaurant_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON restaurant_db.* TO 'restaurant_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test connection
mysql -u restaurant_user -p restaurant_db
# Enter password: SecurePassword123!
# If you see mysql> prompt, it worked!
EXIT;
```


***

#### **Step 7: Install Redis**

```bash
# macOS
brew install redis
brew services start redis

# Windows
choco install redis-64 -y
redis-server --service-install
redis-server --service-start

# Linux
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli ping
# Expected: PONG
```


***

#### **Step 8: Install Python 3.10+**

```bash
# macOS
brew install python@3.10

# Windows
choco install python310 -y

# Linux
sudo apt install python3.10 python3.10-venv python3.10-dev python3-pip -y

# Verify installation
python3 --version
# Expected: Python 3.10.x

pip3 --version
# Expected: pip 23.x.x
```


***

#### **Step 9: Install Docker \& Docker Compose**

```bash
# macOS
brew install --cask docker
# Open Docker Desktop from Applications folder

# Windows
choco install docker-desktop -y
# Restart computer after installation

# Linux
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
# Expected: Docker version 24.x.x

docker compose version
# Expected: Docker Compose version v2.x.x
```


***

#### **Step 10: Install Code Editor (VS Code)**

```bash
# macOS
brew install --cask visual-studio-code

# Windows
choco install vscode -y

# Linux
sudo snap install --classic code

# Launch VS Code
code
```

**Install Essential VS Code Extensions:**

```bash
# Open VS Code terminal (Ctrl+` or Cmd+`) and run:
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bmewburn.vscode-intelephense-client
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
code --install-extension PKief.material-icon-theme
code --install-extension GitHub.copilot  # Optional but recommended
```


***

### **1.2 Development Tools**

#### **Install Postman (API Testing)**

```bash
# macOS
brew install --cask postman

# Windows
choco install postman -y

# Linux
sudo snap install postman
```


#### **Install TablePlus (Database GUI)**

```bash
# macOS
brew install --cask tableplus

# Windows
choco install tableplus -y

# Linux - Download from https://tableplus.com/linux
```


#### **Install Redis Insight (Redis GUI)**

```bash
# Download from: https://redis.com/redis-enterprise/redis-insight/
# Install following platform-specific instructions
```


***

## **2. PROJECT INITIALIZATION**

### **2.1 Create Project Root Directory**

```bash
# Navigate to your development folder
cd ~/Development  # macOS/Linux
cd C:\Development  # Windows

# Create project root
mkdir smart-restaurant-ecosystem
cd smart-restaurant-ecosystem

# Initialize Git repository
git init
echo "# AI-Powered Smart Restaurant Ecosystem" > README.md
git add README.md
git commit -m "Initial commit"

# Create GitHub repository (replace YOUR_USERNAME)
# Go to https://github.com/new and create a repo named: smart-restaurant-ecosystem
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-restaurant-ecosystem.git
git push -u origin main
```


***

### **2.2 Create Project Structure**

```bash
# Create all directories at once
mkdir -p backend frontend socket-server ml-service database nginx docs

# Create .gitignore in root
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Docker volumes
mysql-data/
redis-data/
EOF

git add .gitignore
git commit -m "Add project structure and .gitignore"
```

**Your project structure should now look like:**

```
smart-restaurant-ecosystem/
├── backend/              # Laravel API
├── frontend/             # Next.js PWA
├── socket-server/        # Socket.io Server
├── ml-service/           # Python ML Service
├── database/             # Database scripts
├── nginx/                # Nginx config
├── docs/                 # Documentation
├── .gitignore
└── README.md
```


***

### **2.3 Initialize Laravel Backend**

```bash
cd backend

# Create Laravel project
composer create-project laravel/laravel . "^10.0"

# Install required packages
composer require laravel/sanctum
composer require predis/predis
composer require guzzlehttp/guzzle

# Install development packages
composer require --dev laravel/sail
composer require --dev barryvdh/laravel-debugbar

# Publish Sanctum configuration
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Create .env file from example
cp .env.example .env

# Generate application key
php artisan key:generate

# Open .env and configure database
cat > .env << 'EOF'
APP_NAME="Smart Restaurant API"
APP_ENV=local
APP_KEY=base64:your_generated_key_here
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=restaurant_db
DB_USERNAME=restaurant_user
DB_PASSWORD=SecurePassword123!

BROADCAST_DRIVER=redis
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost

FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:5000

WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=ap-south-1
AWS_BUCKET=

EOF

# Test database connection
php artisan migrate:status
# If you see "Migration table created successfully", you're good!
```

**Configure CORS:**

```bash
# Edit config/cors.php
cat > config/cors.php << 'EOF'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
EOF
```


***

### **2.4 Initialize Next.js Frontend**

```bash
cd ../frontend

# Create Next.js app with TypeScript and Tailwind CSS
npx create-next-app@latest . --typescript --tailwind --app --use-npm --import-alias "@/*"
# Answer prompts:
# Would you like to use ESLint? Yes
# Would you like to use `src/` directory? Yes
# Would you like to use App Router? Yes
# Would you like to customize the default import alias? No

# Install dependencies
npm install axios socket.io-client zustand react-query
npm install @headlessui/react @heroicons/react
npm install three @react-three/fiber @react-three/drei
npm install react-qr-code qrcode
npm install date-fns
npm install zod react-hook-form @hookform/resolvers

# Install development dependencies
npm install -D @types/three
npm install -D prettier prettier-plugin-tailwindcss

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Smart Restaurant
EOF

# Create prettier config
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF
```


***

### **2.5 Initialize Socket.io Server**

```bash
cd ../socket-server

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express socket.io ioredis cors dotenv
npm install -D nodemon typescript @types/node @types/express @types/cors

# Create TypeScript config
npx tsc --init

# Create .env file
cat > .env << 'EOF'
PORT=3001
REDIS_URL=redis://127.0.0.1:6379
LARAVEL_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF

# Create directory structure
mkdir -p src/{handlers,middleware,utils}

# Update package.json scripts
npm pkg set scripts.dev="nodemon src/server.js"
npm pkg set scripts.start="node src/server.js"
```


***

### **2.6 Initialize Python ML Service**

```bash
cd ../ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
.\venv\Scripts\activate  # Windows

# Create requirements.txt
cat > requirements.txt << 'EOF'
flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
mysql-connector-python==8.2.0
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
scipy==1.11.4
textblob==0.17.1
spacy==3.7.2
gunicorn==21.2.0
EOF

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# Create .env file
cat > .env << 'EOF'
FLASK_ENV=development
FLASK_APP=app.py
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=SecurePassword123!
MODEL_PATH=./models
EOF

# Create directory structure
mkdir -p models data utils

# Deactivate virtual environment (we'll activate it when needed)
deactivate
```


***

## **3. DATABASE SETUP \& MIGRATIONS**

### **3.1 Create Laravel Migrations**

```bash
cd ../backend

# Generate all migration files
php artisan make:migration create_restaurants_table
php artisan make:migration create_tables_table
php artisan make:migration create_table_sessions_table
php artisan make:migration create_session_participants_table
php artisan make:migration create_categories_table
php artisan make:migration create_menu_items_table
php artisan make:migration create_ingredients_table
php artisan make:migration create_menu_item_ingredients_table
php artisan make:migration create_orders_table
php artisan make:migration create_order_items_table
php artisan make:migration create_order_item_customizations_table
php artisan make:migration create_payments_table
php artisan make:migration create_split_bill_items_table
php artisan make:migration create_reservations_table
php artisan make:migration create_queue_entries_table
php artisan make:migration create_service_requests_table
php artisan make:migration create_feedback_table
php artisan make:migration create_feedback_menu_items_table
php artisan make:migration create_ai_recommendations_table
php artisan make:migration create_user_preferences_table
php artisan make:migration create_demand_forecasts_table
php artisan make:migration create_loyalty_transactions_table
php artisan make:migration create_loyalty_rewards_table
php artisan make:migration create_analytics_events_table
php artisan make:migration create_otp_verifications_table
php artisan make:migration add_loyalty_fields_to_users_table
```


***

### **3.2 Write Migration Code**

**Example: Users Table (modify default migration)**

```bash
# Open database/migrations/2014_10_12_000000_create_users_table.php
```

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
            $table->rememberToken();
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

**Example: Restaurants Table**

```php
<?php
// database/migrations/xxxx_xx_xx_create_restaurants_table.php

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

**Example: Orders Table**

```php
<?php
// database/migrations/xxxx_xx_xx_create_orders_table.php

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
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
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

**⚠️ IMPORTANT NOTE:** Due to space constraints, I'm showing 3 example migrations. You'll need to create all 25+ migrations following the same pattern using the database schema from the SDD document. Each migration should:

- Use proper data types
- Add foreign key constraints
- Include indexes for frequently queried columns
- Follow Laravel naming conventions

***

### **3.3 Run Migrations**

```bash
# Still in backend directory

# Run all migrations
php artisan migrate

# Expected output:
# Migration table created successfully.
# Migrating: 2014_10_12_000000_create_users_table
# Migrated:  2014_10_12_000000_create_users_table (45.67ms)
# Migrating: 2014_10_12_100000_create_password_reset_tokens_table
# Migrated:  2014_10_12_100000_create_password_reset_tokens_table (34.21ms)
# ...and so on

# Verify tables were created
php artisan tinker
>>> DB::select('SHOW TABLES');
>>> exit
```

**If you make a mistake:**

```bash
# Rollback last migration batch
php artisan migrate:rollback

# Rollback all migrations and re-run
php artisan migrate:fresh

# Rollback and re-seed database
php artisan migrate:fresh --seed
```


***

### **3.4 Create Database Seeders**

```bash
# Create seeders
php artisan make:seeder RestaurantSeeder
php artisan make:seeder TableSeeder
php artisan make:seeder UserSeeder
php artisan make:seeder CategorySeeder
php artisan make:seeder MenuItemSeeder
```

**Example: RestaurantSeeder**

```php
<?php
// database/seeders/RestaurantSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('restaurants')->insert([
            'name' => 'The Golden Fork',
            'slug' => 'golden-fork',
            'address' => 'F-7 Markaz, Islamabad, Pakistan',
            'phone' => '+92-51-2345678',
            'email' => 'info@goldenfork.pk',
            'opening_time' => '11:00:00',
            'closing_time' => '23:00:00',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
```

**Example: UserSeeder**

```php
<?php
// database/seeders/UserSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        DB::table('users')->insert([
            'name' => 'Admin User',
            'email' => 'admin@goldenfork.pk',
            'phone' => '+923001234567',
            'password' => Hash::make('Admin123!'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Kitchen Staff
        DB::table('users')->insert([
            'name' => 'Kitchen Staff',
            'email' => 'kitchen@goldenfork.pk',
            'phone' => '+923009876543',
            'password' => Hash::make('Kitchen123!'),
            'role' => 'staff',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Test Customer
        DB::table('users')->insert([
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
            'phone' => '+923001111111',
            'password' => Hash::make('Customer123!'),
            'role' => 'customer',
            'loyalty_tier' => 'silver',
            'loyalty_points' => 750,
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
```

**Update DatabaseSeeder:**

```php
<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RestaurantSeeder::class,
            TableSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            MenuItemSeeder::class,
        ]);
    }
}
```

**Run Seeders:**

```bash
php artisan db:seed

# Or run specific seeder
php artisan db:seed --class=RestaurantSeeder

# Fresh migration with seeding
php artisan migrate:fresh --seed
```


***

## **4. BACKEND DEVELOPMENT (LARAVEL API)**

### **4.1 Create Models**

```bash
# Generate models with all features
php artisan make:model Restaurant
php artisan make:model Table
php artisan make:model TableSession
php artisan make:model Category
php artisan make:model MenuItem
php artisan make:model Ingredient
php artisan make:model Order
php artisan make:model OrderItem
php artisan make:model Payment
php artisan make:model Reservation
php artisan make:model ServiceRequest
php artisan make:model Feedback
```

**Example: Order Model**

```php
<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'table_id',
        'session_id',
        'user_id',
        'order_number',
        'order_type',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status',
        'special_instructions',
        'placed_at',
        'confirmed_at',
        'ready_at',
        'completed_at',
    ];

    protected $casts = [
        'placed_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'ready_at' => 'datetime',
        'completed_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected $appends = [
        'elapsed_minutes',
        'urgency_level',
    ];

    // Relationships
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Accessors
    public function getElapsedMinutesAttribute(): int
    {
        return now()->diffInMinutes($this->placed_at);
    }

    public function getUrgencyLevelAttribute(): string
    {
        $minutes = $this->elapsed_minutes;
        
        if ($minutes < 5) {
            return 'green';
        } elseif ($minutes >= 5 && $minutes < 10) {
            return 'yellow';
        } else {
            return 'red';
        }
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed', 'preparing']);
    }

    public function scopeForRestaurant($query, int $restaurantId)
    {
        return $query->where('restaurant_id', $restaurantId);
    }

    // Methods
    public static function generateOrderNumber(): string
    {
        return 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999);
    }

    public function updateStatus(string $newStatus): void
    {
        $this->update(['status' => $newStatus]);

        // Set timestamps based on status
        if ($newStatus === 'confirmed' && !$this->confirmed_at) {
            $this->update(['confirmed_at' => now()]);
        } elseif ($newStatus === 'ready' && !$this->ready_at) {
            $this->update(['ready_at' => now()]);
        } elseif ($newStatus === 'completed' && !$this->completed_at) {
            $this->update(['completed_at' => now()]);
        }

        // Broadcast event to Socket.io
        broadcast(new \App\Events\OrderStatusUpdated($this))->toOthers();
    }
}
```


***

### **4.2 Create Controllers**

```bash
# Generate API controllers
php artisan make:controller Api/AuthController
php artisan make:controller Api/TableController
php artisan make:controller Api/SessionController
php artisan make:controller Api/MenuController
php artisan make:controller Api/OrderController
php artisan make:controller Api/PaymentController
php artisan make:controller Api/ReservationController
php artisan make:controller Api/ServiceRequestController
php artisan make:controller Api/FeedbackController
php artisan make:controller Api/LoyaltyController
php artisan make:controller Api/AdminController
```

**Example: AuthController**

```php
<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 86400,
            ]
        ]);
    }

    /**
     * Request OTP for phone verification
     */
    public function requestOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate 6-digit OTP
        $otpCode = sprintf("%06d", rand(0, 999999));

        // Save OTP to database
        OtpVerification::create([
            'phone' => $request->phone,
            'otp_code' => $otpCode,
            'expires_at' => now()->addMinutes(10),
        ]);

        // TODO: Send OTP via WhatsApp API
        // For now, return it in response (only in development!)
        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
            'data' => [
                'otp_code' => $otpCode, // Remove in production!
                'expires_in' => 600,
            ]
        ]);
    }

    /**
     * Verify OTP
     */
    public function verifyOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'otp_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $otp = OtpVerification::where('phone', $request->phone)
            ->where('otp_code', $request->otp_code)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP'
            ], 400);
        }

        // Mark as verified
        $otp->update(['verified' => true]);

        // Update user phone verification
        User::where('phone', $request->phone)->update([
            'phone_verified_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Phone verified successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
```

**Example: OrderController**

```php
<?php
// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Events\OrderCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Create new order
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|exists:table_sessions,id',
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array|min:1|max:20',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:10',
            'items.*.customizations' => 'nullable|array',
            'special_instructions' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            // Calculate totals
            $subtotal = 0;
            foreach ($request->items as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                $itemTotal = $menuItem->base_price * $item['quantity'];
                
                // Add customization prices
                if (isset($item['customizations'])) {
                    // Calculate customization costs
                }
                
                $subtotal += $itemTotal;
            }

            $taxAmount = $subtotal * 0.12; // 12% tax
            $totalAmount = $subtotal + $taxAmount;

            // Create order
            $order = Order::create([
                'restaurant_id' => 1, // Get from authenticated restaurant
                'table_id' => $request->table_id,
                'session_id' => $request->session_id,
                'user_id' => auth()->id(),
                'order_number' => Order::generateOrderNumber(),
                'order_type' => 'dine_in',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'special_instructions' => $request->special_instructions,
                'placed_at' => now(),
            ]);

            // Create order items
            foreach ($request->items as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $menuItem->base_price,
                    'total_price' => $menuItem->base_price * $item['quantity'],
                ]);
            }

            // Broadcast event to Socket.io
            broadcast(new OrderCreated($order->load('items.menuItem')))->toOthers();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => [
                    'order' => $order->load('items.menuItem')
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order details
     */
    public function show($id)
    {
        $order = Order::with(['items.menuItem', 'table', 'user'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,preparing,ready,served,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $order = Order::findOrFail($id);
        $order->updateStatus($request->status);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
            'data' => $order
        ]);
    }

    /**
     * Get active orders for restaurant
     */
    public function active(Request $request)
    {
        $restaurantId = 1; // Get from auth

        $orders = Order::with(['items.menuItem', 'table'])
            ->forRestaurant($restaurantId)
            ->active()
            ->orderBy('placed_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
}
```


***

### **4.3 Define API Routes**

```php
<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/request-otp', [AuthController::class, 'requestOTP']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    // Tables & Sessions
    Route::get('/tables/{qrCode}/scan', [TableController::class, 'scan']);
    Route::post('/tables/{table}/start-session', [TableController::class, 'startSession']);
    Route::post('/sessions/{session}/join', [TableController::class, 'joinSession']);
    Route::get('/sessions/{session}', [TableController::class, 'getSession']);
    
    // Menu
    Route::get('/restaurants/{restaurant}/menu', [MenuController::class, 'index']);
    Route::get('/menu-items/{item}', [MenuController::class, 'show']);
    Route::get('/menu-items/recommended', [MenuController::class, 'recommended']);
    
    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::get('/orders/active', [OrderController::class, 'active']);
    
    // Payments
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::post('/payments/split-bill', [PaymentController::class, 'splitBill']);
});

// Webhook routes (for Socket.io callbacks)
Route::post('/webhooks/order-status', [OrderController::class, 'webhookStatusUpdate']);
```


***

### **4.4 Create Events for Broadcasting**

```bash
php artisan make:event OrderCreated
php artisan make:event OrderStatusUpdated
```

**Example: OrderCreated Event**

```php
<?php
// app/Events/OrderCreated.php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function broadcastOn()
    {
        return new Channel('laravel_database_order:created');
    }

    public function broadcastWith()
    {
        return [
            'order' => $this->order,
            'restaurant_id' => $this->order->restaurant_id,
        ];
    }
}
```


***

### **4.5 Configure Broadcasting**

```bash
# Edit config/broadcasting.php
```

```php
<?php

return [
    'default' => env('BROADCAST_DRIVER', 'redis'),

    'connections' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
    ],
];
```

**Update .env:**

```bash
BROADCAST_DRIVER=redis
QUEUE_CONNECTION=redis
```

**Run queue worker (in separate terminal):**

```bash
cd backend
php artisan queue:work
```


***

### **4.6 Test API Endpoints**

```bash
# Start Laravel development server
php artisan serve

# In another terminal, test endpoints
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+923001234567",
    "password": "Password123!",
    "password_confirmation": "Password123!"
  }'

# Expected output:
# {
#   "success": true,
#   "message": "Registration successful",
#   "data": {
#     "user": {...},
#     "token": "1|abcdef..."
#   }
# }
```

**Use Postman for better testing:**

1. Open Postman
2. Import collection from `backend/postman_collection.json` (create this file)
3. Set environment variables:
    - `BASE_URL`: http://localhost:8000/api
    - `TOKEN`: (set after login)

***

## **5. FRONTEND DEVELOPMENT (NEXT.JS PWA)**

### **5.1 Setup Project Structure**

```bash
cd ../frontend

# Create directory structure
mkdir -p src/{components,lib,hooks,contexts,types}
mkdir -p src/app/{api,auth,menu,order,kitchen,admin}
mkdir -p src/components/{layout,ui,customer,kitchen,admin}
```

**Your structure should look like:**

```
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── menu/
│   │   ├── order/
│   │   ├── kitchen/
│   │   ├── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── customer/
│   │   ├── kitchen/
│   │   └── admin/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── contexts/
│   └── types/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```


***

### **5.2 Create API Client**

```typescript
// src/lib/api.ts

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data.data;
  }

  // Table & Session endpoints
  async scanQRCode(qrCode: string) {
    const response = await this.client.get(`/tables/${qrCode}/scan`);
    return response.data.data;
  }

  async startSession(tableId: number) {
    const response = await this.client.post(`/tables/${tableId}/start-session`);
    return response.data.data;
  }

  // Menu endpoints
  async getMenu(restaurantId: number) {
    const response = await this.client.get(`/restaurants/${restaurantId}/menu`);
    return response.data.data;
  }

  async getMenuItem(itemId: number) {
    const response = await this.client.get(`/menu-items/${itemId}`);
    return response.data.data;
  }

  async getRecommendations() {
    const response = await this.client.get('/menu-items/recommended');
    return response.data.data;
  }

  // Order endpoints
  async createOrder(orderData: any) {
    const response = await this.client.post('/orders', orderData);
    return response.data.data;
  }

  async getOrder(orderId: number) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data.data;
  }

  async getActiveOrders() {
    const response = await this.client.get('/orders/active');
    return response.data.data;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const response = await this.client.patch(`/orders/${orderId}/status`, { status });
    return response.data.data;
  }
}

export const api = new ApiClient();
```


***

### **5.3 Create Socket.io Client**

```typescript
// src/lib/socket.ts

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Kitchen Display methods
  joinKitchen(restaurantId: number) {
    this.socket?.emit('kitchen:join', restaurantId);
  }

  onOrderCreated(callback: (order: any) => void) {
    this.socket?.on('order:created', callback);
  }

  onOrderStatusChanged(callback: (data: any) => void) {
    this.socket?.on('order:status:changed', callback);
  }

  updateOrderStatus(orderId: number, status: string) {
    this.socket?.emit('order:update:status', { orderId, status });
  }

  // Customer table methods
  joinTable(restaurantId: number, tableId: number) {
    this.socket?.emit('table:join', { restaurantId, tableId });
  }

  onStatusChanged(callback: (data: any) => void) {
    this.socket?.on('status:changed', callback);
  }

  offOrderCreated(callback?: (order: any) => void) {
    this.socket?.off('order:created', callback);
  }

  offOrderStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('order:status:changed', callback);
  }
}

export const socketClient = new SocketClient();
```


***

### **5.4 Create React Context for Auth**

```typescript
// src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  loyalty_tier: string;
  loyalty_points: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.data.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const register = async (data: any) => {
    const response = await api.register(data);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```


***

### **5.5 Create Login Page**

```typescript
// src/app/auth/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/menu');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a href="/auth/register" className="text-indigo-600 hover:text-indigo-500">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
```


***

### **5.6 Create Menu Display Component**

```typescript
// src/components/customer/MenuDisplay.tsx

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  spice_level: string;
  is_vegetarian: boolean;
  is_available: boolean;
}

export default function MenuDisplay({ restaurantId }: { restaurantId: number }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu(restaurantId);
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (itemId: number) => {
    const newCart = new Map(cart);
    newCart.set(itemId, (newCart.get(itemId) || 0) + 1);
    setCart(newCart);
  };

  const removeFromCart = (itemId: number) => {
    const newCart = new Map(cart);
    const currentQty = newCart.get(itemId) || 0;
    if (currentQty > 1) {
      newCart.set(itemId, currentQty - 1);
    } else {
      newCart.delete(itemId);
    }
    setCart(newCart);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Menu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={item.image_url || '/placeholder-food.jpg'}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                {item.is_vegetarian && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Veg
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-indigo-600">
                  Rs. {item.base_price}
                </span>
                {item.is_available ? (
                  <div className="flex items-center space-x-2">
                    {cart.get(item.id) ? (
                      <>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          -
                        </button>
                        <span className="font-semibold">{cart.get(item.id)}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-red-500 font-medium">Unavailable</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                {Array.from(cart.values()).reduce((a, b) => a + b, 0)} items in cart
              </p>
            </div>
            <button
              onClick={() => {/* Navigate to cart */}}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```


***

## **6. REAL-TIME SYSTEM (SOCKET.IO)**

### **6.1 Create Socket.io Server**

```bash
cd ../socket-server
```

```javascript
// src/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Redis setup
const redis = new Redis(process.env.REDIS_URL);
const redisSubscriber = new Redis(process.env.REDIS_URL);

// Subscribe to Laravel broadcast channels
redisSubscriber.subscribe('laravel_database_order:created');
redisSubscriber.subscribe('laravel_database_order:status:updated');

// Handle Redis messages
redisSubscriber.on('message', async (channel, message) => {
  try {
    const data = JSON.parse(message);
    console.log(`Received message on ${channel}:`, data);

    if (channel === 'laravel_database_order:created') {
      const { order, restaurant_id } = data;

      // Cache order in Redis
      await redis.setex(
        `order:${order.id}:details`,
        7200,
        JSON.stringify(order)
      );

      // Add to pending orders set
      await redis.sadd(`order:pending:${restaurant_id}`, order.id);

      // Broadcast to kitchen display
      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:created', order);

      // Broadcast to customer table
      io.to(`table:restaurant_${restaurant_id}_table_${order.table_id}`).emit('order:confirmed', {
        orderId: order.id,
        orderNumber: order.order_number,
        estimatedTime: order.estimated_time
      });

      console.log(`Order ${order.id} broadcast to kitchen and table`);
    }

    if (channel === 'laravel_database_order:status:updated') {
      const { order_id, status, restaurant_id, table_id } = data;

      // Update cached order
      const cachedOrder = await redis.get(`order:${order_id}:details`);
      if (cachedOrder) {
        const order = JSON.parse(cachedOrder);
        order.status = status;
        await redis.setex(`order:${order_id}:details`, 7200, JSON.stringify(order));
      }

      // Remove from pending if completed
      if (['completed', 'cancelled'].includes(status)) {
        await redis.srem(`order:pending:${restaurant_id}`, order_id);
      }

      // Broadcast status update
      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:status:changed', {
        orderId: order_id,
        status
      });

      io.to(`table:restaurant_${restaurant_id}_table_${table_id}`).emit('status:changed', {
        orderId: order_id,
        status
      });

      console.log(`Order ${order_id} status updated to ${status}`);
    }
  } catch (error) {
    console.error('Error processing Redis message:', error);
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Kitchen display joins
  socket.on('kitchen:join', async (restaurantId) => {
    socket.join(`kitchen:restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined kitchen room for restaurant ${restaurantId}`);

    // Send active orders on connect
    try {
      const activeOrderIds = await redis.smembers(`order:pending:${restaurantId}`);
      const orders = await Promise.all(
        activeOrderIds.map(async (id) => {
          const orderData = await redis.get(`order:${id}:details`);
          return orderData ? JSON.parse(orderData) : null;
        })
      );

      const validOrders = orders.filter(o => o !== null);
      socket.emit('kitchen:initial:orders', validOrders);
      console.log(`Sent ${validOrders.length} active orders to ${socket.id}`);
    } catch (error) {
      console.error('Error sending initial orders:', error);
    }
  });

  // Customer table joins
  socket.on('table:join', ({ restaurantId, tableId }) => {
    const room = `table:restaurant_${restaurantId}_table_${tableId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined table room ${room}`);
  });

  // Kitchen staff updates order status
  socket.on('order:update:status', async (data) => {
    const { orderId, status } = data;
    console.log(`Received status update for order ${orderId}: ${status}`);

    try {
      // Trigger Laravel webhook to update database
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, status })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      console.log(`Order ${orderId} status updated via webhook`);
    } catch (error) {
      console.error('Error updating order status:', error);
      socket.emit('error', { message: 'Failed to update order status' });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Error handler
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Redis URL: ${process.env.REDIS_URL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    redis.disconnect();
    redisSubscriber.disconnect();
    console.log('Server closed');
    process.exit(0);
  });
});
```


***

### **6.2 Start Socket.io Server**

```bash
# Make sure you're in socket-server directory
npm run dev

# Expected output:
# Socket.io server running on port 3001
# Environment: development
# Redis URL: redis://127.0.0.1:6379
# Frontend URL: http://localhost:3000
```


***

## **7. ML SERVICE (PYTHON/FLASK)**

### **7.1 Create Flask Application**

```bash
cd ../ml-service
source venv/bin/activate  # Activate virtual environment
```

```python
# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import mysql.connector
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT', 3306)),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'ML Service'
    })

# Recommendation endpoint (placeholder)
@app.route('/api/ml/recommendations/generate', methods=['POST'])
def generate_recommendations():
    data = request.get_json()
    
    user_id = data.get('user_id')
    context = data.get('context', {})
    max_recommendations = data.get('max_recommendations', 5)
    
    # TODO: Implement recommendation algorithm
    # For now, return mock data
    
    recommendations = [
        {
            'menu_item_id': 87,
            'score': 0.92,
            'reason': 'Popular choice on Friday evenings',
            'confidence': 0.87
        },
        {
            'menu_item_id': 112,
            'score': 0.88,
            'reason': 'Frequently ordered together',
            'confidence': 0.82
        }
    ]
    
    return jsonify({
        'success': True,
        'recommendations': recommendations[:max_recommendations],
        'model_version': 'v1.0.0',
        'generated_at': datetime.now().isoformat()
    })

# Sentiment analysis endpoint (placeholder)
@app.route('/api/ml/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    
    feedback_id = data.get('feedback_id')
    text = data.get('text')
    rating = data.get('rating')
    
    # TODO: Implement sentiment analysis
    # For now, return mock data
    
    sentiment = {
        'overall_score': 0.65,
        'label': 'positive',
        'confidence': 0.89,
        'aspects': {
            'food_quality': {
                'score': 0.95,
                'label': 'positive',
                'keywords': ['amazing', 'best']
            },
            'service': {
                'score': -0.34,
                'label': 'negative',
                'keywords': ['slow']
            }
        },
        'should_flag': False,
        'processed_at': datetime.now().isoformat()
    }
    
    return jsonify({
        'success': True,
        'sentiment': sentiment
    })

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=(os.getenv('FLASK_ENV') == 'development')
    )
```


***

### **7.2 Start Flask Server**

```bash
# Make sure virtual environment is activated
python app.py

# Expected output:
#  * Serving Flask app 'app'
#  * Debug mode: on
#  * Running on http://0.0.0.0:5000
```


***

## **8. THIRD-PARTY INTEGRATIONS**

### **8.1 WhatsApp Business API Setup**

**Step 1: Create Meta Business Account**

1. Go to https://business.facebook.com/
2. Create a business account
3. Navigate to Business Settings > Accounts > WhatsApp Accounts
4. Click "Add" and follow setup wizard

**Step 2: Get API Credentials**

1. Go to https://developers.facebook.com/apps
2. Create a new app > Select "Business"
3. Add WhatsApp product
4. Copy your:
    - Phone Number ID
    - WhatsApp Business Account ID
    - Access Token

**Step 3: Update Laravel .env**

```bash
# backend/.env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_TOKEN=your_access_token
```

**Step 4: Create WhatsApp Service**

```php
<?php
// app/Services/WhatsAppService.php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $client;
    protected $apiUrl;
    protected $phoneNumberId;
    protected $accessToken;

    public function __construct()
    {
        $this->client = new Client();
        $this->apiUrl = config('services.whatsapp.api_url');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->accessToken = config('services.whatsapp.access_token');
    }

    public function sendOTP(string $phone, string $code): bool
    {
        try {
            $response = $this->client->post(
                "{$this->apiUrl}/{$this->phoneNumberId}/messages",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$this->accessToken}",
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'messaging_product' => 'whatsapp',
                        'to' => $phone,
                        'type' => 'template',
                        'template' => [
                            'name' => 'otp_verification',
                            'language' => ['code' => 'en'],
                            'components' => [
                                [
                                    'type' => 'body',
                                    'parameters' => [
                                        ['type' => 'text', 'text' => $code]
                                    ]
                                ],
                                [
                                    'type' => 'button',
                                    'sub_type' => 'url',
                                    'index' => 0,
                                    'parameters' => [
                                        ['type' => 'text', 'text' => $code]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            );

            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            Log::error('WhatsApp OTP failed: ' . $e->getMessage());
            return false;
        }
    }

    public function sendOrderConfirmation(string $phone, string $orderNumber): bool
    {
        try {
            $response = $this->client->post(
                "{$this->apiUrl}/{$this->phoneNumberId}/messages",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$this->accessToken}",
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'messaging_product' => 'whatsapp',
                        'to' => $phone,
                        'type' => 'text',
                        'text' => [
                            'body' => "Your order {$orderNumber} has been confirmed! We'll notify you when it's ready."
                        ]
                    ]
                ]
            );

            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            Log::error('WhatsApp order confirmation failed: ' . $e->getMessage());
            return false;
        }
    }
}
```


***

### **8.2 JazzCash Payment Integration**

**Step 1: Register with JazzCash**

1. Contact JazzCash Merchant Services: merchant@jazzcash.com.pk
2. Submit business documents
3. Receive Merchant ID, Password, and Integrity Salt

**Step 2: Update .env**

```bash
# backend/.env
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
JAZZCASH_RETURN_URL=http://localhost:8000/api/payments/jazzcash/callback
JAZZCASH_CHECKOUT_URL=https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/
```

**Step 3: Create Payment Service**

```php
<?php
// app/Services/JazzCashService.php

namespace App\Services;

use App\Models\Payment;

class JazzCashService
{
    protected $merchantId;
    protected $password;
    protected $integritySalt;
    protected $returnUrl;
    protected $checkoutUrl;

    public function __construct()
    {
        $this->merchantId = config('services.jazzcash.merchant_id');
        $this->password = config('services.jazzcash.password');
        $this->integritySalt = config('services.jazzcash.integrity_salt');
        $this->returnUrl = config('services.jazzcash.return_url');
        $this->checkoutUrl = config('services.jazzcash.checkout_url');
    }

    public function initiatePayment(Payment $payment): array
    {
        $amount = $payment->amount * 100; // Convert to paisa
        $txnDateTime = now()->format('YmdHis');
        $expiryDateTime = now()->addHours(1)->format('YmdHis');

        // Build hash string
        $hashString = $this->integritySalt . '&' .
                      $amount . '&' .
                      '' . '&' . // Basket ID (optional)
                      '' . '&' . // Currency (PKR by default)
                      $txnDateTime . '&' .
                      '' . '&' . // Discount amount
                      '' . '&' . // Email
                      $expiryDateTime . '&' .
                      '' . '&' . // Mobile number
                      $this->merchantId . '&' .
                      $this->password . '&' .
                      $this->returnUrl . '&' .
                      '' . '&' . // Sale (blank)
                      '' . '&' . // Shipping charges
                      $payment->transaction_id . '&' .
                      '' . '&' . // Transaction type
                      'v2.0';

        $secureHash = hash_hmac('sha256', $hashString, $this->integritySalt);

        return [
            'payment_url' => $this->checkoutUrl,
            'params' => [
                'pp_Version' => 'v2.0',
                'pp_TxnType' => 'MWALLET',
                'pp_MerchantID' => $this->merchantId,
                'pp_Password' => $this->password,
                'pp_TxnRefNo' => $payment->transaction_id,
                'pp_Amount' => $amount,
                'pp_TxnCurrency' => 'PKR',
                'pp_TxnDateTime' => $txnDateTime,
                'pp_BillReference' => "ORD-{$payment->order_id}",
                'pp_Description' => 'Restaurant Order Payment',
                'pp_TxnExpiryDateTime' => $expiryDateTime,
                'pp_ReturnURL' => $this->returnUrl,
                'pp_SecureHash' => $secureHash,
            ]
        ];
    }

    public function verifyCallback(array $data): bool
    {
        // Verify the response hash
        $receivedHash = $data['pp_SecureHash'] ?? '';
        
        // Build verification hash string
        $hashString = $this->integritySalt . '&' .
                      ($data['pp_Amount'] ?? '') . '&' .
                      ($data['pp_ResponseCode'] ?? '') . '&' .
                      ($data['pp_ResponseMessage'] ?? '') . '&' .
                      ($data['pp_TxnRefNo'] ?? '');

        $calculatedHash = hash_hmac('sha256', $hashString, $this->integritySalt);

        return hash_equals($calculatedHash, $receivedHash);
    }
}
```


***

## **9. MODULE-BY-MODULE IMPLEMENTATION**

Due to the extensive length of this document, I'll provide the implementation approach for each module. You should follow this pattern for all 12 modules:

### **Module Implementation Pattern**

**For each module:**

1. **Database**: Create migrations and seeders
2. **Backend**: Create models, controllers, and routes
3. **Frontend**: Create UI components and pages
4. **Integration**: Connect frontend to backend via API
5. **Real-time**: Add Socket.io events if needed
6. **ML**: Implement Python service if required
7. **Testing**: Write unit and integration tests

***

### **Example: Module 1 - Authentication (Completed Above)**

✅ Database: users, otp_verifications, personal_access_tokens
✅ Backend: AuthController with registration, login, OTP
✅ Frontend: Login page, Auth context
✅ Integration: API client configured

***

### **Example: Module 3 - Real-Time KDS**

**Timeline: 2 weeks**

**Week 1: Backend \& Database**

```bash
# Already completed:
# - orders, order_items tables
# - Order model with urgency calculation
# - OrderController with CRUD operations
# - Broadcasting events configured
```

**Week 2: Frontend \& Socket.io**

```bash
cd frontend

# Create Kitchen Display page
mkdir -p src/app/kitchen
touch src/app/kitchen/page.tsx

# Create Kitchen components
mkdir -p src/components/kitchen
touch src/components/kitchen/OrderCard.tsx
touch src/components/kitchen/KitchenBoard.tsx
```

**Kitchen Display UI:**

```typescript
// src/app/kitchen/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { socketClient } from '@/lib/socket';
import { api } from '@/lib/api';
import OrderCard from '@/components/kitchen/OrderCard';

interface Order {
  id: number;
  order_number: string;
  table: { table_number: string };
  items: any[];
  status: string;
  placed_at: string;
  elapsed_minutes: number;
  urgency_level: 'green' | 'yellow' | 'red';
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.io
    const socket = socketClient.connect();
    
    socket.on('connect', () => {
      setConnected(true);
      socketClient.joinKitchen(1); // Restaurant ID = 1
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for initial orders
    socket.on('kitchen:initial:orders', (initialOrders: Order[]) => {
      console.log('Received initial orders:', initialOrders);
      setOrders(initialOrders);
    });

    // Listen for new orders
    socketClient.onOrderCreated((newOrder: Order) => {
      console.log('New order received:', newOrder);
      setOrders((prev) => [...prev, newOrder]);
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play();
    });

    // Listen for status updates
    socketClient.onOrderStatusChanged((data: any) => {
      console.log('Order status changed:', data);
      setOrders((prev) =>
        prev.filter((order) => order.id !== data.orderId)
      );
    });

    // Cleanup
    return () => {
      socketClient.offOrderCreated();
      socketClient.offOrderStatusChanged();
      socketClient.disconnect();
    };
  }, []);

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    socketClient.updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kitchen Display System</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <p className="text-gray-600 mt-2">{orders.length} active orders</p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No active orders</p>
        </div>
      )}
    </div>
  );
}
```


***

## **10. TESTING \& QUALITY ASSURANCE**

### **10.1 Laravel Testing**

```bash
cd backend

# Create test files
php artisan make:test AuthenticationTest
php artisan make:test OrderManagementTest
```

**Example Test:**

```php
<?php
// tests/Feature/AuthenticationTest.php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+923001234567',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => ['user', 'token']
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com'
        ]);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('Password123!')
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'Password123!'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => ['user', 'token']
                 ]);
    }
}
```

**Run tests:**

```bash
php artisan test

# Run specific test
php artisan test --filter=AuthenticationTest

# Run with coverage
php artisan test --coverage
```


***

### **10.2 Frontend Testing**

```bash
cd frontend

# Create test file
touch src/app/auth/login/__tests__/page.test.tsx
```

```typescript
// src/app/auth/login/__tests__/page.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error for invalid credentials', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

**Run tests:**

```bash
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```


***

## **11. DEPLOYMENT PROCEDURES**

### **11.1 Production Environment Setup**

**Option A: DigitalOcean Droplet**

```bash
# 1. Create droplet (Ubuntu 22.04, 4GB RAM minimum)
# 2. SSH into server
ssh root@your_server_ip

# 3. Update system
apt update && apt upgrade -y

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 5. Install Docker Compose
apt install docker-compose -y

# 6. Create deployment directory
mkdir -p /var/www/restaurant-ecosystem
cd /var/www/restaurant-ecosystem

# 7. Clone repository
git clone https://github.com/YOUR_USERNAME/smart-restaurant-ecosystem.git .

# 8. Create production .env files
cp backend/.env.example backend/.env.production
cp frontend/.env.local.example frontend/.env.production
# Edit with production values

# 9. Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# 10. Run migrations
docker-compose exec api php artisan migrate --force

# 11. Setup SSL certificate (Let's Encrypt)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```


***

### **11.2 Docker Production Configuration**

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
      - NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
    restart: unless-stopped
    networks:
      - restaurant-network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    env_file:
      - ./backend/.env.production
    restart: unless-stopped
    depends_on:
      - mysql
      - redis
    networks:
      - restaurant-network

  socket:
    build:
      context: ./socket-server
      dockerfile: Dockerfile.prod
    env_file:
      - ./socket-server/.env.production
    restart: unless-stopped
    networks:
      - restaurant-network

  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile.prod
    env_file:
      - ./ml-service/.env.production
    restart: unless-stopped
    networks:
      - restaurant-network

  mysql:
    image: mysql:8.0
    env_file:
      - ./database/.env.production
    volumes:
      - mysql-data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - restaurant-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - restaurant-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    restart: unless-stopped
    networks:
      - restaurant-network

networks:
  restaurant-network:
    driver: bridge

volumes:
  mysql-data:
  redis-data:
```


***

## **12. TROUBLESHOOTING GUIDE**

### **Common Issues \& Solutions**

**Issue 1: Laravel Migration Error**

```
Error: SQLSTATE[HY000] [2002] Connection refused
```

**Solution:**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify .env database credentials
cat backend/.env | grep DB_

# Test connection
mysql -u restaurant_user -p restaurant_db
```


***

**Issue 2: Socket.io Not Connecting**

```
WebSocket connection failed
```

**Solution:**

```bash
# Check Socket.io server is running
curl http://localhost:3001/health

# Check Redis is accessible
redis-cli ping

# Verify CORS settings in socket-server
cat socket-server/src/server.js | grep FRONTEND_URL
```


***

**Issue 3: Next.js Build Fails**

```
Module not found: Can't resolve '@/components/...'
```

**Solution:**

```bash
# Clear Next.js cache
rm -rf frontend/.next

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json paths configuration
cat tsconfig.json | grep paths
```


***

**Issue 4: Laravel Queue Not Processing**

```
Jobs stuck in queue
```

**Solution:**

```bash
# Check queue worker is running
ps aux | grep "queue:work"

# Restart queue worker
php artisan queue:restart

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```


***

## **FINAL CHECKLIST**

Before deployment to production, ensure:

### **Backend**

- [ ] All migrations run successfully
- [ ] Seeders create sample data
- [ ] All API endpoints tested with Postman
- [ ] Authentication works (register, login, logout)
- [ ] JWT tokens expire correctly
- [ ] CORS configured for frontend URL
- [ ] Broadcasting configured with Redis
- [ ] Queue worker running for background jobs
- [ ] Rate limiting configured
- [ ] Error logging enabled


### **Frontend**

- [ ] All pages render without errors
- [ ] API calls work correctly
- [ ] Authentication flow complete
- [ ] Socket.io connection established
- [ ] Real-time updates working
- [ ] Mobile responsive design
- [ ] PWA manifest configured
- [ ] SEO meta tags added
- [ ] Error boundaries implemented
- [ ] Loading states added


### **Socket.io**

- [ ] Server starts without errors
- [ ] Redis connection successful
- [ ] Kitchen room joining works
- [ ] Table room joining works
- [ ] Order broadcasts received
- [ ] Status updates working
- [ ] Reconnection logic tested


### **ML Service**

- [ ] Flask server starts
- [ ] Database connection works
- [ ] Health check endpoint responds
- [ ] Recommendation endpoint ready
- [ ] Sentiment analysis endpoint ready


### **Database**

- [ ] All tables created
- [ ] Indexes added for performance
- [ ] Foreign keys configured
- [ ] Sample data seeded
- [ ] Backup strategy defined


### **Deployment**

- [ ] Docker containers build
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] CI/CD pipeline working
- [ ] Monitoring configured
- [ ] Backup automated

***

## **NEXT STEPS FOR JUNIOR ENGINEER**

**Week 1-2: Environment Setup**

- Install all required software
- Clone repository and initialize projects
- Run migrations and seeders
- Test all services locally

**Week 3-4: Module 1 (Authentication)**

- Implement registration
- Implement login/logout
- Add OTP verification
- Test authentication flow

**Week 5-6: Module 2 (QR \& Sessions)**

- Generate QR codes for tables
- Implement session creation
- Allow multiple users to join
- Test concurrent sessions

**Week 7-8: Module 3 (Real-Time KDS)**

- Build order placement API
- Create Kitchen Display UI
- Implement Socket.io events
- Test real-time updates

**Continue this pattern for remaining modules...**

***

## **RESOURCES \& DOCUMENTATION**

**Official Documentation:**

- Laravel: https://laravel.com/docs
- Next.js: https://nextjs.org/docs
- Socket.io: https://socket.io/docs
- Flask: https://flask.palletsprojects.com/
- Docker: https://docs.docker.com/

**Tutorials:**

- Laravel Sanctum Auth: https://laravel.com/docs/sanctum
- Next.js App Router: https://nextjs.org/docs/app
- Socket.io with Redis: https://socket.io/docs/v4/redis-adapter/

**Community:**

- Laravel Forum: https://laracasts.com/discuss
- Next.js Discussions: https://github.com/vercel/next.js/discussions
- Stack Overflow: Tag your questions appropriately

***

## **SUPPORT CONTACTS**

**Project Team:**

- Hamza Shehzad: Full Stack \& Socket.io
- Moin Ali Shah: Backend \& Database
- Hashim Shinwari: Frontend \& ML

**Senior Engineer:** Available for code reviews and architecture questions

***

**Good luck with the implementation! Follow this document step-by-step, and you'll have a fully functional Smart Restaurant Ecosystem by November 30, 2026.**

