# Admin Dashboard — Deferred Features & Implementation TODOs

This document tracks **advanced / complex features** intentionally deferred from the MVP admin dashboard. The MVP is a viable, restaurant-scoped management UI for a single restaurant's admins and staff.

**Tenancy rule (permanent):** Each operator is bound to exactly one restaurant via `users.restaurant_id`. There is **no restaurant switcher**. Do not add cross-restaurant browsing for operators.

Mark items `[x]` as you complete them.

---

## Master checklist

### Access & identity
- [ ] Manager role + granular permissions (beyond `admin` / `staff`)
- [ ] Email / WhatsApp staff invite delivery
- [ ] MFA / WhatsApp OTP for staff login
- [ ] Audit log of admin actions
- [ ] SSO / OAuth for staff

### Restaurant settings
- [ ] Logo / media uploads (S3/Cloudinary)
- [ ] Tax rate / service charge configuration UI
- [ ] Holiday / exception hours
- [ ] Notification preference settings
- [ ] Payment gateway credentials UI
- [ ] Branding customization (colors, receipt header)

### Tables & sessions
- [ ] Drag-and-drop floor plan editor
- [ ] Bulk table import / generation
- [ ] NFC table tags
- [ ] Multi-floor / section layout

### Menu & inventory
- [ ] Direct image upload + crop
- [ ] Variants / modifier groups
- [ ] Ingredient recipes + automatic stock deduction
- [ ] Bulk CSV import/export
- [ ] Scheduled menus / dayparts
- [ ] Dynamic pricing
- [ ] Nutritional auto-calculation
- [ ] AR model asset management
- [ ] AI copy / recommendation tuning UI

### Orders & kitchen
- [ ] Order edit after kitchen start
- [ ] Bulk order actions
- [ ] Order CSV / PDF export
- [ ] Long-term archive retrieval UI
- [ ] Authenticated kitchen socket joins + signed webhooks

### Reviews
- [ ] Public response publishing
- [ ] Configurable NLP alert thresholds UI
- [ ] Manual sentiment correction / model feedback
- [ ] Moderation workflow
- [ ] Automated recovery coupons

### Reservations & queue
- [ ] Drag-and-drop reservation calendar
- [ ] Automated table assignment
- [ ] Recurring / VIP reservations
- [ ] Deposits / overbooking rules
- [ ] Waitlist promotion into reservations
- [ ] WhatsApp reservation reminders
- [ ] SMS / WhatsApp queue calling
- [ ] Customer self check-in
- [ ] Advanced wait-time prediction

### Payments & finance
- [ ] Role-gated refunds with audit trail
- [ ] Dispute handling
- [ ] Settlement / reconciliation reports
- [ ] JazzCash / EasyPaisa admin surfaces
- [ ] Receipt re-send
- [ ] Tax invoices
- [ ] Accounting export / integration

### Analytics & loyalty
- [ ] Demand forecasting charts
- [ ] Loyalty admin (tiers, rewards CRUD, accrual wiring)
- [ ] Loyalty ROI / churn risk dashboards
- [ ] Table turnover analytics
- [ ] Staff performance scoring
- [ ] CSV / PDF report exports
- [ ] Custom report builder
- [ ] `analytics_events` ingestion pipeline

### AI / ML controls
- [ ] Recommendation A/B testing
- [ ] Acceptance-rate tracking dashboard
- [ ] Model retrain triggers / controls

### Platform / ops
- [ ] Offline / PWA admin shell
- [ ] Bulk data imports (generic)
- [ ] Feature flags for deferred modules
- [ ] Activity feed (cross-module audit stream)

---

## Detailed implementation guides

### 1. Manager role + granular permissions

**Outcome:** Fine-grained access (e.g. menu editor without team admin; host without KDS).

**Steps:**
1. Extend `users.role` enum or add `permissions` JSON / `role_permissions` table.
2. Add `manager` role mapping in middleware (`EnsureRestaurantRole`) and frontend `AdminSidebar`.
3. Gate each mutation endpoint by permission key (e.g. `menu.write`, `team.write`).
4. Add UI toggles on Team page for permission sets.
5. Tests: matrix of role × endpoint expecting 200/403.

### 2. Staff invite delivery (email / WhatsApp)

**Outcome:** Admins invite staff without sharing temporary passwords in chat.

**Steps:**
1. Schema: `staff_invitations` (token, email, role, restaurant_id, expires_at).
2. `POST /admin/team/invites` creates invite + queues mail / WhatsApp template.
3. Public accept route sets password and activates user bound to restaurant.
4. UI: Invite dialog + pending invites list.
5. Secrets: WhatsApp Business API + mail config. Never log tokens.

### 3. Media uploads (restaurant logo, menu images)

**Outcome:** Upload images instead of pasting URLs.

**Steps:**
1. Configure S3/Cloudinary disk (already used for QR SVGs).
2. `POST /admin/media` multipart → return CDN URL.
3. Wire Restaurant + Menu forms to upload component with crop (`react-easy-crop` or similar).
4. Validate MIME/size; strip EXIF; generate thumbnails.
5. Tests: upload, reject oversized/non-image.

### 4. Floor plan editor

**Outcome:** Visual table layout for hosts.

