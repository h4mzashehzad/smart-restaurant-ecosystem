# Homepage, restaurant partnership, and owner onboarding plan

Prepared: 25 October 2026. Status: implemented; validation and delivery notes are recorded below.

## 1. Agreed product decisions

- Keep **Table.com.pk**, the orange-and-white identity, and the existing Outfit / Plus Jakarta Sans typography.
- Give restaurant owners dashboard access immediately after successful email verification.
- Do not display prices, subscription plans, free-trial promises, or commercial terms while pricing is undecided.
- Use the 14 supplied screenshots in `frontend/public/photos/` as the primary product imagery.
- Preserve the existing customer registration and QR dining flows, while creating a distinct restaurant-owner journey.
- Keep the existing single-restaurant account model: each administrator or staff member belongs to one restaurant.

## 2. Review findings and implementation implications

The review covered the Next.js application routes and shared providers, Laravel routes/controllers/models/migrations, admin navigation and layouts, relevant tests, Socket.IO integration, ML recommendation/forecast entry points, project documentation, design guidance, and all 14 supplied screenshots. The current homepage was also opened and inspected in the local browser. This was a source and visual review, not an end-to-end test of every existing module.

| Finding | Evidence | Required response |
| --- | --- | --- |
| All partnership CTAs open customer registration. | `frontend/src/app/page.tsx` links to `/register`. | Introduce `/partners` and `/partners/register`; route acquisition CTAs through `/partners`. |
| Registration only creates customers. | `AuthController::verifyOTP()` hardcodes `role = customer` and creates no restaurant. | Add a dedicated verified restaurant-registration service that creates and links the restaurant and its administrator. |
| Customer registration normally sends users to `/menu`. | `(auth)/register/page.tsx` defaults to `/menu`. | Give owners a separate completion destination, `/admin`. |
| “Restaurant Login” opens customer login. | Homepage navigation links to `/login`. | Link restaurant sign-in to `/admin/login`. |
| Several homepage links are incomplete. | `/scan` has no page; the implemented route is `/scan/[token]`. `/contact`, `#pricing`, and `#how-it-works` are not implemented by the current homepage. Footer policy links point to `#`. | Replace these with real sections/routes. Use a screenshot walkthrough for public exploration instead of creating a live dining session. Omit policy/contact links until real destinations/content exist. |
| Homepage copy includes unsupported claims. | “#1”, “increase … sales by 45%”, universal AR support, and automatic ingredient-consumption claims. | Replace with concrete descriptions supported by current code. Do not turn proposal metrics into proven results. |
| Product documentation and deferred-feature checklists lag implementation. | Forecast charts, loyalty insights, menu image uploads, and reservation preorders exist in code despite some older checklist entries. | Treat current routes, components, services, and tests as the source of truth. |
| New restaurants expose a menu-scoping problem. | `MenuContainer` defaults to restaurant ID 1. Recommendation and search queries do not currently require a restaurant. | Resolve the menu restaurant from the current session or explicit restaurant context; scope recommendations/search and test a second restaurant. |
| Admin, kitchen, and queue screens do not share one shell. | Dashboard pages use `(dashboard)/layout.tsx`; KDS and queue sit outside it. | Put tour state and its card at the common admin boundary so it survives those route changes. |
| Dashboard onboarding has no saved progress. | No existing tour provider or onboarding API. | Persist versioned progress for the authenticated user and their restaurant. |
| Dashboard summary uses USD while analytics uses PKR. | `DashboardContainer` formats USD; analytics formats PKR. | Align the owner’s first dashboard view with PKR. |

Existing design findings: Next.js 16.1.6, React 19, Tailwind v4, Laravel 12, Sanctum authentication, TanStack Query, an orange primary token, and CSS animations without a dedicated motion library. Preserve this stack and reuse existing UI components. `docs/DESIGN.md` matches the current fonts and palette; the older generated master design file differs, so the active implementation and agreed brand take precedence.

## 3. Homepage redesign

Use a clean, product-led hospitality design: strong headings, generous whitespace, orange for primary actions, and actual screens presented as readable figures with captions. Screenshots supply the visual interest. Avoid invented device frames, decorative dashboards, generic AI illustrations, and repetitive feature-card grids.

