# 🍽️ Smart Restaurant Ecosystem — Feature Documentation

> **Project:** AI-Powered Smart Restaurant Ecosystem  
> **Institution:** Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (SZABIST), Islamabad  
> **Team:** Hamza Shehzad, Syed Muhammad Moin Ali Shah, Hashim Khan Shinwari  
> **Version:** 2.0 — Spring 2026

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Customer-Facing Application](#3-customer-facing-application)
   - 3.1 [Authentication & Session Management](#31-authentication--session-management)
   - 3.2 [QR Code Table Linking](#32-qr-code-table-linking)
   - 3.3 [Digital Menu Browsing](#33-digital-menu-browsing)
   - 3.4 [AI-Powered Menu Recommendations](#34-ai-powered-menu-recommendations)
   - 3.5 [Custom Ingredient Picker](#35-custom-ingredient-picker)
   - 3.6 [Real-Time Order Placement & Tracking](#36-real-time-order-placement--tracking)
   - 3.7 [AR Dish Visualization](#37-ar-dish-visualization)
   - 3.8 [Smart Split-Bill Payment](#38-smart-split-bill-payment)
   - 3.9 [Digital Waiter Assistance](#39-digital-waiter-assistance)
   - 3.10 [Advance Table Reservation](#310-advance-table-reservation)
   - 3.11 [Sentiment-Based Feedback](#311-sentiment-based-feedback)
   - 3.12 [Customer Loyalty Program](#312-customer-loyalty-program)
4. [Real-Time Kitchen Display System (KDS)](#4-real-time-kitchen-display-system-kds)
5. [Executive Analytics Dashboard](#5-executive-analytics-dashboard)
6. [Backend Infrastructure & APIs](#6-backend-infrastructure--apis)
7. [AI & Machine Learning Features](#7-ai--machine-learning-features)
8. [Security Features](#8-security-features)
9. [Technology Stack](#9-technology-stack)
10. [Development Phases & Milestones](#10-development-phases--milestones)

---

## 1. System Overview

The **Smart Restaurant Ecosystem** is a contactless, web-based platform that revolutionizes the dining experience by integrating Artificial Intelligence, Real-Time Communication, Augmented Reality, and Natural Language Processing into a single unified platform.

The system is structured around **three interconnected components**:

| Component | Target Users | Primary Purpose |
|---|---|---|
| Customer Progressive Web App (PWA) | Dine-in customers | Contactless ordering, AR visualization, payments |
| Real-Time Kitchen Display System (KDS) | Kitchen staff | Order management, urgency tracking, demand forecasting |
| Executive Analytics Dashboard | Restaurant owners/admins | Business intelligence, sentiment reports, analytics |

### Key Metrics & Value Propositions

- **20–25% improvement** in table turnover rates during peak hours via QR-based ordering
- **90% reduction** in order inaccuracies through digital order transmission
- **30% reduction** in labor costs through automated ordering and digital assistance
- **85% increase** in order confidence via WebAR 3D dish visualization
- **45% boost** in premium item sales when customers can preview dishes in 3D
- **30% reduction** in food wastage through predictive demand forecasting

---

## 2. System Architecture

The Smart Restaurant Ecosystem implements a **multi-tier architecture** with clearly separated layers:


---

## 3. Customer-Facing Application

The customer application is a **Progressive Web Application (PWA)** accessible via modern web browsers on both mobile and desktop — no native app installation required. It is initiated by scanning a table-specific QR code.

---

### 3.1 Authentication & Session Management

The system implements **Multi-Factor Authentication (MFA)** to verify customer identity securely before granting access to personalized features.

#### Features:
- **Email/Password Registration & Login** — Standard credential-based authentication
- **WhatsApp OTP Verification** — One-time password sent via WhatsApp Business API as the second authentication factor
- **Laravel Sanctum Token Authentication** — Stateless API token-based session management
- **bcrypt Password Hashing** — Industry-standard password encryption at rest
- **Role-Based Access Control (RBAC)** — Separate roles for customers, kitchen staff, and administrators with different access levels and permissions
- **Session Persistence** — Table sessions are maintained throughout the entire dining experience, allowing customers to add to orders without re-authenticating

#### Technical Details:
- Built with **Laravel Sanctum** for API token management
- **WhatsApp Business API** integration for OTP delivery
- Secure session storage using **Redis**

---

### 3.2 QR Code Table Linking

Each physical restaurant table has a **unique QR code** that links customers to a table-specific digital session.

#### Features:
- **Unique Table Identifier Generation** — Each table has a dynamically generated, unique QR code managed by the backend
- **Instant Table Session Initiation** — Scanning the QR code via any smartphone camera opens the customer PWA and auto-links the device to the correct table session
- **Multi-User Session Joining** — Multiple customers at the same table can join the same session on their own devices, enabling split-bill and shared ordering functionality
- **Session State Management** — The table session maintains order state throughout the dining experience (browsing → ordering → payment)
- **No App Download Required** — The PWA loads directly in the browser upon QR scan

#### Technical Details:
- QR code generation and management via **Laravel backend**
- Table sessions stored and managed in **Redis** for fast read/write
- Session scoping ensures orders from different tables are completely isolated

---

### 3.3 Digital Menu Browsing

Customers access a fully digital, interactive menu that replaces physical menus entirely.

#### Features:
- **Category-Based Navigation** — Browse menu items organized by category (starters, mains, desserts, beverages, etc.)
- **Dish Detail Pages** — Each item displays name, description, ingredients, pricing, nutritional information, and dietary tags (e.g., vegan, gluten-free, spicy)
- **Real-Time Availability Status** — Menu items are marked as available or sold-out based on live inventory data
- **Search Functionality** — Keyword-based search across menu items
- **Visual Media** — High-quality dish images served via CDN (Cloudinary/AWS S3) for fast loading
- **Dietary & Allergen Filters** — Filter menu items based on dietary restrictions and allergen information to assist customers with specific needs

---

### 3.4 AI-Powered Menu Recommendations

The system features an **Intelligent Menu Recommendation Engine** that personalizes suggestions for each customer using machine learning.

#### Features:
- **Content-Based Filtering Algorithm** — Analyzes menu item attributes such as cuisine type, ingredients, spice level, and price range to calculate item similarity and generate personalized suggestions
- **Time-of-Day Recommendations** — The engine adapts suggestions based on time patterns (e.g., lighter meals at lunch, heartier options at dinner)
- **Popularity-Based Trending** — Surfaces trending dishes based on order frequency data across the restaurant
- **Intelligent Food Pairing** — Recommends complementary items (e.g., beverages with meals, desserts with mains) to enhance the dining experience and increase average order value
- **Upselling Engine** — Strategically suggests premium or add-on items based on the customer's current cart contents and preferences
- **Cold-Start Handling** — For new customers with no order history, the engine falls back to popularity trends and cuisine-type preferences gathered at onboarding

#### Technical Details:
- Implemented with **scikit-learn** using cosine similarity for feature-based matching
- Feature vectors built from: cuisine type, ingredients, spice level, price, popularity score
- **TensorFlow/PyTorch** used for deep learning-based recommendation refinement
- ML model served as a REST API via **Flask/FastAPI** and consumed by the Laravel backend

---

### 3.5 Custom Ingredient Picker

Customers can fully **customize their dishes** by modifying the ingredient composition before placing an order.

#### Features:
- **Add Ingredients** — Choose from a list of available add-ons (e.g., extra cheese, additional protein)
- **Remove Ingredients** — Remove default components (e.g., no onions, no sauce)
- **Modify Ingredient Quantities** — Adjust portions of specific ingredients
- **Build-Your-Own Dish** — Compose a dish from scratch by selecting a base and adding desired ingredients
- **Dynamic Price Calculation** — The total price updates in real-time as ingredients are added or removed, reflecting the exact cost of the customized order
- **Ingredient Availability Validation** — The interface only presents ingredients that are currently in stock, preventing orders for unavailable items

#### Technical Details:
- Real-time pricing logic handled on the frontend using **React/Zustand** state management
- Ingredient availability synced with backend inventory via **REST API**

---

### 3.6 Real-Time Order Placement & Tracking

Once a customer finalizes their selections, the order is transmitted and tracked in real-time.

#### Features:
- **Instant Order Submission** — Orders are sent to the kitchen instantly via **Socket.io WebSocket** connections, with no perceptible delay
- **Order Confirmation** — Customers receive an immediate on-screen confirmation with an order reference number
- **Live Order Status Tracking** — Customers can monitor their order's progress (e.g., Received → Preparing → Ready) directly in the app
- **Push Notifications** — **Firebase Cloud Messaging (FCM)** delivers order status updates as push notifications even if the app is in the background
- **Order History** — View current session orders and modify or add to them until the kitchen begins preparation

---

### 3.7 AR Dish Visualization

The most immersive feature of the customer app — **WebAR-powered 3D dish previews** that allow customers to visualize dishes before ordering.

#### Features:
- **3D Dish Preview** — View photorealistic 3D models of signature menu items directly in the browser using the device camera
- **True-Scale Visualization** — AR models are rendered at accurate real-world scale so customers can gauge portion sizes
- **Marker-Based & Markerless Tracking** — Supports both QR-marker-anchored AR and markerless surface-detection AR for flexible environments
- **No App Installation** — Fully browser-based; works on any modern smartphone (iOS 12+ / Android 8.0+) without downloading an app
- **Immersive Table Preview** — Customers can place a virtual dish model on their actual table to compare with real surroundings
- **Realistic Rendering** — 3D models created in **Blender** with photorealistic textures, lighting, and shadows, exported as GLTF/GLB for web rendering

#### Technical Details:
- WebAR powered by **AR.js** or **8th Wall**
- 3D rendering engine: **Three.js**
- 3D model creation: **Blender** (exported as GLTF/GLB)
- Models stored in **Cloudinary/AWS S3** with CDN distribution

---

### 3.8 Smart Split-Bill Payment

Designed for group dining, the split-bill system eliminates the awkward checkout experience by letting each person pay independently.

#### Features:
- **Multi-User Bill Joining** — All diners at the same table join the shared session on their own devices
- **Individual Item Payment** — Each person selects and pays for only the items they ordered
- **Equal Split Option** — Divide the total bill equally among all session participants
- **Custom Split Amounts** — Define custom payment proportions for unequal splits
- **Multiple Payment Methods** — Supports:
  - **JazzCash** — Pakistani mobile wallet
  - **EasyPaisa** — Pakistani mobile wallet
  - **International Credit/Debit Cards** — For broader payment acceptance
- **Payment Status Tracking** — The system tracks which participants have paid and which are pending, notifying the table session in real-time when all payments are complete
- **Digital Receipt** — Each payer receives a digital receipt for their portion of the bill

#### Technical Details:
- Multi-user session management via **Redis** and **Socket.io**
- Payment gateway integration: **JazzCash API**, **EasyPaisa API**
- **Laravel Cashier** used as the payment subscription/management wrapper

---

### 3.9 Digital Waiter Assistance

Customers can request waiter assistance directly from the app, replacing the need to physically flag down staff.

#### Features:
- **Categorized Service Requests** — Customers select from predefined request categories such as:
  - Request water/refills
  - Ask for cutlery/utensils
  - Request the bill
  - Report an issue
  - General assistance
- **Priority-Based Queue Management** — Requests are queued and prioritized to optimize staff response order and efficiency
- **Real-Time Notifications** — Requests are pushed instantly to the Kitchen Display System and the Admin Dashboard via **FCM** and **Socket.io**
- **Request Status Tracking** — Customers can see if their request has been acknowledged and is being attended to
- **Timestamped Logging** — All service requests are logged with timestamps for performance analysis

---

### 3.10 Advance Table Reservation

Customers can reserve restaurant tables remotely before arriving, with real-time queue visibility.

#### Features:
- **Online Table Reservation** — Book a specific table or a table for a specific number of guests at a future date and time
- **Real-Time Availability Tracking** — Live display of which tables are currently available, occupied, or reserved
- **Live Queue Status Monitoring** — Customers can monitor their queue position if the restaurant is full and they are on a waitlist
- **Automated Confirmation Notifications** — Reservation confirmations and reminders are sent via **WhatsApp Business API**
- **Reservation Management** — Customers can view, modify, or cancel upcoming reservations through the app
- **Walk-In Queue Integration** — Walk-in customers are added to the queue alongside online reservations in a unified management system

---

### 3.11 Sentiment-Based Feedback

A post-dining feedback system powered by **NLP** that automatically analyzes and categorizes customer sentiment.

#### Features:
- **Text Review Submission** — Customers submit free-text reviews after their dining experience
- **Star/Rating Input** — Quantitative rating alongside qualitative text reviews
- **Automated Sentiment Classification** — NLP pipeline automatically classifies reviews as Positive, Neutral, or Negative without manual reading
- **Per-Item Feedback** — Customers can leave feedback specifically tied to individual dishes, enabling granular performance tracking
- **Negative Experience Alerting** — Threshold-based alert system instantly notifies restaurant management when a highly negative review is submitted, enabling immediate service recovery intervention
- **Anonymous Submission Option** — Customers can optionally submit feedback anonymously

#### Technical Details:
- NLP pipeline built with **spaCy** and/or **TextBlob**
- Sentiment polarity scoring with positive/neutral/negative classification
- Alert thresholds configured at the admin level
- Integrated with the **Executive Dashboard** for aggregated reporting

---

### 3.12 Customer Loyalty Program

A **tier-based loyalty rewards system** that incentivizes repeat visits and higher spending.

#### Features:
- **Points Accumulation** — Customers earn points for every order placed through the platform
- **Three-Tier Progression System:**

  | Tier | Points Range | Benefits |
  |------|-------------|---------|
  | 🥉 Bronze | 0 – 500 points | Basic discount percentage |
  | 🥈 Silver | 500 – 1,500 points | Higher discount + priority seating |
  | 🥇 Gold | 1,500+ points | Maximum discounts + exclusive offers |

- **Loyalty Dashboard** — Customers view their current tier, total points, points history, and available rewards directly in the app
- **Tier-Specific Discounts** — Automatic discount application at checkout based on loyalty tier
- **Points History & Transparency** — Full log of how points were earned and redeemed
- **Tier Upgrade Notifications** — Push notifications celebrate tier upgrades to gamify the experience

---

## 4. Real-Time Kitchen Display System (KDS)

The **Kitchen Display System** is a dedicated interface for kitchen staff that replaces paper tickets with a real-time digital order management board.

### Features:

#### Order Reception & Display
- **Instant Order Transmission** — New orders appear on the KDS screen in real-time via **Socket.io** WebSocket connection, within milliseconds of the customer placing an order
- **Order Queue Board** — All active orders are displayed in a prioritized queue with customer table numbers, items ordered, customizations, and time elapsed since order placement

#### Color-Coded Urgency Indicators
The most critical operational feature of the KDS — visual urgency status based on how long an order has been waiting:

| Color | Time Threshold | Meaning |
|-------|---------------|---------|
| 🟢 Green | > 10 minutes remaining | Order is within normal preparation time |
| 🟡 Yellow | 5–10 minutes remaining | Order requires attention soon |
| 🔴 Red | < 5 minutes elapsed | Order is urgent — immediate action required |

This system enables kitchen staff to visually triage orders at a glance without checking timestamps.

#### Order Status Management
- **Status Progression Tracking** — Kitchen staff update order status through stages: `Received → Preparing → Ready → Served`
- **Status Synced to Customer App** — Order status changes are pushed back to the customer's app in real-time, keeping them informed without needing to ask staff

#### Predictive Demand Analytics
- **ML-Based Demand Forecasting** — Machine learning models analyze historical order data to predict which items will be in high demand during upcoming periods (e.g., next hour, next service)
- **Advance Preparation Alerts** — The system notifies kitchen staff to pre-prepare high-demand items before orders arrive, reducing preparation times by up to 30%
- **Peak Hour Prediction** — Forecasting models identify upcoming peak periods to allow proactive staffing and preparation decisions

#### Inventory & Ingredient Tracking
- **Real-Time Ingredient Consumption Tracking** — Ingredient stock levels decrease automatically as orders are prepared
- **Low-Stock Alerts** — The KDS triggers alerts when ingredient inventory falls below configurable thresholds
- **Out-of-Stock Auto-Updating** — When an ingredient is depleted, the customer-facing menu is automatically updated to mark affected dishes as unavailable

#### Kitchen Performance Metrics
- **Average Preparation Time Tracking** — Real-time monitoring of how long each order takes from receipt to completion
- **Per-Item Preparation Statistics** — Historical data on preparation times per dish type for workflow optimization
- **Staff Performance Indicators** — Throughput metrics for kitchen efficiency analysis

---

## 5. Executive Analytics Dashboard

The **Executive Analytics Dashboard** is a comprehensive business intelligence platform for restaurant owners and managers, providing actionable insights across all operational dimensions.

### Features:

#### Peak Hours Heatmap
- **Visual Traffic Heatmap** — A time-based heatmap visualization showing customer footfall and order volumes across days of the week and hours of the day
- **Seasonal & Trend Analysis** — Identify long-term traffic patterns to inform staffing and promotional decisions
- **Busiest Table Identification** — Determine which tables generate the highest revenue for layout optimization

#### Revenue Analytics
- **Multi-Period Revenue Reporting** — Daily, weekly, and monthly revenue trend comparisons
- **Revenue Breakdown by Category** — Revenue attributed to specific menu categories or individual items
- **Average Order Value Tracking** — Monitor changes in average spend per customer over time
- **Revenue Forecasting** — ML-based prediction of future revenue based on historical trends

#### Sentiment Analysis Reports
- **Aggregated Sentiment Dashboard** — Visual breakdown of customer sentiment over time (positive/neutral/negative percentages)
- **Per-Item Sentiment Scores** — Identify which specific menu items are receiving negative feedback
- **Sentiment Trend Tracking** — Monitor whether customer satisfaction is improving or declining over time
- **Review Volume Monitoring** — Track how many reviews are being submitted and response rates

#### Menu Performance Analytics
- **Item Popularity Rankings** — Top-selling and least-selling dishes ranked by order volume and revenue
- **Underperforming Dish Identification** — Surface menu items with poor sentiment scores or low order frequency for menu optimization
- **Category Performance Comparison** — Compare performance across menu categories to guide menu engineering decisions

#### Ingredient Wastage Reports
- **Wastage Tracking Dashboard** — Monitor which ingredients are being wasted due to overpreparation or spoilage
- **Demand vs. Inventory Comparison** — Compare predicted demand against actual consumption to improve ordering accuracy
- **Cost-of-Waste Metrics** — Quantify the financial impact of ingredient wastage
- **Optimization Recommendations** — Data-driven suggestions for adjusting ingredient procurement quantities

#### Customer Loyalty Metrics
- **Tier Distribution Dashboard** — Visual breakdown of customers across Bronze, Silver, and Gold tiers
- **Loyalty Program ROI** — Track the revenue impact of the loyalty program on repeat visit rates
- **Churn Risk Indicators** — Identify customers who haven't visited in a while and may need re-engagement offers
- **Points Redemption Analytics** — Monitor how frequently and what rewards are being redeemed

#### Order Fulfillment Performance
- **Kitchen Efficiency Metrics** — Average order fulfillment times, delays, and bottlenecks
- **Order Accuracy Rates** — Track order modification and complaint rates
- **Table Turnover Analytics** — Monitor how quickly tables are vacated and re-seated for capacity optimization

---

## 6. Backend Infrastructure & APIs

The backend is a robust, scalable **RESTful API layer** built on Laravel with real-time communication services.

### Core API Features:
- **RESTful API Architecture** — Clean, documented REST endpoints for all system operations, built with **Laravel 10+**
- **Role-Based Access Control (RBAC)** — Customers, kitchen staff, and admins have separate permissions enforced at the API layer via **Laravel Sanctum**
- **API Gateway & Load Balancer** — Request routing and distribution across services for scalability
- **Background Job Queue** — **Laravel Queue** processes non-blocking tasks such as email notifications, report generation, and ML model requests asynchronously

### Real-Time Communication:
- **Socket.io WebSocket Server** — Bidirectional real-time communication channel connecting customers, kitchen, and admin dashboard
- **Laravel Echo Server** — WebSocket server integrated with Laravel Broadcasting for seamless event emission
- **Room-Based Broadcasting** — Table sessions are isolated in separate Socket.io rooms, preventing cross-table data leakage

### Database & Caching:
- **MySQL 8.0+** — Primary relational database with ACID-compliant transactions, normalized schema design, and complex query optimization with comprehensive indexing
- **Redis Cache** — In-memory data structure store for:
  - Session storage and management
  - API response caching to reduce database load
  - Rate limiting for API endpoint protection
  - Real-time order queue management
- **Elasticsearch** — Full-text search engine for fast menu item search and log analysis

### External Integrations:
- **WhatsApp Business API** — OTP delivery for MFA and order/reservation confirmation notifications
- **Firebase Cloud Messaging (FCM)** — Push notification delivery for order updates and waiter assistance alerts
- **JazzCash API** — Pakistani mobile wallet payment processing
- **EasyPaisa API** — Pakistani mobile wallet payment processing
- **International Card Payments** — Credit/debit card gateway integration
- **Cloudinary / AWS S3** — Cloud storage for dish images, 3D models, and user-generated content with CDN distribution
- **QR Code Generator** — Table-specific QR code generation and management system

---

## 7. AI & Machine Learning Features

A dedicated **Python ML microservice** powers the intelligent features of the ecosystem, exposed as REST APIs consumed by the Laravel backend.

### Recommendation Engine (Module 7)
- **Algorithm:** Content-Based Filtering using cosine similarity
- **Feature Vector Components:** Cuisine type, ingredients list, spice level, price range, dietary tags, popularity score
- **Personalization:** Individual preference profiles built from order history
- **Cold-Start Strategy:** Popularity-based fallback for new users
- **Frameworks:** scikit-learn (similarity computation), TensorFlow/PyTorch (deep learning refinement)

### Sentiment Analysis Engine (Module 5)
- **Algorithm:** NLP-based sentiment polarity classification (Positive / Neutral / Negative)
- **Libraries:** spaCy (production-ready NLP pipeline), TextBlob (sentiment scoring)
- **Granularity:** Overall review sentiment + per-dish sentiment tagging
- **Alerting:** Threshold-based negative experience detection triggering real-time management alerts

### Demand Forecasting Engine (Module 3 & 11)
- **Algorithm:** Time-series forecasting using historical order data
- **Features:** Day-of-week patterns, time-of-day patterns, seasonal trends, special events
- **Outputs:** Per-item demand predictions for the next hour/service period
- **Libraries:** Pandas, NumPy for data preprocessing; TensorFlow for forecasting models

### ML Service Deployment
- Python-based ML models are wrapped as **REST APIs using Flask or FastAPI**
- Laravel backend calls these endpoints to fetch recommendations, sentiment scores, and demand forecasts
- Models are retrained periodically on new order data to improve accuracy over time

---

## 8. Security Features

| Feature | Implementation |
|---------|---------------|
| Multi-Factor Authentication | Email/password + WhatsApp OTP |
| Password Hashing | bcrypt via Laravel |
| API Authentication | Laravel Sanctum tokens |
| Session Isolation | Redis-scoped table sessions |
| SQL Injection Prevention | Eloquent ORM parameterized queries |
| Rate Limiting | Redis-based per-IP/user limiting |
| HTTPS Enforcement | Nginx SSL/TLS termination |
| OWASP Compliance | Penetration testing validation |
| Role-Based Access | Customer / Kitchen Staff / Admin RBAC |
| Input Validation | Server-side validation on all API endpoints |

---

## 9. Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 14+ | React framework, SSR, PWA support, routing |
| React 18+ | UI component library |
| TypeScript | Static typing and compile-time error detection |
| Tailwind CSS | Utility-first responsive styling |
| React Query (TanStack) | Data fetching, caching, background refetching |
| Zustand | Lightweight client-side state management |

### Backend
| Technology | Purpose |
|-----------|---------|
| Laravel 10+ | RESTful API, business logic, authentication |
| Laravel Sanctum | API token authentication |
| Laravel Broadcasting | Real-time event broadcasting |
| Laravel Queue | Background job processing |
| Laravel Cashier | Payment gateway management |
| Laravel Telescope | Application monitoring and debugging |
| MySQL 8.0+ | Primary relational database |
| Redis | Caching, sessions, rate limiting |
| Elasticsearch | Full-text search and log analysis |
| Nginx | Web server, reverse proxy, SSL termination |

### Real-Time Communication
| Technology | Purpose |
|-----------|---------|
| Socket.io | Bidirectional WebSocket communication |
| Laravel Echo Server | Laravel Broadcasting WebSocket integration |
| Firebase Cloud Messaging | Push notifications to customer devices |

### AI / Machine Learning
| Technology | Purpose |
|-----------|---------|
| Python 3.10+ | ML model development language |
| TensorFlow / PyTorch | Deep learning for recommendations & forecasting |
| scikit-learn | Content-based filtering, cosine similarity |
| spaCy | Production-grade NLP for sentiment analysis |
| TextBlob | Sentiment polarity scoring |
| Pandas & NumPy | Data preprocessing and feature engineering |
| Flask / FastAPI | ML model REST API deployment |

### Augmented Reality
| Technology | Purpose |
|-----------|---------|
| AR.js / 8th Wall | WebAR framework (browser-based AR) |
| Three.js | 3D rendering engine for web |
| Blender | 3D dish model creation (GLTF/GLB export) |

### DevOps & Third-Party Services
| Technology | Purpose |
|-----------|---------|
| Docker & Docker Compose | Containerization and environment consistency |
| Git & GitHub | Version control and CI/CD pipelines |
| WhatsApp Business API | OTP delivery and order notifications |
| JazzCash API | Pakistani mobile wallet payment |
| EasyPaisa API | Pakistani mobile wallet payment |
| Cloudinary / AWS S3 | Cloud media storage with CDN |
| Jest & PHPUnit | JavaScript and PHP unit testing |
| Postman | API documentation and testing |

### Hardware Requirements
| Component | Specification |
|-----------|-------------|
| Kitchen Display Tablets | 10–15 inch touchscreen, 1920×1080 minimum resolution |
| Customer Devices | Modern smartphones with camera (iOS 12+ / Android 8.0+) |
| Network | Commercial-grade WiFi router (802.11ac or WiFi 6) |
| Optional | NFC-enabled table tags, thermal receipt printers |

---

## 10. Development Phases & Milestones

### Phase 1 — Foundation & Core Infrastructure (Semester 1)

| Module | Feature | Developer |
|--------|---------|-----------|
| Module 1 | Authentication System (MFA + WhatsApp OTP) | Moin Ali Shah |
| Module 2 | Dynamic Table-Session Linker (QR Code) | Hamza Shehzad |
| Module 3 | Real-Time Predictive Kitchen Display System | Hashim Shinwari |
| Module 4 | Digital Waiter Assistance Module | Hashim Shinwari |
| Module 5 | Sentiment-Based Feedback (NLP Pipeline) | Moin Ali Shah |
| Module 6 | Advance Table Reservation & Queue Status | Hamza Shehzad |

### Phase 2 — Advanced Features & AI Integration (Semester 2)

| Module | Feature | Developer |
|--------|---------|-----------|
| Module 7 | Intelligent Menu Recommendation Engine | Moin Ali Shah |
| Module 8 | Smart Split-Bill Payment System | Hamza Shehzad |
| Module 9 | Custom Ingredient Picker | Hashim Shinwari |
| Module 10 | Customer Loyalty/Rewards Program | Moin Ali Shah |
| Module 11 | Executive Analytics Dashboard | Hamza Shehzad |
| Module 12 | AR Visualizer (WebAR + 3D Models) | Hashim Shinwari |

### Milestone Schedule

| Milestone | Target Date | Deliverable |
|-----------|------------|-------------|
| M1 | 1st April 2026 | Functional authentication + QR-based table ordering + basic menu |
| M2 | 1st May 2026 | Real-time KDS with order transmission and urgency indicators |
| M3 | 1st June 2026 | Complete Phase 1: waiter assistance + feedback systems operational |
| M4 | 10th October 2026 | AI-powered recommendations + smart payment system functional |
| M5 | 15th November 2026 | Loyalty program + analytics dashboard deployed |
| M6 | 30th November 2026 | Complete system with AR visualization, testing, and production deployment |

---

### Out of Scope (Explicitly Excluded)

The following features are **not part of this system** in its current version:

- Native iOS/Android mobile applications
- Third-party delivery service integration (Foodpanda, Uber Eats, etc.)
- Multi-restaurant franchise management across distributed locations
- Point-of-Sale hardware integration
- Accounting, payroll, and HR management
- Supplier procurement and vendor management
- Employee time tracking and shift scheduling
- Multi-language support (English only in v1)
- Voice-based ordering via speech recognition
- Cryptocurrency payment processing
- Customer delivery address management and driver tracking

---

*Documentation compiled from: Smart Restaurant Ecosystem Final Year Project Proposal v2.0, SZABIST Islamabad, Spring 2026*
