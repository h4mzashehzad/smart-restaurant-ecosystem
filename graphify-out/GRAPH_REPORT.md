# Graph Report - .  (2026-07-08)

## Corpus Check
- 411 files · ~385,861 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1184 nodes · 1848 edges · 116 communities (106 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Component 0
- Component 1
- Component 2
- Component 3
- Component 4
- Component 5
- Component 6
- Component 7
- Component 8
- Component 9
- Component 10
- Component 11
- Component 12
- Component 13
- Component 14
- Component 15
- Component 16
- Component 17
- Component 18
- Component 19
- Component 20
- Component 21
- Component 22
- Component 23
- Component 24
- Component 25
- Component 26
- Component 27
- Component 28
- Component 29
- Component 30
- Component 31
- Component 32
- Component 33
- Component 34
- Component 35
- Component 36
- Component 37
- Component 38
- Component 39
- Component 40
- Component 41
- Component 42
- Component 77
- Component 78
- Component 83
- Component 84
- Component 85
- Component 86

## God Nodes (most connected - your core abstractions)
1. `SocketClient` - 62 edges
2. `ApiClient` - 37 edges
3. `Restaurant` - 31 edges
4. `Order` - 29 edges
5. `Controller` - 27 edges
6. `TableSession` - 26 edges
7. `User` - 24 edges
8. `Reservation` - 23 edges
9. `MenuItem` - 21 edges
10. `Feedback` - 19 edges

## Surprising Connections (you probably didn't know these)
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/design_system.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `FeedbackFlagged` --references--> `Feedback`  [EXTRACTED]
  backend/app/Events/FeedbackFlagged.php → backend/app/Models/Feedback.php
- `AdminController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Api/AdminController.php → backend/app/Http/Controllers/Controller.php
- `AuthController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Api/AuthController.php → backend/app/Http/Controllers/Controller.php
- `FeedbackController` --inherits--> `Controller`  [EXTRACTED]
  backend/app/Http/Controllers/Api/FeedbackController.php → backend/app/Http/Controllers/Controller.php

## Import Cycles
- None detected.

## Communities (116 total, 10 thin omitted)

### Community 0 - "Component 0"
Cohesion: 0.05
Nodes (25): FeedbackFlagged, OrderCreated, OrderStatusUpdated, QueueUpdated, ReservationUpdated, ServiceRequestCreated, ServiceRequestUpdated, SessionParticipantJoined (+17 more)

### Community 1 - "Component 1"
Cohesion: 0.06
Nodes (23): LoyaltyController, JsonResponse, Request, AnalyticsEvent, BelongsTo, Category, BelongsTo, HasMany (+15 more)

### Community 2 - "Component 2"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 4 - "Component 4"
Cohesion: 0.07
Nodes (17): Authenticatable, GenerateRecommendations, AuthController, JsonResponse, Request, AiRecommendation, BelongsTo, HasMany (+9 more)

### Community 5 - "Component 5"
Cohesion: 0.08
Nodes (14): AdminController, JsonResponse, Request, OrderController, JsonResponse, Request, Order, BelongsTo (+6 more)

### Community 6 - "Component 6"
Cohesion: 0.08
Nodes (15): JsonResponse, Request, SessionController, JsonResponse, Request, TableController, BelongsTo, HasMany (+7 more)

### Community 7 - "Component 7"
Cohesion: 0.09
Nodes (9): JsonResponse, Request, ReservationController, BelongsTo, Reservation, HasMany, Restaurant, QRCodeGenerationService (+1 more)

### Community 8 - "Component 8"
Cohesion: 0.06
Nodes (35): KDSContainer(), KDSOrder, PRIORITY_ORDER, sortRequests(), FlaggedFeedback, FlaggedFeedbackAlert(), FlaggedFeedbackAlertProps, FlaggedItemRating (+27 more)

### Community 9 - "Component 9"
Cohesion: 0.05
Nodes (40): dependencies, axios, date-fns, @headlessui/react, @heroicons/react, @hookform/resolvers, next, qrcode (+32 more)

### Community 11 - "Component 11"
Cohesion: 0.10
Nodes (12): FeedbackController, JsonResponse, Request, Feedback, BelongsTo, BelongsToMany, HasMany, FeedbackMenuItem (+4 more)

### Community 12 - "Component 12"
Cohesion: 0.09
Nodes (15): analyze_sentiment(), analyze_sentiment_batch(), generate_recommendations(), get_db_connection(), Analyze multiple review texts independently (one per menu item).      Each item', Analyze sentiment of a single text review., MenuRecommender, Generate recommendations based on user preferences and menu item features using (+7 more)

### Community 13 - "Component 13"
Cohesion: 0.07
Nodes (25): author, dependencies, cors, dotenv, express, ioredis, node-fetch, socket.io (+17 more)

### Community 14 - "Component 14"
Cohesion: 0.14
Nodes (8): PaymentController, JsonResponse, Request, Payment, BelongsTo, HasMany, BelongsTo, SplitBillItem

### Community 15 - "Component 15"
Cohesion: 0.15
Nodes (7): MenuController, JsonResponse, Request, MenuItem, BelongsTo, BelongsToMany, HasMany

### Community 16 - "Component 16"
Cohesion: 0.17
Nodes (9): JsonResponse, Request, ServiceRequestController, JsonResponse, Request, ServiceRequestWebhookController, Controller, BelongsTo (+1 more)

### Community 17 - "Component 17"
Cohesion: 0.12
Nodes (18): metadata, outfit, plusJakartaSans, AuthProvider(), ACTIVE_STATUSES, ActiveOrder, ActiveSession, getOrCreateDeviceId() (+10 more)

### Community 18 - "Component 18"
Cohesion: 0.15
Nodes (14): MenuContainer(), CartDrawer(), CartFab(), CartFabProps, CategorySlider(), CategorySliderProps, Ingredient, ItemDetailDrawer() (+6 more)

### Community 19 - "Component 19"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Component 20"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module (+11 more)

### Community 21 - "Component 21"
Cohesion: 0.28
Nodes (5): JsonResponse, Request, QueueController, BelongsTo, QueueEntry

### Community 22 - "Component 22"
Cohesion: 0.12
Nodes (15): devDependencies, axios, concurrently, laravel-echo, laravel-vite-plugin, pusher-js, tailwindcss, @tailwindcss/vite (+7 more)

### Community 23 - "Component 23"
Cohesion: 0.20
Nodes (9): AdminLoginPage(), LoginContent(), RegisterContent(), PhoneInput(), PhoneInputProps, AuthContext, AuthContextType, useAuth() (+1 more)

### Community 24 - "Component 24"
Cohesion: 0.20
Nodes (8): metadata, ScanPage(), ScanState, TableInfo, SessionBanner(), statusConfig, UserMenu(), useSession()

### Community 25 - "Component 25"
Cohesion: 0.16
Nodes (10): CartDrawerProps, OrderSuccess(), OrderSuccessProps, DrawerState, FeedbackDrawer(), ItemReview, OrderDetail, OrderMenuItem (+2 more)

### Community 26 - "Component 26"
Cohesion: 0.18
Nodes (10): Props, formatDate(), friendlyDate(), ReservationContainer(), Restaurant, Step, STEP_LABELS, STEPS (+2 more)

### Community 27 - "Component 27"
Cohesion: 0.26
Nodes (10): CartItem(), CartItemProps, CartContext, CartContextType, CartProvider(), loadPersisted(), mergeItems(), persist() (+2 more)

### Community 28 - "Component 28"
Cohesion: 0.18
Nodes (11): Priority, PRIORITY_OPTS, PriorityOption, REQUEST_OPTIONS, RequestOption, RequestType, STATUS_INFO, STATUS_STEPS (+3 more)

### Community 29 - "Component 29"
Cohesion: 0.18
Nodes (11): require-dev, barryvdh/laravel-debugbar, fakerphp/faker, laravel/boost, laravel/pail, laravel/pint, laravel/sail, mockery/mockery (+3 more)

### Community 30 - "Component 30"
Cohesion: 0.22
Nodes (6): metadata, QueueContainer(), STATUS_CONFIG, timeAgo(), api, API_URL

### Community 31 - "Component 31"
Cohesion: 0.20
Nodes (10): require, guzzlehttp/guzzle, laravel/framework, laravel/reverb, laravel/sanctum, laravel/tinker, league/flysystem-aws-s3-v3, php (+2 more)

### Community 32 - "Component 32"
Cohesion: 0.20
Nodes (9): allowedOrigins, app, cors, express, http, io, Redis, redisSubscriber (+1 more)

### Community 33 - "Component 33"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 34 - "Component 34"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 35 - "Component 35"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 36 - "Component 36"
Cohesion: 0.47
Nodes (3): UserFactory, Factory, static

### Community 38 - "Component 38"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 39 - "Component 39"
Cohesion: 0.50
Nodes (3): channel, Pusher, socket

### Community 40 - "Component 40"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 41 - "Component 41"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

## Knowledge Gaps
- **239 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SessionProvider()` connect `Component 17` to `Component 21`, `Component 5`, `Component 30`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `QueueEntry` connect `Component 21` to `Component 0`, `Component 1`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `TableSession` connect `Component 6` to `Component 1`, `Component 5`, `Component 14`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Order` (e.g. with `.activeKitchenOrders()` and `.dashboardStats()`) actually correct?**
  _`Order` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _276 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Component 0` be split into smaller, more focused modules?**
  _Cohesion score 0.054414414414414414 - nodes in this community are weakly interconnected._
- **Should `Component 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05786090005844535 - nodes in this community are weakly interconnected._