Suggested lead message: **“From the first table booking to the last split bill.”** Supporting copy explains that Table.com.pk connects guest ordering, kitchen service, payments, and restaurant management in one web-based system.

The homepage will contain:

1. **Navigation:** product/features, how it works, restaurant sign-in, and Partner with us. Build an accessible mobile menu with proper labels, keyboard operation, focus handling, and Escape dismissal.
2. **Product introduction:** a concise description and a composed view of real guest and analytics screens. Primary action: Partner with us → `/partners`. Secondary action: See how it works → an actual section on this page.
3. **A connected dining journey:** reserve a table, scan and join, browse/customize, pay together or separately, and receive service. Explain the connection between these steps instead of listing technical buzzwords.
4. **Inside the kitchen:** show the real KDS board and explain order status, customization notes, waiter requests, and cash-payment handling.
5. **For the owner:** show real peak-hour and demand-forecast screens; describe revenue, menu performance, feedback, loyalty, and fulfillment visibility.
6. **A clear next step:** explain that owners can register their restaurant and start setup after verification. Link to the partnership page.
7. **Useful footer:** brand and working navigation only. No fabricated addresses, sales contacts, customer logos, testimonials, legal text, or statistics.

The homepage gives a concise overview; the partnership page provides the complete feature catalogue. They share a visual language without repeating all content.

## 4. Partnership page: `/partners`

Create a dedicated restaurant-facing page that explains the operational value and shows what is included. Use a compact section index and screenshot-backed feature sections. All “Register your restaurant” actions on this page open `/partners/register`.

| Feature group | Capabilities to explain | Supplied screenshots |
| --- | --- | --- |
| Guest arrival | Online table availability, reservations, reservation food preorders, and walk-in queue management | `table-reservation.png` |
| QR dining | Table-specific QR entry, guest access, shared sessions, menu browsing, and recommendations | `table-session.PNG`, `menu-recommendations.PNG` |
| Dish selection | Ingredients, removable/adjustable extras, price changes, dietary information, and 3D/AR previews for dishes with models | `ingredient-picker.PNG`, `ar-dish-preview.PNG` |
| Service and kitchen | Kitchen tickets, order progress, customization notes, prioritized assistance requests, and reservation-preorder release | `kds-board.png`, `waiter-assistance.PNG` |
| Checkout | Full payment, equal split, item claims, cash confirmation, Safepay card checkout, live participant payment progress, and receipts | `payment-options.PNG`, `payment-item-claims.PNG`, `payment-tracker.PNG` |
| Customer relationships | Overall and dish feedback, sentiment flags, loyalty points, tiers, and customer history | `customer-feedback.PNG`, `loyalty-dashboard.PNG` |
| Owner management | Restaurant details, hours, staff/admin accounts, categories, menu items, ingredients, availability, tables, and downloadable QR codes | Supporting copy and actual destination descriptions |
| Business visibility | Revenue, popular items, peak hours, table turnover, fulfillment, sentiment, loyalty insights, low-stock visibility, and demand forecasts | `analytics-heatmap.png`, `analytics-forecast.png` |

Add a short FAQ covering browser access, setup requirements, staff access, AR model/device requirements, and forecast history requirements. Explain cash and Safepay as currently implemented; do not advertise unsupported payment integrations. Describe ingredient stock visibility accurately without promising automatic recipe-based stock deduction. Do not promise custom loyalty-program configuration or automated staff invitations where these are not implemented.

Screenshots will be labelled as product examples rather than live operational data or customer endorsements. Preserve original assets and case-sensitive filenames, set intrinsic dimensions and responsive sizes, and lazy-load images below the fold. Portrait screens must remain readable; allow an accessible expanded preview where useful. The KDS capture contains overdue demo tickets, so its caption must identify it as an example rather than imply a live service-performance result.

## 5. Restaurant registration: `/partners/register`

Build a focused four-step wizard with visible progress, Back/Continue controls, field-level validation, and an editable review. Keep required fields limited to what is needed to establish the owner and restaurant.

