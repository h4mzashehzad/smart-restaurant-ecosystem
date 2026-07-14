# Graph Report - backend  (2026-07-14)

## Corpus Check
- 354 files · ~229,722 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1035 nodes · 1938 edges · 144 communities (130 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9d2edd1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SerializesModels
- Order
- Payment
- AGENTS.md
- Restaurant
- Feedback
- User
- Model
- TableSession
- MenuItem
- Restaurant
- Controller
- RegistrationOTP
- Pest Testing 4
- QueueEntry
- devDependencies
- Tailwind CSS Development
- require
- require-dev
- composer.json
- scripts
- README.md
- config
- UserFactory
- AppServiceProvider
- psr-4
- TestCase.php
- autoload-dev
- extra
- laravel-boost
- SafepayService
- Dispatchable
- SerializesModels
- InteractsWithSockets
- PaymentFailed
- ServiceRequestUpdated.php
- SplitBillConfigured
- SplitBillItemClaimed
- CashPaymentPending
- PaymentCompleted
- FormRequest
- AuthController.php
- AiRecommendation
- AnalyticsEvent
- EnsureRestaurantRole.php
- DemandForecast
- AllPaymentsCompleted
- SplitBillUnlocked
- QueueUpdated
- ResolvesRestaurant.php

## God Nodes (most connected - your core abstractions)
1. `Order` - 45 edges
2. `Payment` - 42 edges
3. `Controller` - 41 edges
4. `Restaurant` - 41 edges
5. `TableSession` - 38 edges
6. `MenuItem` - 35 edges
7. `User` - 32 edges
8. `PaymentController` - 28 edges
9. `Table` - 28 edges
10. `Reservation` - 23 edges

## Surprising Connections (you probably didn't know these)
- `checkoutFixture()` --calls--> `Restaurant`  [INFERRED]
  tests/Feature/IngredientCustomizationCheckoutTest.php → app/Models/Restaurant.php
- `makeAdjustableBurger()` --calls--> `Restaurant`  [INFERRED]
  tests/Feature/IngredientCustomizationPricerTest.php → app/Models/Restaurant.php
- `checkoutFixture()` --calls--> `Table`  [INFERRED]
  tests/Feature/IngredientCustomizationCheckoutTest.php → app/Models/Table.php
- `checkoutFixture()` --calls--> `TableSession`  [INFERRED]
  tests/Feature/IngredientCustomizationCheckoutTest.php → app/Models/TableSession.php
- `checkoutFixture()` --calls--> `Ingredient`  [INFERRED]
  tests/Feature/IngredientCustomizationCheckoutTest.php → app/Models/Ingredient.php

## Import Cycles
- None detected.

## Communities (144 total, 14 thin omitted)

### Community 0 - "SerializesModels"
Cohesion: 0.12
Nodes (5): OrderCreated, PaymentCompleted, PaymentFailed, ServiceRequestUpdated, ShouldBroadcastNow

### Community 1 - "Order"
Cohesion: 0.07
Nodes (15): OrderController, JsonResponse, Request, Order, BelongsTo, HasMany, OrderItem, BelongsTo (+7 more)

### Community 2 - "Payment"
Cohesion: 0.11
Nodes (8): PaymentController, JsonResponse, Request, Payment, BelongsTo, HasMany, PaymentCompletionService, ReceiptService

### Community 3 - "AGENTS.md"
Cohesion: 0.04
Nodes (48): APIs & Eloquent Resources, Application Structure & Architecture, Artisan, Artisan, Authentication & Authorization, Available Search Syntax, Available Search Syntax, Comments (+40 more)

### Community 4 - "Restaurant"
Cohesion: 0.19
Nodes (5): JsonResponse, Request, ReservationController, BelongsTo, Reservation

### Community 5 - "Feedback"
Cohesion: 0.18
Nodes (6): FeedbackMenuItem, BelongsTo, MenuItemIngredient, BelongsTo, IngredientCustomizationPricer, Pivot

### Community 6 - "User"
Cohesion: 0.15
Nodes (7): BelongsTo, HasMany, User, Authenticatable, HasApiTokens, Notifiable, runRoleMiddleware()

### Community 7 - "Model"
Cohesion: 0.27
Nodes (5): LoyaltyController, JsonResponse, Request, LoyaltyTransaction, BelongsTo

### Community 8 - "TableSession"
Cohesion: 0.11
Nodes (12): JsonResponse, Request, SessionController, JsonResponse, Request, TableController, BelongsTo, HasMany (+4 more)

### Community 9 - "MenuItem"
Cohesion: 0.05
Nodes (28): AdminMenuController, JsonResponse, Request, MenuController, JsonResponse, Request, Category, BelongsTo (+20 more)

### Community 10 - "Restaurant"
Cohesion: 0.09
Nodes (12): AdminTableController, JsonResponse, Request, Response, HasMany, Restaurant, BelongsTo, HasMany (+4 more)

### Community 11 - "Controller"
Cohesion: 0.06
Nodes (32): AdminController, JsonResponse, Request, AdminFeedbackController, JsonResponse, Request, AdminOrderController, JsonResponse (+24 more)

### Community 12 - "RegistrationOTP"
Cohesion: 0.13
Nodes (11): UpdateUserPreferences, Content, Envelope, RegistrationOTP, Content, Envelope, ReservationConfirmed, InteractsWithQueue (+3 more)

### Community 13 - "Pest Testing 4"
Cohesion: 0.11
Nodes (18): Architecture Testing, Assertions, Basic Test Structure, Basic Usage, Browser Test Example, Common Pitfalls, Creating Tests, Datasets (+10 more)

### Community 14 - "QueueEntry"
Cohesion: 0.28
Nodes (5): JsonResponse, Request, QueueController, BelongsTo, QueueEntry

### Community 15 - "devDependencies"
Cohesion: 0.12
Nodes (15): devDependencies, axios, concurrently, laravel-echo, laravel-vite-plugin, pusher-js, tailwindcss, @tailwindcss/vite (+7 more)

### Community 16 - "Tailwind CSS Development"
Cohesion: 0.13
Nodes (14): Basic Usage, Common Patterns, Common Pitfalls, CSS-First Configuration, Dark Mode, Documentation, Flexbox Layout, Grid Layout (+6 more)

### Community 17 - "require"
Cohesion: 0.18
Nodes (11): require, barryvdh/laravel-dompdf, guzzlehttp/guzzle, laravel/framework, laravel/reverb, laravel/sanctum, laravel/tinker, league/flysystem-aws-s3-v3 (+3 more)

### Community 18 - "require-dev"
Cohesion: 0.18
Nodes (11): require-dev, barryvdh/laravel-debugbar, fakerphp/faker, laravel/boost, laravel/pail, laravel/pint, laravel/sail, mockery/mockery (+3 more)

### Community 19 - "composer.json"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 20 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 21 - "README.md"
Cohesion: 0.22
Nodes (8): About Laravel, Code of Conduct, Contributing, Laravel Sponsors, Learning Laravel, License, Premium Partners, Security Vulnerabilities

### Community 22 - "config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 23 - "UserFactory"
Cohesion: 0.39
Nodes (3): UserFactory, Factory, static

### Community 25 - "psr-4"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 27 - "autoload-dev"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 28 - "extra"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

### Community 126 - "PaymentFailed"
Cohesion: 0.22
Nodes (3): FeedbackFlagged, SplitBillItemClaimed, InteractsWithSockets

### Community 128 - "SplitBillConfigured"
Cohesion: 0.24
Nodes (3): ServiceRequestCreated, SessionParticipantJoined, SerializesModels

### Community 129 - "SplitBillItemClaimed"
Cohesion: 0.16
Nodes (4): CheckoutStarted, ReservationUpdated, SessionParticipantLeft, Dispatchable

### Community 130 - "CashPaymentPending"
Cohesion: 0.20
Nodes (6): AdminUserSeeder, CustomizableIngredientsSeeder, DatabaseSeeder, RestaurantMenuSeeder, Seeder, WithoutModelEvents

### Community 131 - "PaymentCompleted"
Cohesion: 0.28
Nodes (4): AdminTeamController, JsonResponse, Request, StoreTeamMemberRequest

### Community 132 - "FormRequest"
Cohesion: 0.19
Nodes (4): StoreTableRequest, UpdateRestaurantRequest, UpdateTeamMemberRequest, FormRequest

### Community 133 - "AuthController.php"
Cohesion: 0.35
Nodes (3): AuthController, JsonResponse, Request

### Community 134 - "AiRecommendation"
Cohesion: 0.27
Nodes (4): GenerateRecommendations, AiRecommendation, BelongsTo, Command

### Community 136 - "EnsureRestaurantRole.php"
Cohesion: 0.53
Nodes (4): EnsureRestaurantRole, Request, Response, Closure

## Knowledge Gaps
- **130 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Controller` connect `Controller` to `Order`, `Payment`, `PaymentCompleted`, `Restaurant`, `AuthController.php`, `Model`, `TableSession`, `MenuItem`, `Restaurant`, `QueueEntry`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `Order` connect `Order` to `SerializesModels`, `Payment`, `MenuItem`, `Controller`, `RegistrationOTP`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `TableSession` connect `TableSession` to `Order`, `Payment`, `MenuItem`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Order` (e.g. with `.activeKitchenOrders()` and `.dashboardStats()`) actually correct?**
  _`Order` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Payment` (e.g. with `.index()` and `.pendingCash()`) actually correct?**
  _`Payment` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `php`, `$schema`, `name` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SerializesModels` be split into smaller, more focused modules?**
  _Cohesion score 0.11688311688311688 - nodes in this community are weakly interconnected._