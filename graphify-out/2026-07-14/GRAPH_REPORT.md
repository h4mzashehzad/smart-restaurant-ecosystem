# Graph Report - smart-restaurant-ecosystem  (2026-07-10)

## Corpus Check
- 329 files · ~245,342 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2455 nodes · 3288 edges · 292 communities (256 shown, 36 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `954f030c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- Component 81
- Component 82
- Component 83
- Component 84
- Component 85
- Component 86
- Component 110
- Component 111
- Component 112
- dependencies
- Next.js Best Practices
- React Server Components
- WebSocket Security Reference
- Horizontal Scaling Reference
- ShouldBroadcastNow
- Table
- Pest Testing 4
- Parallel & Intercepting Routes
- Server Actions
- OrderController.php
- Design System Master File
- 3. Customer-Facing Application
- Data Patterns
- App Router Architecture
- Restaurant
- **COMPLETE IMPLEMENTATION GUIDE**
- Queue System
- Laravel Specialist
- Bundling
- SKILL.md
- PaymentController.php
- SessionParticipant
- Tailwind CSS Development
- Livewire Components
- Routing & API Resources
- Available Tools
- Next.js Developer
- dependencies
- Testing
- Error Handling
- File Conventions
- WebSocket Protocol Reference
- WebSocket Engineer
- SafepayService
- 🍽️ Smart Restaurant Ecosystem — Feature Documentation
- Font Optimization
- Quick Reference
- WebSocket Patterns Reference
- Dispatchable
- MenuController
- **1.1 Required Software Installation**
- **2.1 Complete MySQL Schema Definition**
- **3.1 Laravel RESTful API Endpoints**
- devDependencies
- Eloquent ORM
- Async Params and SearchParams
- Functions
- Common Causes and Fixes
- Image Optimization
- OG Image Generation
- Scripts
- SerializesModels
- InteractsWithSockets
- Ingredient
- **4. MODULE-SPECIFIC DEEP DIVES**
- KDSOrderTicket.tsx
- app.py
- Metadata
- Route Handlers
- UI/UX Pro Max - Design Intelligence
- README.md
- Features:
- **Software Design Document (SDD)**
- **3. API \& INTEGRATION DESIGN**
- package.json
- WaiterRequestCard.tsx
- HasFactory
- setup
- Features:
- 9. Technology Stack
- Detection Rules
- Runtime Selection
- AnalyticsEvent
- **2. PROJECT INITIALIZATION**
- **4. BACKEND DEVELOPMENT (LARAVEL API)**
- **5. FRONTEND DEVELOPMENT (NEXT.JS PWA)**
- **FINAL CHECKLIST**
- Design System: Smart Restaurant Ecosystem
- FlaggedFeedbackAlert.tsx
- Pre-Delivery Checklist
- How to Use This Skill
- MenuRecommender
- Common Rules for Professional UI
- Example Workflow
- OrderStatusUpdated
- SessionStateChanged
- SplitBillUnlocked
- **1.2 Development Tools**
- **3. DATABASE SETUP \& MIGRATIONS**
- 10. Development Phases & Milestones
- 6. Backend Infrastructure & APIs
- **1. SYSTEM ARCHITECTURE (C4 MODEL)**
- **5. DEVOPS \& DEPLOYMENT PROCEDURES**
- **6. SECURITY \& VALIDATION**
- **8. PERFORMANCE OPTIMIZATION GUIDELINES**
- Tips for Better Results
- When to Apply
- CashPaymentPending
- FeedbackFlagged
- OrderCreated
- PaymentFailed
- QueueUpdated
- ReservationUpdated
- post-create-project-cmd
- **9. MODULE-BY-MODULE IMPLEMENTATION**
- README.md
- SKILL.md
- **10. TESTING \& QUALITY ASSURANCE**
- **11. DEPLOYMENT PROCEDURES**
- **6. REAL-TIME SYSTEM (SOCKET.IO)**
- 3.1 Authentication & Session Management
- 3.2 QR Code Table Linking
- 3.5 Custom Ingredient Picker
- 3.7 AR Dish Visualization
- 3.8 Smart Split-Bill Payment
- graphify.md
- graphify.md
- @heroicons/react
- @hookform/resolvers
- next
- react
- @react-three/fiber
- socket.io-client
- zustand
- @tailwindcss/postcss
- README.md

## God Nodes (most connected - your core abstractions)
1. `SocketClient` - 83 edges
2. `ApiClient` - 48 edges
3. `Order` - 42 edges
4. `Payment` - 40 edges
5. `TableSession` - 37 edges
6. `Restaurant` - 31 edges
7. `PaymentController` - 27 edges
8. `Controller` - 27 edges
9. `User` - 24 edges
10. `MenuItem` - 23 edges

## Surprising Connections (you probably didn't know these)
- `CallbackInner()` --calls--> `useCart()`  [EXTRACTED]
  frontend/src/app/payment/callback/page.tsx → frontend/src/contexts/CartContext.tsx
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/design_system.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `CashPaymentPending` --references--> `Payment`  [EXTRACTED]
  backend/app/Events/CashPaymentPending.php → backend/app/Models/Payment.php
- `FeedbackFlagged` --references--> `Feedback`  [EXTRACTED]
  backend/app/Events/FeedbackFlagged.php → backend/app/Models/Feedback.php
- `PaymentCompleted` --references--> `Payment`  [EXTRACTED]
  backend/app/Events/PaymentCompleted.php → backend/app/Models/Payment.php

## Import Cycles
- None detected.

## Communities (292 total, 36 thin omitted)

### Community 0 - "Component 0"
Cohesion: 0.14
Nodes (11): UpdateUserPreferences, Content, Envelope, RegistrationOTP, Content, Envelope, ReservationConfirmed, InteractsWithQueue (+3 more)

### Community 1 - "Component 1"
Cohesion: 0.17
Nodes (7): DemandForecast, BelongsTo, OtpVerification, BelongsTo, BelongsTo, UserPreference, Model

### Community 2 - "Component 2"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 4 - "Component 4"
Cohesion: 0.08
Nodes (14): Authenticatable, GenerateRecommendations, AiRecommendation, BelongsTo, HasMany, User, AdminUserSeeder, DatabaseSeeder (+6 more)

### Community 5 - "Component 5"
Cohesion: 0.20
Nodes (6): AdminController, JsonResponse, Request, OrderItem, BelongsTo, HasMany

### Community 6 - "Component 6"
Cohesion: 0.19
Nodes (6): JsonResponse, Request, SessionController, BelongsTo, HasMany, TableSession

### Community 7 - "Component 7"
Cohesion: 0.18
Nodes (5): JsonResponse, Request, ReservationController, BelongsTo, Reservation

### Community 8 - "Component 8"
Cohesion: 0.15
Nodes (11): KDSContainer(), KDSOrder, PRIORITY_ORDER, sortRequests(), CashPayment, CashPaymentCardProps, formatTime(), Props (+3 more)

### Community 9 - "Component 9"
Cohesion: 0.09
Nodes (23): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, prettier (+15 more)

### Community 11 - "Component 11"
Cohesion: 0.10
Nodes (12): FeedbackController, JsonResponse, Request, Feedback, BelongsTo, BelongsToMany, HasMany, FeedbackMenuItem (+4 more)

### Community 12 - "Component 12"
Cohesion: 0.23
Nodes (6): Determine if feedback should be flagged for immediate attention., Complete sentiment analysis pipeline for a single text., Clean and normalize text., Analyze overall sentiment using TextBlob., Extract aspect-based sentiments using spaCy + TextBlob., SentimentAnalyzer

### Community 13 - "Component 13"
Cohesion: 0.15
Nodes (12): author, description, keywords, license, main, name, scripts, dev (+4 more)

### Community 14 - "Component 14"
Cohesion: 0.16
Nodes (6): PaymentController, JsonResponse, Request, Payment, BelongsTo, HasMany

### Community 15 - "Component 15"
Cohesion: 0.23
Nodes (4): MenuItem, BelongsTo, BelongsToMany, HasMany

### Community 16 - "Component 16"
Cohesion: 0.06
Nodes (23): AuthController, JsonResponse, Request, LoyaltyController, JsonResponse, Request, JsonResponse, Request (+15 more)

### Community 17 - "Component 17"
Cohesion: 0.12
Nodes (18): metadata, outfit, plusJakartaSans, AuthProvider(), ACTIVE_STATUSES, ActiveOrder, ActiveSession, getOrCreateDeviceId() (+10 more)

### Community 18 - "Component 18"
Cohesion: 0.17
Nodes (16): MenuContainer(), CartDrawer(), CartDrawerProps, CartFab(), CartFabProps, CartItem(), OrderSuccess(), OrderSuccessProps (+8 more)

### Community 19 - "Component 19"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 20 - "Component 20"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module (+12 more)

### Community 21 - "Component 21"
Cohesion: 0.04
Nodes (48): APIs & Eloquent Resources, Application Structure & Architecture, Artisan, Artisan, Authentication & Authorization, Available Search Syntax, Available Search Syntax, Comments (+40 more)

### Community 22 - "Component 22"
Cohesion: 0.08
Nodes (23): devDependencies, axios, concurrently, laravel-echo, laravel-vite-plugin, pusher-js, tailwindcss, @tailwindcss/vite (+15 more)

### Community 23 - "Component 23"
Cohesion: 0.16
Nodes (12): AdminLoginPage(), LoginContent(), RegisterContent(), ScanPage(), ScanState, TableInfo, PhoneInput(), PhoneInputProps (+4 more)

### Community 24 - "Component 24"
Cohesion: 0.11
Nodes (7): Order, BelongsTo, HasMany, BelongsTo, SplitBillItem, SplitBillService, Collection

### Community 25 - "Component 25"
Cohesion: 0.11
Nodes (14): CallbackInner(), DrawerState, FeedbackDrawer(), ItemReview, OrderDetail, OrderMenuItem, Ingredient, ItemDetailDrawerProps (+6 more)

### Community 26 - "Component 26"
Cohesion: 0.18
Nodes (10): Props, formatDate(), friendlyDate(), ReservationContainer(), Restaurant, Step, STEP_LABELS, STEPS (+2 more)

### Community 27 - "Component 27"
Cohesion: 0.29
Nodes (9): CartItemProps, CartContext, CartContextType, CartProvider(), loadPersisted(), mergeItems(), persist(), CartItem (+1 more)

### Community 28 - "Component 28"
Cohesion: 0.13
Nodes (16): metadata, SessionBanner(), statusConfig, UserMenu(), Priority, PRIORITY_OPTS, PriorityOption, REQUEST_OPTIONS (+8 more)

### Community 29 - "Component 29"
Cohesion: 0.18
Nodes (11): require-dev, barryvdh/laravel-debugbar, fakerphp/faker, laravel/boost, laravel/pail, laravel/pint, laravel/sail, mockery/mockery (+3 more)

### Community 30 - "Component 30"
Cohesion: 0.19
Nodes (9): metadata, QueueContainer(), STATUS_CONFIG, timeAgo(), Props, QueueEntry, QueueEntryCard(), STATUS_CONFIG (+1 more)

### Community 31 - "Component 31"
Cohesion: 0.18
Nodes (11): require, barryvdh/laravel-dompdf, guzzlehttp/guzzle, laravel/framework, laravel/reverb, laravel/sanctum, laravel/tinker, league/flysystem-aws-s3-v3 (+3 more)

### Community 32 - "Component 32"
Cohesion: 0.20
Nodes (9): allowedOrigins, app, cors, express, http, io, Redis, redisSubscriber (+1 more)

### Community 33 - "Component 33"
Cohesion: 0.14
Nodes (13): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+5 more)

### Community 34 - "Component 34"
Cohesion: 0.13
Nodes (15): scripts, dev, post-autoload-dump, post-update-cmd, pre-package-uninstall, test, Composer\\Config::disableProcessTimeout, Illuminate\\Foundation\\ComposerScripts::postAutoloadDump (+7 more)

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
Cohesion: 0.11
Nodes (23): BillSummary(), BillSummaryProps, ClaimableUnit, ClaimRecord, ItemizedSplit(), ItemizedSplitProps, PaymentDrawerProps, PaymentStatusTracker() (+15 more)

### Community 41 - "Component 41"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

### Community 81 - "Component 81"
Cohesion: 0.07
Nodes (28): Best Practices, Choose HTTP Streaming When:, Choose Long Polling When:, Choose SSE When:, Choose WebRTC When:, Choose WebSocket When:, Connection Limits (per server), Decision Matrix (+20 more)

### Community 82 - "Component 82"
Cohesion: 0.07
Nodes (27): Bundle Analysis, Caching Strategy, CDN & Edge, CI/CD with GitHub Actions, Database Connection Pooling, Deployment & Production, docker-compose.yml, Docker Deployment (+19 more)

### Community 110 - "Component 110"
Cohesion: 0.07
Nodes (26): 1. Static (Auto-Prerendered), 2. Cached (`use cache`), 3. Dynamic (Suspense), Built-in Profiles, Cache Components (Next.js 16+), Cache Invalidation, Cache Key Generation, Cache Profiles (+18 more)

### Community 111 - "Component 111"
Cohesion: 0.09
Nodes (22): Build-time vs Runtime, Docker Compose, Docker Deployment, Dockerfile, Environment Variables, Health Check Endpoint, Image Optimization, ISR and Cache Handlers (+14 more)

### Community 112 - "Component 112"
Cohesion: 0.10
Nodes (20): Best Practices, Cache Options, Client-Side Data Fetching, Data Fetching & Caching, Database Queries, Error Handling, Extended fetch API, Loading States (+12 more)

### Community 116 - "dependencies"
Cohesion: 0.10
Nodes (21): date-fns, dependencies, axios, date-fns, @headlessui/react, react-dom, react-hook-form, react-qr-code (+13 more)

### Community 117 - "Next.js Best Practices"
Cohesion: 0.10
Nodes (20): Async Patterns, Bundling, Data Patterns, Debug Tricks, Directives, Error Handling, File Conventions, Font Optimization (+12 more)

### Community 118 - "React Server Components"
Cohesion: 0.10
Nodes (19): Benefits of Server Components, Best Practices, Client Components, Composition Pattern, Context in Server/Client Components, Edge Runtime, Parallel Data Fetching, Pattern: Conditional Client Components (+11 more)

### Community 119 - "WebSocket Security Reference"
Cohesion: 0.10
Nodes (19): Admin-Only Events, Audit Logging, Authentication, Authorization, Connection Limiting, Cookie Authentication, CORS Configuration, DDoS Protection (+11 more)

### Community 120 - "Horizontal Scaling Reference"
Cohesion: 0.11
Nodes (18): Architecture Overview, Connection Limits, Cookie-based Sticky Sessions, Graceful Shutdown, HAProxy Configuration, Horizontal Scaling Reference, Kubernetes Horizontal Pod Autoscaling, Nginx Configuration (+10 more)

### Community 121 - "ShouldBroadcastNow"
Cohesion: 0.14
Nodes (4): AllPaymentsCompleted, PaymentCompleted, ServiceRequestUpdated, ShouldBroadcastNow

### Community 122 - "Table"
Cohesion: 0.16
Nodes (7): BelongsTo, HasMany, Table, QRCodeGenerationService, TablesTableSeeder, qrcode, qrcode

### Community 123 - "Pest Testing 4"
Cohesion: 0.11
Nodes (18): Architecture Testing, Assertions, Basic Test Structure, Basic Usage, Browser Test Example, Common Pitfalls, Creating Tests, Datasets (+10 more)

### Community 124 - "Parallel & Intercepting Routes"
Cohesion: 0.11
Nodes (17): 1. Missing `default.tsx` → 404 on Refresh, 2. Modal Persists After Navigation, 3. Nested Parallel Routes Need Defaults Too, 4. Intercepted Route Shows Wrong Content, 5. TypeScript Errors with `params`, Common Gotchas, Complete Example: Photo Gallery Modal, File Structure (+9 more)

### Community 125 - "Server Actions"
Cohesion: 0.11
Nodes (17): Basic Server Action, Best Practices, Client Component with Server Action, Error Handling, Form with Server Action, Inline Server Action, Optimistic Updates, Programmatic Server Action Call (+9 more)

### Community 126 - "OrderController.php"
Cohesion: 0.22
Nodes (5): OrderController, JsonResponse, Request, OrderItemCustomization, BelongsTo

### Community 127 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 128 - "3. Customer-Facing Application"
Cohesion: 0.12
Nodes (17): 3.10 Advance Table Reservation, 3.11 Sentiment-Based Feedback, 3.12 Customer Loyalty Program, 3.3 Digital Menu Browsing, 3.4 AI-Powered Menu Recommendations, 3.6 Real-Time Order Placement & Tracking, 3.9 Digital Waiter Assistance, 3. Customer-Facing Application (+9 more)

### Community 129 - "Data Patterns"
Cohesion: 0.12
Nodes (15): Avoiding Data Waterfalls, Client Component Data Fetching, Data Patterns, Decision Tree, Option 1: Pass from Server Component (Preferred), Option 2: Fetch on Mount (When Necessary), Option 3: Server Action for Reads (Works But Not Ideal), Pattern 1: Server Components (Preferred for Reads) (+7 more)

### Community 130 - "App Router Architecture"
Cohesion: 0.12
Nodes (15): App Router Architecture, Catch-All Routes, Dynamic Routes, Error Boundaries, File-Based Routing, Intercepting Routes, Loading States, Metadata API (+7 more)

### Community 132 - "**COMPLETE IMPLEMENTATION GUIDE**"
Cohesion: 0.12
Nodes (15): **12. TROUBLESHOOTING GUIDE**, **7.1 Create Flask Application**, **7.2 Start Flask Server**, **7. ML SERVICE (PYTHON/FLASK)**, **8.1 WhatsApp Business API Setup**, **8.2 JazzCash Payment Integration**, **8. THIRD-PARTY INTEGRATIONS**, **AI-Powered Smart Restaurant Ecosystem** (+7 more)

### Community 133 - "Queue System"
Cohesion: 0.13
Nodes (14): Best Practices, Dispatching Jobs, Failed Jobs, Horizon Setup, Job Batching, Job Chaining, Job Middleware, Job Patterns (+6 more)

### Community 134 - "Laravel Specialist"
Cohesion: 0.13
Nodes (14): API Resource, Code Templates, Constraints, Core Workflow, Eloquent Model, Feature Test (Pest), Knowledge Reference, Laravel Specialist (+6 more)

### Community 135 - "Bundling"
Cohesion: 0.13
Nodes (14): Bundle Analysis, Bundling, Common Problematic Packages, CSS Imports, Error Signs, Error Signs, ESM/CommonJS Issues, Migrating from Webpack to Turbopack (+6 more)

### Community 136 - "SKILL.md"
Cohesion: 0.13
Nodes (10): Directives, Next.js Directive, React Directives, `'use cache'`, `'use client'`, `'use server'`, Quick Reference, Suspense Boundaries (+2 more)

### Community 138 - "SessionParticipant"
Cohesion: 0.21
Nodes (6): JsonResponse, Request, TableController, BelongsTo, HasMany, SessionParticipant

### Community 139 - "Tailwind CSS Development"
Cohesion: 0.13
Nodes (14): Basic Usage, Common Patterns, Common Pitfalls, CSS-First Configuration, Dark Mode, Documentation, Flexbox Layout, Grid Layout (+6 more)

### Community 140 - "Livewire Components"
Cohesion: 0.14
Nodes (13): Authorization, Blade Template, Component Patterns, Events, Form Component, Form Template, Listen to Browser Events, Livewire Components (+5 more)

### Community 141 - "Routing & API Resources"
Cohesion: 0.15
Nodes (12): API Resources, API Routes, API Versioning, Controllers, CORS Configuration, Form Requests, Middleware, Resource Collections (+4 more)

### Community 142 - "Available Tools"
Cohesion: 0.15
Nodes (12): Available Tools, Debug Tricks, Example: Get Errors, `get_errors`, `get_logs`, `get_page_metadata`, `get_project_metadata`, `get_routes` (+4 more)

### Community 143 - "Next.js Developer"
Cohesion: 0.15
Nodes (12): Code Examples, Constraints, Core Workflow, generateMetadata for dynamic SEO, Knowledge Reference, MUST DO (Next.js-specific), MUST NOT DO, Next.js Developer (+4 more)

### Community 144 - "dependencies"
Cohesion: 0.15
Nodes (13): cors, dotenv, express, ioredis, node-fetch, socket.io, dependencies, cors (+5 more)

### Community 145 - "Testing"
Cohesion: 0.17
Nodes (11): API Testing, Authentication Testing, Best Practices, Database Testing, Factories, Feature Tests, Mocking, Pest PHP (+3 more)

### Community 146 - "Error Handling"
Cohesion: 0.17
Nodes (11): Auth Errors, Error Boundaries, Error Handling, Error Hierarchy, `error.tsx`, `global-error.tsx`, Not Found, `not-found.tsx` (+3 more)

### Community 147 - "File Conventions"
Cohesion: 0.17
Nodes (11): File Conventions, File Conventions Reference, Intercepting Routes, Middleware / Proxy, Next.js 14-15: `middleware.ts`, Next.js 16+: `proxy.ts`, Parallel Routes, Private Folders (+3 more)

### Community 148 - "WebSocket Protocol Reference"
Cohesion: 0.17
Nodes (11): Binary Data Handling, Close Codes, Compression (permessage-deflate), Frame Structure, Handshake Process, Message Size Limits, Opcodes, Ping/Pong Mechanism (+3 more)

### Community 149 - "WebSocket Engineer"
Cohesion: 0.17
Nodes (11): Client-Side Reconnection with Exponential Backoff, Code Examples, Constraints, Core Workflow, Knowledge Reference, MUST DO, MUST NOT DO, Output Templates (+3 more)

### Community 151 - "🍽️ Smart Restaurant Ecosystem — Feature Documentation"
Cohesion: 0.17
Nodes (11): 1. System Overview, 2. System Architecture, 7. AI & Machine Learning Features, 8. Security Features, Demand Forecasting Engine (Module 3 & 11), Key Metrics & Value Propositions, ML Service Deployment, Recommendation Engine (Module 7) (+3 more)

### Community 152 - "Font Optimization"
Cohesion: 0.18
Nodes (11): Common Mistakes, Display Strategy, Don't Use Manual Font Links, Font in Specific Components, Font Optimization, Font Weights and Styles, Google Fonts, Local Fonts (+3 more)

### Community 153 - "Quick Reference"
Cohesion: 0.18
Nodes (11): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+3 more)

### Community 154 - "WebSocket Patterns Reference"
Cohesion: 0.18
Nodes (10): Acknowledgments, Backpressure Handling, Broadcasting Patterns, Message Queue Pattern, Namespaces (Logical Separation), Presence System, Pub/Sub Pattern, Rooms and Namespaces (+2 more)

### Community 155 - "Dispatchable"
Cohesion: 0.22
Nodes (3): CheckoutStarted, ServiceRequestCreated, Dispatchable

### Community 156 - "MenuController"
Cohesion: 0.36
Nodes (3): MenuController, JsonResponse, Request

### Community 157 - "**1.1 Required Software Installation**"
Cohesion: 0.18
Nodes (11): **1.1 Required Software Installation**, **Step 10: Install Code Editor (VS Code)**, **Step 1: Install Homebrew (macOS) / Chocolatey (Windows)**, **Step 2: Install Git**, **Step 3: Install Node.js and npm**, **Step 4: Install PHP 8.2**, **Step 5: Install Composer (PHP Package Manager)**, **Step 6: Install MySQL 8.0** (+3 more)

### Community 158 - "**2.1 Complete MySQL Schema Definition**"
Cohesion: 0.18
Nodes (11): **2.1.1 Users \& Authentication**, **2.1.2 Restaurant \& Tables**, **2.1.3 Menu Management**, **2.1.4 Orders \& Payments**, **2.1.5 Reservations \& Queue Management**, **2.1.6 Service Requests \& Feedback**, **2.1.7 AI/ML Tables**, **2.1.8 Loyalty \& Analytics** (+3 more)

### Community 159 - "**3.1 Laravel RESTful API Endpoints**"
Cohesion: 0.18
Nodes (11): **3.1.10 Admin/Analytics Endpoints**, **3.1.1 Authentication Endpoints**, **3.1.2 Table \& Session Endpoints**, **3.1.3 Menu Endpoints**, **3.1.4 Order Endpoints**, **3.1.5 Payment Endpoints**, **3.1.6 Service Request Endpoints**, **3.1.7 Reservation Endpoints** (+3 more)

### Community 160 - "devDependencies"
Cohesion: 0.18
Nodes (11): nodemon, devDependencies, nodemon, @types/cors, @types/express, @types/node, typescript, @types/node (+3 more)

### Community 161 - "Eloquent ORM"
Cohesion: 0.20
Nodes (9): Advanced Queries, Custom Casts, Eloquent ORM, Model Events, Model Patterns, Performance Tips, Query Optimization, Query Scopes (+1 more)

### Community 162 - "Async Params and SearchParams"
Cohesion: 0.20
Nodes (9): Async Cookies and Headers, Async Params and SearchParams, Async Patterns, generateMetadata, Migration Codemod, Pages and Layouts, Route Handlers, SearchParams (+1 more)

### Community 163 - "Functions"
Cohesion: 0.20
Nodes (9): After Response, Common Examples, Functions, Generate Functions, Navigation, Navigation Hooks (Client), Request/Response, Server Functions (+1 more)

### Community 164 - "Common Causes and Fixes"
Cohesion: 0.20
Nodes (9): Browser-only APIs, Common Causes and Fixes, Date/Time Rendering, Debugging, Error Signs, Hydration Errors, Invalid HTML Nesting, Random Values or IDs (+1 more)

### Community 165 - "Image Optimization"
Cohesion: 0.20
Nodes (9): Always Use next/image, Blur Placeholder, Common Mistakes, Image Optimization, Priority Loading, Remote Images Configuration, Required Props, Responsive Images (+1 more)

### Community 166 - "OG Image Generation"
Cohesion: 0.20
Nodes (9): Basic OG Image, Custom Fonts, Dynamic OG Image, File Naming, Important Rules, Multiple OG Images, Multiple Sitemaps, OG Image Generation (+1 more)

### Community 167 - "Scripts"
Cohesion: 0.20
Nodes (9): Don't Put Script in Head, Google Analytics, Google Tag Manager, Inline Scripts Need ID, Loading Strategies, Other Third-Party Scripts, Quick Reference, Scripts (+1 more)

### Community 168 - "SerializesModels"
Cohesion: 0.24
Nodes (3): SessionParticipantJoined, SplitBillItemClaimed, SerializesModels

### Community 169 - "InteractsWithSockets"
Cohesion: 0.24
Nodes (3): SessionParticipantLeft, SplitBillConfigured, InteractsWithSockets

### Community 170 - "Ingredient"
Cohesion: 0.29
Nodes (4): Ingredient, BelongsTo, BelongsToMany, HasMany

### Community 171 - "**4. MODULE-SPECIFIC DEEP DIVES**"
Cohesion: 0.20
Nodes (10): **4.1.1 Content-Based Filtering Algorithm**, **4.1 AI Menu Recommendation Engine**, **4.2.1 Urgency Indicator Logic**, **4.2.2 Socket.io Server Implementation**, **4.2 Real-Time Kitchen Display System (KDS)**, **4.3.1 Sentiment Analysis Model**, **4.3 NLP Sentiment Analysis Pipeline**, **4.4.1 WebAR Integration** (+2 more)

### Community 172 - "KDSOrderTicket.tsx"
Cohesion: 0.24
Nodes (9): getElapsedTime(), getUrgency(), KDSOrder, KDSOrderTicket(), KDSOrderTicketProps, nextStatusMap, OrderItem, UrgencyLevel (+1 more)

### Community 173 - "app.py"
Cohesion: 0.22
Nodes (7): analyze_sentiment(), analyze_sentiment_batch(), generate_recommendations(), get_db_connection(), Analyze multiple review texts independently (one per menu item).      Each item', Analyze sentiment of a single text review., Sentiment Analyzer — TextBlob + spaCy pipeline for restaurant feedback.  Provide

### Community 174 - "Metadata"
Cohesion: 0.22
Nodes (9): Avoid Duplicate Fetches, Dynamic Metadata, Important: Server Components Only, Metadata, Metadata File Conventions, SEO Best Practice: Static Files Are Often Enough, Static Metadata, Title Templates (+1 more)

### Community 175 - "Route Handlers"
Cohesion: 0.22
Nodes (9): Basic Usage, Dynamic Route Handlers, Environment Behavior, GET Handler Conflicts with page.tsx, Request Helpers, Response Helpers, Route Handlers, Supported Methods (+1 more)

### Community 176 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.22
Nodes (8): Available Domains, Available Stacks, How to Use, Output Formats, Prerequisites, Rule Categories by Priority, Search Reference, UI/UX Pro Max - Design Intelligence

### Community 177 - "README.md"
Cohesion: 0.22
Nodes (8): About Laravel, Code of Conduct, Contributing, Laravel Sponsors, Learning Laravel, License, Premium Partners, Security Vulnerabilities

### Community 178 - "Features:"
Cohesion: 0.22
Nodes (9): 5. Executive Analytics Dashboard, Customer Loyalty Metrics, Features:, Ingredient Wastage Reports, Menu Performance Analytics, Order Fulfillment Performance, Peak Hours Heatmap, Revenue Analytics (+1 more)

### Community 179 - "**Software Design Document (SDD)**"
Cohesion: 0.22
Nodes (8): **7. IMPLEMENTATION CHECKLIST**, Act as a Senior Software Architect. I am developing an AI-Powered Smart Restaurant Ecosystem and I need you to generate a comprehensive Software Design Document (SDD). This document must serve as a complete technical manual for me to follow during the development phase., **AI-Powered Smart Restaurant Ecosystem**, **CONCLUSION**, **Phase 1 (March - May 2026)**, **Phase 2 (September - November 2026)**, **Software Design Document (SDD)**, **Testing \& Deployment (November 2026)**

### Community 180 - "**3. API \& INTEGRATION DESIGN**"
Cohesion: 0.22
Nodes (9): **3.2.1 Recommendation Engine**, **3.2.2 Sentiment Analysis**, **3.2.3 Demand Forecasting**, **3.2 Python ML Service API Endpoints**, **3.3.1 WhatsApp Business API (OTP)**, **3.3.2 JazzCash Payment Integration**, **3.3 Third-Party API Integrations**, **3.4 Smart Split-Bill Logic** (+1 more)

### Community 181 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 182 - "WaiterRequestCard.tsx"
Cohesion: 0.25
Nodes (7): getElapsed(), PRIORITY_BADGE, STATUS_BADGE, TYPE_CONFIG, WaiterRequest, WaiterRequestCard(), WaiterRequestCardProps

### Community 183 - "HasFactory"
Cohesion: 0.36
Nodes (4): Category, BelongsTo, HasMany, HasFactory

### Community 184 - "setup"
Cohesion: 0.25
Nodes (8): post-root-package-install, setup, composer install, npm install, npm run build, @php artisan key:generate, @php artisan migrate --force, @php -r \"file_exists('.env') || copy('.env.example', '.env');\

### Community 185 - "Features:"
Cohesion: 0.25
Nodes (8): 4. Real-Time Kitchen Display System (KDS), Color-Coded Urgency Indicators, Features:, Inventory & Ingredient Tracking, Kitchen Performance Metrics, Order Reception & Display, Order Status Management, Predictive Demand Analytics

### Community 186 - "9. Technology Stack"
Cohesion: 0.25
Nodes (8): 9. Technology Stack, AI / Machine Learning, Augmented Reality, Backend, DevOps & Third-Party Services, Frontend, Hardware Requirements, Real-Time Communication

### Community 187 - "Detection Rules"
Cohesion: 0.29
Nodes (6): 1. Async Client Components Are Invalid, 2. Non-Serializable Props to Client Components, 3. Server Actions Are the Exception, Detection Rules, Quick Reference, RSC Boundaries

### Community 188 - "Runtime Selection"
Cohesion: 0.29
Nodes (6): Detection, Edge Runtime, Node.js Runtime (Default), Runtime Selection, Use Node.js Runtime by Default, When to Use Each

### Community 190 - "**2. PROJECT INITIALIZATION**"
Cohesion: 0.29
Nodes (7): **2.1 Create Project Root Directory**, **2.2 Create Project Structure**, **2.3 Initialize Laravel Backend**, **2.4 Initialize Next.js Frontend**, **2.5 Initialize Socket.io Server**, **2.6 Initialize Python ML Service**, **2. PROJECT INITIALIZATION**

### Community 191 - "**4. BACKEND DEVELOPMENT (LARAVEL API)**"
Cohesion: 0.29
Nodes (7): **4.1 Create Models**, **4.2 Create Controllers**, **4.3 Define API Routes**, **4.4 Create Events for Broadcasting**, **4.5 Configure Broadcasting**, **4.6 Test API Endpoints**, **4. BACKEND DEVELOPMENT (LARAVEL API)**

### Community 192 - "**5. FRONTEND DEVELOPMENT (NEXT.JS PWA)**"
Cohesion: 0.29
Nodes (7): **5.1 Setup Project Structure**, **5.2 Create API Client**, **5.3 Create Socket.io Client**, **5.4 Create React Context for Auth**, **5.5 Create Login Page**, **5.6 Create Menu Display Component**, **5. FRONTEND DEVELOPMENT (NEXT.JS PWA)**

### Community 193 - "**FINAL CHECKLIST**"
Cohesion: 0.29
Nodes (7): **Backend**, **Database**, **Deployment**, **FINAL CHECKLIST**, **Frontend**, **ML Service**, **Socket.io**

### Community 194 - "Design System: Smart Restaurant Ecosystem"
Cohesion: 0.29
Nodes (6): 1. Overview, 2. Aesthetics & Theme, 3. Typography & Next.js Optimization, 4. Components & Layout, 5. Next.js Best Practices, Design System: Smart Restaurant Ecosystem

### Community 195 - "FlaggedFeedbackAlert.tsx"
Cohesion: 0.33
Nodes (5): FlaggedFeedback, FlaggedFeedbackAlert(), FlaggedFeedbackAlertProps, FlaggedItemRating, formatCountdown()

### Community 196 - "Pre-Delivery Checklist"
Cohesion: 0.33
Nodes (6): Accessibility, Interaction, Layout, Light/Dark Mode, Pre-Delivery Checklist, Visual Quality

### Community 197 - "How to Use This Skill"
Cohesion: 0.33
Nodes (6): How to Use This Skill, Step 1: Analyze User Requirements, Step 2: Generate Design System (REQUIRED), Step 2b: Persist Design System (Master + Overrides Pattern), Step 3: Supplement with Detailed Searches (as needed), Step 4: Stack Guidelines (React Native)

### Community 199 - "Common Rules for Professional UI"
Cohesion: 0.40
Nodes (5): Common Rules for Professional UI, Icons & Visual Elements, Interaction (App), Layout & Spacing, Light/Dark Mode Contrast

### Community 200 - "Example Workflow"
Cohesion: 0.40
Nodes (5): Example Workflow, Step 1: Analyze Requirements, Step 2: Generate Design System (REQUIRED), Step 3: Supplement with Detailed Searches (as needed), Step 4: Stack Guidelines

### Community 204 - "**1.2 Development Tools**"
Cohesion: 0.40
Nodes (5): **1.2 Development Tools**, **1. PREREQUISITES \& ENVIRONMENT SETUP**, **Install Postman (API Testing)**, **Install Redis Insight (Redis GUI)**, **Install TablePlus (Database GUI)**

### Community 205 - "**3. DATABASE SETUP \& MIGRATIONS**"
Cohesion: 0.40
Nodes (5): **3.1 Create Laravel Migrations**, **3.2 Write Migration Code**, **3.3 Run Migrations**, **3.4 Create Database Seeders**, **3. DATABASE SETUP \& MIGRATIONS**

### Community 206 - "10. Development Phases & Milestones"
Cohesion: 0.40
Nodes (5): 10. Development Phases & Milestones, Milestone Schedule, Out of Scope (Explicitly Excluded), Phase 1 — Foundation & Core Infrastructure (Semester 1), Phase 2 — Advanced Features & AI Integration (Semester 2)

### Community 207 - "6. Backend Infrastructure & APIs"
Cohesion: 0.40
Nodes (5): 6. Backend Infrastructure & APIs, Core API Features:, Database & Caching:, External Integrations:, Real-Time Communication:

### Community 208 - "**1. SYSTEM ARCHITECTURE (C4 MODEL)**"
Cohesion: 0.40
Nodes (5): **1.1 Context Diagram (Level 1)**, **1.2 Container Diagram (Level 2)**, **1.3 Component Diagram (Level 3) - Laravel Backend**, **1.4 Real-Time Communication Flow**, **1. SYSTEM ARCHITECTURE (C4 MODEL)**

### Community 209 - "**5. DEVOPS \& DEPLOYMENT PROCEDURES**"
Cohesion: 0.40
Nodes (5): **5.1 Docker Containerization**, **5.2 Git Branching Strategy**, **5.3 CI/CD Pipeline (GitHub Actions)**, **5.4 Deployment Timeline**, **5. DEVOPS \& DEPLOYMENT PROCEDURES**

### Community 210 - "**6. SECURITY \& VALIDATION**"
Cohesion: 0.40
Nodes (5): **6.1 JWT Authentication Flow**, **6.2 Role-Based Access Control (RBAC)**, **6.3 Data Validation**, **6.4 Security Best Practices**, **6. SECURITY \& VALIDATION**

### Community 211 - "**8. PERFORMANCE OPTIMIZATION GUIDELINES**"
Cohesion: 0.40
Nodes (5): **8. PERFORMANCE OPTIMIZATION GUIDELINES**, **API Optimization**, **Database Optimization**, **Frontend Optimization**, **Real-Time Optimization**

### Community 212 - "Tips for Better Results"
Cohesion: 0.50
Nodes (4): Common Sticking Points, Pre-Delivery Checklist, Query Strategy, Tips for Better Results

### Community 213 - "When to Apply"
Cohesion: 0.50
Nodes (4): Must Use, Recommended, Skip, When to Apply

### Community 220 - "post-create-project-cmd"
Cohesion: 0.50
Nodes (4): post-create-project-cmd, @php artisan key:generate --ansi, @php artisan migrate --graceful --ansi, @php -r \"file_exists('database/database.sqlite') || touch('database/database.sqlite');\

### Community 221 - "**9. MODULE-BY-MODULE IMPLEMENTATION**"
Cohesion: 0.50
Nodes (4): **9. MODULE-BY-MODULE IMPLEMENTATION**, **Example: Module 1 - Authentication (Completed Above)**, **Example: Module 3 - Real-Time KDS**, **Module Implementation Pattern**

### Community 222 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 228 - "**10. TESTING \& QUALITY ASSURANCE**"
Cohesion: 0.67
Nodes (3): **10.1 Laravel Testing**, **10.2 Frontend Testing**, **10. TESTING \& QUALITY ASSURANCE**

### Community 229 - "**11. DEPLOYMENT PROCEDURES**"
Cohesion: 0.67
Nodes (3): **11.1 Production Environment Setup**, **11.2 Docker Production Configuration**, **11. DEPLOYMENT PROCEDURES**

### Community 230 - "**6. REAL-TIME SYSTEM (SOCKET.IO)**"
Cohesion: 0.67
Nodes (3): **6.1 Create Socket.io Server**, **6.2 Start Socket.io Server**, **6. REAL-TIME SYSTEM (SOCKET.IO)**

### Community 231 - "3.1 Authentication & Session Management"
Cohesion: 0.67
Nodes (3): 3.1 Authentication & Session Management, Features:, Technical Details:

### Community 232 - "3.2 QR Code Table Linking"
Cohesion: 0.67
Nodes (3): 3.2 QR Code Table Linking, Features:, Technical Details:

### Community 233 - "3.5 Custom Ingredient Picker"
Cohesion: 0.67
Nodes (3): 3.5 Custom Ingredient Picker, Features:, Technical Details:

### Community 234 - "3.7 AR Dish Visualization"
Cohesion: 0.67
Nodes (3): 3.7 AR Dish Visualization, Features:, Technical Details:

### Community 235 - "3.8 Smart Split-Bill Payment"
Cohesion: 0.67
Nodes (3): 3.8 Smart Split-Bill Payment, Features:, Technical Details:

## Knowledge Gaps
- **1001 isolated node(s):** `php`, `$schema`, `name`, `type`, `description` (+996 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@heroicons/react`, `@hookform/resolvers`, `next`, `react`, `@react-three/fiber`, `socket.io-client`, `zustand`, `package.json`, `Table`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `qrcode` connect `Table` to `dependencies`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Order` (e.g. with `.activeKitchenOrders()` and `.dashboardStats()`) actually correct?**
  _`Order` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _1038 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Component 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `Component 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Component 3` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._