| Step | Information / behavior |
| --- | --- |
| 1. Owner account | Full name, email, phone, password, confirmation, and show/hide password. Offer an existing-account sign-in path. |
| 2. Restaurant | Restaurant name, address, public phone/email, and a readable unique restaurant URL identifier. Offer “use my contact details” to reduce repeated entry. |
| 3. Hours and review | Opening/closing times, timezone defaulting to Asia/Karachi, editable summary, and clear explanation of what verification will create. Hours may be completed later; do not promise reservations are ready before required setup exists. |
| 4. Verify email | Six-digit email code, correct-email/back action, resend cooldown, expiry feedback, and a clear Verify and create restaurant action. |

After verification, create the restaurant and active administrator together, establish the normal authenticated session, and replace the wizard route with `/admin`. Email verification is the authentication step, avoiding another password form immediately afterwards. Future sign-ins use `/admin/login` and return to the dashboard.

Keep non-secret wizard inputs available when navigating Back/Continue. A session-scoped draft can restore unfinished details on refresh; passwords and verification codes must never be written to browser draft storage. A refreshed page can resume a still-valid verification challenge without recovering a password from the browser.

Account edge cases:

- An email or phone already in use produces an actionable message instead of a generic server error.
- An existing customer must sign in and explicitly choose to create a restaurant; verification and account binding happen through an authenticated flow. Preserve their account history. Never promote an account based only on a matching email.
- An existing restaurant admin or staff member is directed to their current restaurant. Do not silently reassign them or add a restaurant switcher.
- Interrupted verification, resend, double clicks, duplicate requests, slug collisions, and response/network failures cannot create orphan or duplicate restaurants.
- Existing dining registration retains its customer role and intended QR/menu return destination.

## 6. Backend implementation

Add a dedicated restaurant-registration controller, Form Requests, and service rather than accepting arbitrary roles on the customer endpoint.

Proposed API responsibilities:

- Start a new-owner verification challenge with validated owner and restaurant details.
- Start an authenticated existing-customer onboarding challenge through a protected endpoint.
- Verify and consume the correct challenge; resend its email code with a cooldown.
- Read and update the authenticated administrator’s onboarding/tour state.

Implementation requirements:

- Normalize identifiers, validate unique email/phone/slug values, and enforce database uniqueness again during final creation.
- Store a purpose-bound, short-lived pending payload with an opaque challenge identifier, hashed password, hashed verification code, expiry, and attempt limits. Keep partner and customer OTP purposes separate.
- Invalidate old codes on resend; cap resend/verification attempts and rate-limit public registration routes.
- Reuse the existing mail infrastructure with restaurant-specific wording. Handle delivery failure visibly without creating an account or exposing codes in logs.
- Use a transaction for restaurant creation, user creation or verified account transition, restaurant binding, verified timestamp, and initial onboarding state. Use locking/one-time consumption to prevent concurrent completion.
- The server sets the role and restaurant association. Never trust submitted role, existing restaurant ID, active flags, or onboarding ownership.
- Return the existing Sanctum response shape with the linked restaurant. Refresh auth state and clear identity-dependent frontend query caches when accounts change.
- Reuse existing admin access rules; check inactive/unbound operators before routing them into an unusable dashboard.
- Use additive schema changes for persisted tour progress; existing restaurants and users retain their data and do not receive a forced first-login tour.
- Default new restaurants to active, per the agreed immediate-access decision. Show readiness guidance for unfinished menu/table/hours setup without introducing a separate approval gate.

## 7. Dashboard welcome card, tour, and setup checklist

On the newly registered owner’s first dashboard visit, display a concise welcome card with **Take a quick tour** and **Set up my restaurant**. Automatically present the first tour card, with an easy Skip for now option.

The tour is a small, interactive card with a title, short explanation, step counter, Back, Next, Skip, and Finish. It navigates to and highlights actual dashboard areas. It must not create orders, edit settings, or submit forms on the user’s behalf.

Proposed coverage:

