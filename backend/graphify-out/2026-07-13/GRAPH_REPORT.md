# Graph Report - backend  (2026-07-13)

## Corpus Check
- 349 files · ~227,649 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1015 nodes · 1873 edges · 139 communities (124 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30c9a934`
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
- ReservationUpdated
- EnsureRestaurantRole.php
- AllPaymentsCompleted
- SplitBillUnlocked
- QueueUpdated
- ResolvesRestaurant.php

## God Nodes (most connected - your core abstractions)
1. `Order` - 45 edges
2. `Payment` - 42 edges
3. `Controller` - 41 edges
4. `Restaurant` - 37 edges
5. `TableSession` - 37 edges
6. `User` - 32 edges
7. `MenuItem` - 31 edges
8. `PaymentController` - 27 edges
9. `Table` - 25 edges
10. `Reservation` - 23 edges

## Surprising Connections (you probably didn't know these)
- `runRoleMiddleware()` --references--> `User`  [EXTRACTED]
  tests/Unit/EnsureRestaurantRoleTest.php → app/Models/User.php
- `CashPaymentPending` --references--> `Payment`  [EXTRACTED]
  app/Events/CashPaymentPending.php → app/Models/Payment.php
- `FeedbackFlagged` --references--> `Feedback`  [EXTRACTED]
  app/Events/FeedbackFlagged.php → app/Models/Feedback.php
- `PaymentCompleted` --references--> `Payment`  [EXTRACTED]
  app/Events/PaymentCompleted.php → app/Models/Payment.php
- `AdminController` --inherits--> `Controller`  [EXTRACTED]
  app/Http/Controllers/Api/AdminController.php → app/Http/Controllers/Controller.php

## Import Cycles
- None detected.

## Communities (139 total, 15 thin omitted)

### Community 0 - "SerializesModels"
Cohesion: 0.22
Nodes (3): CheckoutStarted, ServiceRequestUpdated, InteractsWithSockets

### Community 1 - "Order"
Cohesion: 0.06
Nodes (16): OrderController, JsonResponse, Request, Order, BelongsTo, HasMany, OrderItem, BelongsTo (+8 more)

### Community 2 - "Payment"
Cohesion: 0.07
Nodes (14): PaymentController, JsonResponse, Request, JsonResponse, Request, SessionController, Payment, BelongsTo (+6 more)

### Community 3 - "AGENTS.md"
Cohesion: 0.04
Nodes (48): APIs & Eloquent Resources, Application Structure & Architecture, Artisan, Artisan, Authentication & Authorization, Available Search Syntax, Available Search Syntax, Comments (+40 more)

### Community 4 - "Restaurant"
Cohesion: 0.18
Nodes (5): JsonResponse, Request, ReservationController, BelongsTo, Reservation

### Community 5 - "Feedback"
Cohesion: 0.09
Nodes (15): AdminController, JsonResponse, Request, FeedbackController, JsonResponse, Request, Feedback, BelongsTo (+7 more)

### Community 6 - "User"
Cohesion: 0.06
Nodes (18): AdminTeamController, JsonResponse, Request, AuthController, JsonResponse, Request, StoreTableRequest, StoreTeamMemberRequest (+10 more)

### Community 7 - "Model"
Cohesion: 0.06
Nodes (22): LoyaltyController, JsonResponse, Request, AnalyticsEvent, BelongsTo, DemandForecast, BelongsTo, Ingredient (+14 more)

### Community 9 - "MenuItem"
Cohesion: 0.08
Nodes (16): AdminMenuController, JsonResponse, Request, MenuController, JsonResponse, Request, Category, BelongsTo (+8 more)

### Community 10 - "Restaurant"
Cohesion: 0.07
Nodes (15): AdminTableController, JsonResponse, Request, HasMany, Restaurant, BelongsTo, HasMany, Table (+7 more)

### Community 11 - "Controller"
Cohesion: 0.07
Nodes (25): AdminFeedbackController, JsonResponse, Request, AdminOrderController, JsonResponse, Request, AdminPaymentController, JsonResponse (+17 more)

### Community 12 - "RegistrationOTP"
Cohesion: 0.14
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

### Community 124 - "SerializesModels"
Cohesion: 0.22
Nodes (3): PaymentFailed, ServiceRequestCreated, ShouldBroadcastNow

### Community 128 - "SplitBillConfigured"
Cohesion: 0.24
Nodes (3): SessionParticipantLeft, SplitBillConfigured, Dispatchable

### Community 129 - "SplitBillItemClaimed"
Cohesion: 0.27
Nodes (4): GenerateRecommendations, AiRecommendation, BelongsTo, Command

### Community 136 - "EnsureRestaurantRole.php"
Cohesion: 0.53
Nodes (4): EnsureRestaurantRole, Request, Closure, Response

### Community 141 - "AllPaymentsCompleted"
Cohesion: 0.24
Nodes (3): AllPaymentsCompleted, SessionParticipantJoined, SerializesModels

## Knowledge Gaps
- **130 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Controller` connect `Controller` to `Order`, `Payment`, `Restaurant`, `Feedback`, `User`, `Model`, `MenuItem`, `Restaurant`, `QueueEntry`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Order` connect `Order` to `Payment`, `Feedback`, `Model`, `TableSession`, `Controller`, `RegistrationOTP`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Feedback` connect `Feedback` to `CashPaymentPending`, `Controller`, `Model`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Order` (e.g. with `.activeKitchenOrders()` and `.dashboardStats()`) actually correct?**
  _`Order` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Payment` (e.g. with `.index()` and `.pendingCash()`) actually correct?**
  _`Payment` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `php`, `$schema`, `name` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Order` be split into smaller, more focused modules?**
  _Cohesion score 0.06240084611316764 - nodes in this community are weakly interconnected._