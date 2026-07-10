# Graph Report - backend  (2026-07-10)

## Corpus Check
- 331 files · ~222,773 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 898 nodes · 1542 edges · 132 communities (121 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb8c9b18`
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

## God Nodes (most connected - your core abstractions)
1. `Order` - 40 edges
2. `Payment` - 38 edges
3. `TableSession` - 36 edges
4. `Restaurant` - 31 edges
5. `Controller` - 27 edges
6. `PaymentController` - 26 edges
7. `User` - 24 edges
8. `MenuItem` - 23 edges
9. `Reservation` - 23 edges
10. `Feedback` - 19 edges

## Surprising Connections (you probably didn't know these)
- `CashPaymentPending` --references--> `Payment`  [EXTRACTED]
  app/Events/CashPaymentPending.php → app/Models/Payment.php
- `PaymentCompleted` --references--> `Payment`  [EXTRACTED]
  app/Events/PaymentCompleted.php → app/Models/Payment.php
- `FeedbackController` --inherits--> `Controller`  [EXTRACTED]
  app/Http/Controllers/Api/FeedbackController.php → app/Http/Controllers/Controller.php
- `LoyaltyController` --inherits--> `Controller`  [EXTRACTED]
  app/Http/Controllers/Api/LoyaltyController.php → app/Http/Controllers/Controller.php
- `MenuController` --inherits--> `Controller`  [EXTRACTED]
  app/Http/Controllers/Api/MenuController.php → app/Http/Controllers/Controller.php

## Import Cycles
- None detected.

## Communities (132 total, 11 thin omitted)

### Community 0 - "SerializesModels"
Cohesion: 0.22
Nodes (3): AllPaymentsCompleted, CheckoutStarted, Dispatchable

### Community 1 - "Order"
Cohesion: 0.07
Nodes (13): OrderController, JsonResponse, Request, Order, BelongsTo, HasMany, OrderItem, BelongsTo (+5 more)

### Community 2 - "Payment"
Cohesion: 0.10
Nodes (8): PaymentController, JsonResponse, Request, Payment, BelongsTo, HasMany, PaymentCompletionService, ReceiptService

### Community 3 - "AGENTS.md"
Cohesion: 0.04
Nodes (48): APIs & Eloquent Resources, Application Structure & Architecture, Artisan, Artisan, Authentication & Authorization, Available Search Syntax, Available Search Syntax, Comments (+40 more)

### Community 4 - "Restaurant"
Cohesion: 0.11
Nodes (7): JsonResponse, Request, ReservationController, BelongsTo, Reservation, HasMany, Restaurant

### Community 5 - "Feedback"
Cohesion: 0.09
Nodes (13): FeedbackFlagged, FeedbackController, JsonResponse, Request, Feedback, BelongsTo, BelongsToMany, HasMany (+5 more)

### Community 6 - "User"
Cohesion: 0.08
Nodes (14): GenerateRecommendations, AiRecommendation, BelongsTo, HasMany, User, Authenticatable, Command, AdminUserSeeder (+6 more)

### Community 7 - "Model"
Cohesion: 0.05
Nodes (25): LoyaltyController, JsonResponse, Request, AnalyticsEvent, BelongsTo, Category, BelongsTo, HasMany (+17 more)

### Community 8 - "TableSession"
Cohesion: 0.07
Nodes (17): JsonResponse, Request, SessionController, JsonResponse, Request, TableController, BelongsTo, HasMany (+9 more)

### Community 9 - "MenuItem"
Cohesion: 0.15
Nodes (7): MenuController, JsonResponse, Request, MenuItem, BelongsTo, BelongsToMany, HasMany

### Community 11 - "Controller"
Cohesion: 0.09
Nodes (15): AdminController, JsonResponse, Request, AuthController, JsonResponse, Request, JsonResponse, Request (+7 more)

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
Cohesion: 0.47
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

### Community 123 - "Dispatchable"
Cohesion: 0.22
Nodes (3): OrderStatusUpdated, ServiceRequestCreated, ShouldBroadcastNow

### Community 124 - "SerializesModels"
Cohesion: 0.24
Nodes (3): OrderCreated, SessionParticipantJoined, SerializesModels

### Community 125 - "InteractsWithSockets"
Cohesion: 0.16
Nodes (4): QueueUpdated, SessionParticipantLeft, SessionStateChanged, InteractsWithSockets

## Knowledge Gaps
- **130 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Order` connect `Order` to `Payment`, `Model`, `Controller`, `RegistrationOTP`, `SerializesModels`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Payment` connect `Payment` to `Order`, `CashPaymentPending`, `PaymentCompleted`, `Model`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Controller` connect `Controller` to `Order`, `Payment`, `Restaurant`, `Feedback`, `Model`, `TableSession`, `MenuItem`, `QueueEntry`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Order` (e.g. with `.activeKitchenOrders()` and `.dashboardStats()`) actually correct?**
  _`Order` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Payment` (e.g. with `.setupEqualSplit()` and `.setupItemizedSplit()`) actually correct?**
  _`Payment` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `php`, `$schema`, `name` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Order` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._