1. Dashboard: daily figures, attention items, and quick actions.
2. Restaurant details: address, contact information, hours, and reservation link.
3. Menu: dishes, categories, ingredients, customization, availability, images, and AR model links.
4. Tables: capacity, QR codes, table status, and sessions.
5. Team: administrator/staff accounts and permissions.
6. Orders: order history, details, and status visibility.
7. Kitchen: real-time tickets, preparation/service progress, notes, and operational alerts.
8. Reservations: bookings, preorders, and arrival management.
9. Queue: waiting, calling, and seating walk-ins.
10. Waiter requests and payments: service handling, payment ledger, and pending cash confirmation, with direct links to both areas.
11. Reviews and loyalty: feedback/sentiment, member tiers, points, and history, with links to both areas.
12. Analytics: revenue, peak hours, menu, sentiment, loyalty, fulfillment, turnover, and forecasts; finish by returning to the dashboard’s setup checklist.

Group related features to keep the tour brief. All navigation items must be represented even when several belong to one card. Use the existing nav configuration as the coverage reference so the tour and navigation do not drift apart.

Persist current step, tour version, completion/dismissal state, and timestamps on the server per user/restaurant. Continue after refresh or later login, avoid repeatedly opening a skipped tour, and provide **Restart tour** in the admin menu. Existing admins can launch it voluntarily. Staff should only see permitted features if they manually launch the tour.

Mount the provider/controller at the common admin layout and suppress it on the login page. Give KDS and queue stable tour targets and replay access without replacing their layouts. Handle route loading, missing targets, errors, mobile navigation, and manual route changes without trapping the user. Use visible keyboard focus, announced step changes, reduced-motion support, and a mobile card position that does not cover the highlighted action.

Add a separate setup checklist driven by real saved restaurant data: complete profile/hours, create a category and first dish, add a table and obtain its QR, and optionally add staff. Completing the tour must not mark those tasks complete. Brand-new dashboards show honest zero/empty states and explain that analytics/forecasts populate as orders accumulate.

## 8. Required fixes for a second restaurant

These are directly related to making public restaurant onboarding usable:

- Resolve the guest menu from its scanned table/session, or an explicit restaurant context for menu previews, rather than always loading restaurant 1.
- Carry that context through relevant menu/return navigation; a bare menu without context must not silently select someone else’s restaurant.
- Scope recommendation/popularity/search results to the selected restaurant, including cached ML suggestions. The ML generator may remain global internally only if results are filtered to the selected restaurant before display.
- Prevent stale cart contents from another restaurant from carrying into the new context; preserve the separate reservation cart behavior.
- Scope/clear admin query caches when the authenticated restaurant changes so an owner never sees a previous account’s cached data.
- Verify that a new owner sees only their restaurant’s empty menu, tables, orders, payments, reservations, staff, and analytics.
- Keep the payment gateway’s existing platform configuration outside signup. Do not collect gateway secrets or promise separate merchant settlement in this work.

## 9. Planned file scope

All paths below are repository-relative. New helper files can be consolidated when existing patterns make that cleaner. No production-file deletion, route-tree replacement, or new dependency is planned.

**Existing frontend files to modify:**

