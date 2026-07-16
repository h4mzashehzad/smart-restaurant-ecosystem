# Graph Report - backend  (2026-07-16)

## Corpus Check
- 364 files · ~236,928 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1088 nodes · 2185 edges · 146 communities (129 shown, 17 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2585a6ac`
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
- sanctum.php
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
- ReservationUpdated
- AllPaymentsCompleted
- QueueUpdated
- ResolvesRestaurant.php

## God Nodes (most connected - your core abstractions)
1. `Order` - 56 edges
2. `Restaurant` - 46 edges
3. `Controller` - 45 edges
4. `User` - 45 edges
5. `Payment` - 44 edges
6. `MenuItem` - 42 edges
7. `TableSession` - 42 edges
8. `Table` - 32 edges
9. `PaymentController` - 29 edges
10. `Category` - 26 edges

## Surprising Connections (you probably didn't know these)
- `analyticsFixture()` --calls--> `Feedback`  [INFERRED]
  tests/Feature/AdminAnalyticsTest.php → app/Models/Feedback.php
- `analyticsFixture()` --calls--> `Order`  [INFERRED]
  tests/Feature/AdminAnalyticsTest.php → app/Models/Order.php
- `feedbackRatingFixture()` --calls--> `Order`  [INFERRED]
  tests/Feature/FeedbackAverageRatingTest.php → app/Models/Order.php
- `analyticsFixture()` --calls--> `OrderItem`  [INFERRED]
  tests/Feature/AdminAnalyticsTest.php → app/Models/OrderItem.php
- `analyticsFixture()` --calls--> `Restaurant`  [INFERRED]
  tests/Feature/AdminAnalyticsTest.php → app/Models/Restaurant.php

## Import Cycles
- None detected.

## Communities (146 total, 17 thin omitted)

### Community 1 - "Order"
Cohesion: 0.10
Nodes (11): AdminController, JsonResponse, Request, OrderController, JsonResponse, Request, Order, BelongsTo (+3 more)

### Community 2 - "Payment"
Cohesion: 0.13
Nodes (5): Payment, BelongsTo, HasMany, PaymentCompletionService, ReceiptService

### Community 3 - "AGENTS.md"
Cohesion: 0.04
Nodes (48): APIs & Eloquent Resources, Application Structure & Architecture, Artisan, Artisan, Authentication & Authorization, Available Search Syntax, Available Search Syntax, Comments (+40 more)

### Community 4 - "Restaurant"
Cohesion: 0.19
Nodes (5): JsonResponse, Request, ReservationController, BelongsTo, Reservation

### Community 5 - "Feedback"
Cohesion: 0.08
Nodes (14): FeedbackController, JsonResponse, Request, Feedback, BelongsTo, BelongsToMany, HasMany, FeedbackMenuItem (+6 more)

### Community 6 - "User"
Cohesion: 0.07
Nodes (20): AdminLoyaltyController, JsonResponse, Request, LoyaltyController, JsonResponse, Request, EnsureRestaurantRole, Request (+12 more)

### Community 7 - "Model"
Cohesion: 0.17
Nodes (6): AdminAnalyticsController, JsonResponse, Request, OrderItem, BelongsTo, HasMany

### Community 8 - "TableSession"
Cohesion: 0.20
Nodes (6): JsonResponse, Request, SessionController, BelongsTo, HasMany, TableSession

### Community 9 - "MenuItem"
Cohesion: 0.06
Nodes (24): AdminMenuController, JsonResponse, Request, MenuController, JsonResponse, Request, Category, BelongsTo (+16 more)

### Community 10 - "Restaurant"
Cohesion: 0.09
Nodes (11): AdminTableController, JsonResponse, Request, Response, HasMany, Restaurant, BelongsTo, HasMany (+3 more)

### Community 11 - "Controller"
Cohesion: 0.06
Nodes (28): AdminFeedbackController, JsonResponse, Request, AdminOrderController, JsonResponse, Request, AdminPaymentController, JsonResponse (+20 more)

### Community 12 - "RegistrationOTP"
Cohesion: 0.11
Nodes (13): UpdateUserPreferences, Content, Envelope, RegistrationOTP, Content, Envelope, ReservationConfirmed, BelongsTo (+5 more)

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

### Community 83 - "sanctum.php"
Cohesion: 0.25
Nodes (3): PaymentController, JsonResponse, Request

### Community 123 - "Dispatchable"
Cohesion: 0.22
Nodes (3): OrderStatusUpdated, SplitBillUnlocked, ShouldBroadcastNow

### Community 124 - "SerializesModels"
Cohesion: 0.24
Nodes (3): SessionParticipantJoined, SplitBillConfigured, SerializesModels

### Community 125 - "InteractsWithSockets"
Cohesion: 0.24
Nodes (3): SessionParticipantLeft, SessionStateChanged, Dispatchable

### Community 130 - "CashPaymentPending"
Cohesion: 0.06
Nodes (21): GenerateDemandForecast, GenerateRecommendations, AiRecommendation, BelongsTo, AnalyticsEvent, BelongsTo, DemandForecast, BelongsTo (+13 more)

### Community 131 - "PaymentCompleted"
Cohesion: 0.19
Nodes (4): BelongsTo, SplitBillItem, SplitBillService, Collection

### Community 132 - "FormRequest"
Cohesion: 0.26
Nodes (5): JsonResponse, Request, ServiceRequestController, BelongsTo, ServiceRequest

### Community 133 - "AuthController.php"
Cohesion: 0.21
Nodes (6): JsonResponse, Request, TableController, BelongsTo, HasMany, SessionParticipant

## Knowledge Gaps
- **130 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Controller` connect `Controller` to `Order`, `CashPaymentPending`, `Payment`, `Restaurant`, `Feedback`, `User`, `Model`, `FormRequest`, `MenuItem`, `Restaurant`, `TableSession`, `AuthController.php`, `QueueEntry`, `sanctum.php`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Restaurant` connect `Restaurant` to `CashPaymentPending`, `Restaurant`, `Feedback`, `MenuItem`, `Controller`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MenuItem` connect `MenuItem` to `Order`, `CashPaymentPending`, `Feedback`, `Model`, `sanctum.php`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `Order` (e.g. with `.busiestTables()` and `.fulfillmentPerformance()`) actually correct?**
  _`Order` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `Restaurant` (e.g. with `.handle()` and `.uploadImage()`) actually correct?**
  _`Restaurant` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `User` (e.g. with `.handle()` and `.loyaltyInsights()`) actually correct?**
  _`User` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `php`, `$schema`, `name` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._