**Steps:**
1. Schema: `tables.pos_x`, `pos_y`, `rotation`, `section_id`.
2. Canvas UI (Konva/Fabric) saving positions via batch PATCH.
3. Live status colors from sessions/reservations.
4. Mobile: read-only map; edit on desktop only initially.

### 5. Menu modifiers / inventory recipes

**Outcome:** Customizations with stock checks and dynamic pricing.

**Steps:**
1. Tables: `modifier_groups`, `modifiers`, `menu_item_ingredients` (qty per item).
2. Admin UI for groups + stock linkage.
3. Order placement validates stock; KDS shows customizations (already partially there).
4. Deduct stock on confirm; restore on cancel.

### 6. Authenticated sockets & webhooks

**Outcome:** Kitchen joins and status webhooks cannot be spoofed.

**Steps:**
1. Issue short-lived kitchen socket token from Laravel (`POST /admin/socket-token`).
2. Validate token on `kitchen:join` in socket-server.
3. Sign webhooks with HMAC shared secret; verify in Laravel webhook controllers.
4. Rotate secret via env; reject unsigned requests.

### 8. Review moderation & public replies

**Outcome:** Publish admin responses and tune NLP thresholds.

**Steps:**
1. Fields: `is_public_response`, `moderation_status`.
2. Settings UI for flag thresholds (currently hard-coded in ML path).
3. Customer menu shows published responses.
4. Feedback loop endpoint to correct sentiment labels for retraining.

### 9. Reservation calendar + WhatsApp reminders

**Outcome:** Calendar scheduling and automated guest messaging.

**Steps:**
1. FullCalendar (or similar) on `/admin/reservations` with drag to change time/table.
2. Conflict detection against table capacity + existing bookings.
3. Queue WhatsApp templates for confirm / reminder / no-show.
4. Feature-flag WhatsApp until Business API approved.

### 10. Payment refunds & reconciliation

**Outcome:** Safe staff refunds and settlement reports.

**Steps:**
1. Gate `POST /payments/{id}/refund` with `restaurant.role:admin` + audit row.
2. Call Safepay refund API; handle partial refunds.
3. Daily settlement report: completed vs pending vs refunded by method.
4. Export CSV for accounting.

### 11. Advanced analytics & exports

**Outcome:** Forecasting, loyalty ROI, CSV/PDF exports.

**Steps:**
1. Wire writes into `analytics_events` from order/payment/session lifecycle.
2. Consume ML demand forecast endpoint; chart on Analytics page.
3. Loyalty metrics once accrual is wired in `PaymentCompletionService`.
4. Export endpoints stream CSV; PDF via DomPDF/Browsershot.

### 12. Loyalty administration

**Outcome:** Manage tiers/rewards and ensure points accrue.

**Steps:**
1. Accrue points in `PaymentCompletionService` on completed payments.
2. Admin CRUD for `loyalty_rewards`; member lookup by phone/email.
3. Manual adjust points with reason (audit).
4. Dashboard cards: tier distribution, redemption rate.

### 13. AI recommendation controls

**Outcome:** Operators see acceptance rates and can pause experiments.

**Steps:**
1. Log impression/accept events for recommendations.
2. Admin panel: enable/disable, A/B variant weights.
3. Alert when acceptance < 65% (per SDD) to trigger retrain job.

### 14. Activity feed / audit log

**Outcome:** “Who changed what” across the dashboard.

**Steps:**
1. Table `admin_audit_logs` (actor_id, restaurant_id, action, subject_type, subject_id, meta JSON).
2. Middleware or model observers write entries on mutations.
3. Dashboard home “Recent activity” consumes paginated feed.
4. Retention policy (e.g. 90 days).

### 15. Offline / PWA admin

**Outcome:** Host stand / KDS survive brief connectivity loss.

**Steps:**
1. Service worker caching shell + last REST snapshot.
2. Queue mutations offline; replay on reconnect with conflict UI.
3. Clear “offline” badge in AdminShell header.

---

## Intentionally out of scope for restaurant operators

Do **not** implement these as restaurant-dashboard features:

- Platform super-admin console spanning all restaurants
- Restaurant switcher / multi-tenant browsing for a single operator login
- Franchise HQ rollup (unless a separate product surface is designed later)
- Native iOS/Android staff apps (PWA first)
- Third-party delivery fleet / driver tracking
- Payroll / HR / supplier procurement

---

## MVP already shipped (reference)

Use this list when deciding what **not** to rebuild:

- [x] Single-restaurant tenancy (`users.restaurant_id`, no switcher)
- [x] Role middleware (`restaurant.role:admin,staff` / `admin`)
- [x] Admin shell + sidebar + mobile Sheet
- [x] `/admin/login` → `/admin`
- [x] Overview stats + attention cards
- [x] Analytics (revenue, peak hours, popular items, sentiment, low-stock)
- [x] Restaurant details edit
- [x] Team CRUD + last-admin protection
- [x] Tables + QR regenerate / session end
- [x] Menu categories + items CRUD + availability toggle
- [x] Orders history + detail + cancel
- [x] Waiter requests current/history
- [x] Reviews list + respond + dismiss flag
- [x] Reservations list + status
- [x] Walk-in queue (shell + realtime)
- [x] Payments ledger + pending cash
- [x] KDS preserved (dark ops surface)
- [x] Socket kitchen refcount (`leaveKitchen`) + cancel broadcast + scoped cash-payment completed