- `frontend/src/app/page.tsx`
- `frontend/src/app/layout.tsx` — meaningful site metadata while preserving providers/fonts.
- `frontend/src/app/globals.css` — additive, scoped marketing/tour tokens and accessibility rules; preserve Tailwind imports and current app styling.
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/login/page.tsx`
- `frontend/src/app/admin/(dashboard)/layout.tsx`
- `frontend/src/app/admin/(dashboard)/DashboardContainer.tsx`
- `frontend/src/components/admin/AdminShell.tsx`
- `frontend/src/components/admin/AdminSidebar.tsx`
- `frontend/src/components/admin/nav-config.ts`
- `frontend/src/app/admin/kds/KDSContainer.tsx`
- `frontend/src/app/admin/queue/QueueContainer.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/admin-api.ts`
- `frontend/src/types/admin.ts`
- `frontend/src/app/menu/page.tsx`
- `frontend/src/app/menu/MenuContainer.tsx`
- `frontend/src/contexts/CartContext.tsx`
- `frontend/src/contexts/SessionContext.tsx` and `frontend/src/contexts/PaymentContext.tsx` only where restaurant context/return navigation requires changes.
- `frontend/src/app/scan/[token]/page.tsx` only if menu context must be carried in its navigation.
- `frontend/src/app/(auth)/login/page.tsx` and `frontend/src/app/(auth)/register/page.tsx` only for safe local return destinations and clear restaurant-owner entry links; retain customer registration behavior.

**Proposed new frontend files:**

- `frontend/src/app/partners/page.tsx`
- `frontend/src/app/partners/register/page.tsx`
- `frontend/src/components/marketing/MarketingHeader.tsx`
- `frontend/src/components/marketing/MarketingFooter.tsx`
- `frontend/src/components/marketing/ProductScreenshot.tsx`
- `frontend/src/components/marketing/FeatureShowcase.tsx`
- `frontend/src/components/partners/RestaurantRegistrationWizard.tsx`
- `frontend/src/components/admin/onboarding/AdminOnboardingProvider.tsx`
- `frontend/src/components/admin/onboarding/AdminTourCard.tsx`
- `frontend/src/components/admin/onboarding/RestaurantSetupChecklist.tsx`
- `frontend/src/components/admin/onboarding/tour-steps.ts`
- `frontend/src/lib/restaurant-registration.ts`
- `frontend/src/lib/marketing-content.ts`
- `frontend/src/lib/safe-redirect.ts`
- `frontend/src/types/onboarding.ts`
- `frontend/src/styles/marketing.css` and `frontend/src/styles/marketing-tokens.css` for scoped public-page styles.
- `frontend/src/app/partners/register/error.tsx` if the route introduces server data fetching; use existing form-level pending/error states for client submissions.

**Existing backend files to modify:**

- `backend/routes/api.php`
- `backend/app/Models/User.php`
- `backend/app/Http/Controllers/Api/AuthController.php` — return onboarding state consistently and handle operator eligibility where appropriate, while preserving customer OTP semantics.
- `backend/app/Http/Controllers/Api/MenuController.php` — restaurant-scoped recommendations/search.

**Proposed new backend files:**

- `backend/app/Http/Controllers/Api/RestaurantRegistrationController.php`
- `backend/app/Http/Controllers/Api/AdminOnboardingController.php`
- `backend/app/Http/Requests/RestaurantRegistrationRequest.php`
- `backend/app/Http/Requests/ExistingAccountRestaurantRegistrationRequest.php`
- `backend/app/Http/Requests/VerifyRestaurantRegistrationRequest.php`
- `backend/app/Http/Requests/ResendRestaurantRegistrationRequest.php`
- `backend/app/Http/Requests/Admin/UpdateOnboardingRequest.php`
- `backend/app/Services/RestaurantRegistrationService.php`
- `backend/app/Mail/RestaurantRegistrationOTP.php`
- `backend/resources/views/emails/restaurant-registration-otp.blade.php`
- An additive migration named `add_admin_onboarding_to_users_table`.
- `backend/tests/Feature/RestaurantRegistrationTest.php`
- `backend/tests/Feature/AdminOnboardingTest.php`
- `backend/tests/Feature/RestaurantMenuScopeTest.php`

Update Hallmark’s preflight/design log during implementation. Use a scoped marketing token file rather than changing the existing root developer-console tokens. Refresh the code knowledge graph after application changes. Keep original screenshots unchanged.

## 10. Implementation order and verification

1. **Public experience:** implement shared marketing structure, real product copy, homepage, partnership page, image handling, and correct navigation. Review at desktop and mobile widths.
2. **Registration contract:** implement pending verification, validation, atomic restaurant/account creation, existing-account handling, rate limits, and API tests.
3. **Wizard and login handoff:** connect forms to the API, handle resend/retry/back/refresh, populate auth state, and land in the correct dashboard.
4. **Tour and first-use setup:** add persisted route-aware cards, highlights, replay, honest empty states, and checklist actions.
5. **Restaurant context:** fix menu/recommendation/cart/cache boundaries and verify the new restaurant’s guest experience with its own table QR.
6. **Final review:** lint/type-check, production build, relevant backend tests and formatter, browser walkthrough, and regression checks.

Backend tests must cover successful verified signup, invalid/expired/replayed codes, resend invalidation/cooldown, attempt limits, uniqueness and slug conflicts, atomic rollback, duplicate submission, existing-customer authentication, rejection of restaurant reassignment/role tampering, verified timestamps, correct restaurant binding, tour persistence/authorization, and isolation of restaurant menus/recommendations/search.

Browser checks must cover the full CTA → partnership → registration → verification → dashboard path, subsequent login, wizard back/edit and validation, tour Next/Back/Skip/Finish/restart, refresh/resume, standalone KDS/queue navigation, restricted staff access, and the first actual category/dish/table setup. Use a controlled test mailbox/account for verification rather than sending unsolicited messages to real users.

Check public pages and wizard at 320, 375, 414, 768, and desktop widths, including keyboard navigation, image readability, contrast, focus, reduced motion, loading failures, and horizontal overflow. Run the existing payment, reservation-preorder, loyalty, service-request, analytics, and ingredient-customization tests where affected. Verify environment limitations explicitly rather than claiming checks passed when services are unavailable.

## 11. Acceptance criteria

- The homepage explains the actual product and uses supplied screenshots instead of the generated hero/AR/dashboard images.
- Every partnership CTA opens the partnership page; its registration actions open the owner wizard.
- The partnership page represents all implemented restaurant-facing modules with accurate limitations.
- A verified owner receives one linked restaurant, an active admin account, and an authenticated dashboard session.
- An existing customer cannot be promoted without authentication and explicit verified onboarding; an existing operator cannot be reassigned through public signup.
- Existing customer signup and QR return behavior continue to work.
- New restaurants see their own empty state and have clear actions to add their first menu item and table.
- The dashboard tour explains every navigation area, supports Next/Back/Skip/restart, and remembers progress across supported routes and logins.
- The setup checklist reflects saved data independently of tour completion.
- Pages work on mobile and with keyboard navigation, and the relevant build/tests pass or have clearly documented environmental blockers.

## 12. Implementation and added demo restaurants

Implemented the homepage, partnership page, verified owner signup, persisted dashboard tour, and data-driven setup checklist. The tour has 16 short steps rather than 12 grouped cards so every navigation destination is visited directly.

The registration service uses encrypted pending details, hashed verification codes, expiry/attempt/resend limits, and transactional restaurant/admin creation. Existing customer onboarding requires authenticated access and verification. Customer signup retains its original role and flow.

Restaurant boundaries were tightened for menu recommendations/search, cart storage, admin query caches, legacy menu updates, operational webhooks, queue actions, cash confirmation and restaurant-specific loyalty transaction reporting. Live kitchen memberships are cleared when identity changes. Kitchen/queue initial data can load from the database when temporary live caches are empty.

Added AdditionalRestaurantsSeeder, with production protection and repeatable, restaurant-specific demo identities and cleanup. Darbar is preserved. New demos copy reduced/shuffled subsets of Darbar’s existing menu records, image URLs, model URLs, categories and ingredient/customization relationships:

| Restaurant | Menu items | Tables |
| --- | ---: | ---: |
| Mehfil Kitchen | 18 | 6 |
| Juniper Table | 14 | 5 |
| Zaiqa House | 24 | 8 |
| Saffron Courtyard | 20 | 7 |

Each receives its own admin/staff accounts, customers, approximately 60 days of orders/payments/feedback/loyalty activity, reservations, queue entries, assistance requests, demand forecast examples, and current kitchen/cash-payment examples. Demo forecast values are synthetic, derived from seeded order history; they are not a claim of model accuracy.

Table QR previews/downloads have a local generation fallback when a stored cloud image is unavailable. Existing assets and environment configuration are preserved.

### Final validation

- Backend suite: 113 tests passed, 977 assertions, including existing payment, preorder, loyalty, service and analytics coverage plus the new registration, onboarding, seeder and isolation cases.
- Socket server: all 5 existing contract tests passed.
- Frontend: TypeScript and production build passed. Full lint remains at the original baseline of 126 errors and 8 warnings; comparison by file/rule found no additional errors.
- Browser: reviewed public pages and registration layouts at mobile/tablet/desktop widths; exercised wizard validation/back/review, image expansion, all 16 tour steps, Next/Back, refresh/resume and completion, live kitchen/queue data, and logout/login between two demo restaurants.
- Email verification, account creation and authentication handoff were tested through the API with simulated mail. Actual outgoing email delivery was not sent during browser review and depends on the existing mail configuration.
- Applied the onboarding migration and seeded the four additional restaurants in the local database. Darbar's existing menu, analytics and admin credentials were preserved.
