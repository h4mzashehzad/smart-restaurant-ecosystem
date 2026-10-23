# Reservation preorders implementation plan

Status: implemented locally with automated verification. The local database migration has been applied. A real Safepay sandbox card charge and subsequent partial refund remain a merchant integration check; automated gateway tests use mocked HTTP responses.

Implementation notes:

- Reservation entry reuses `MenuContainer`, `ProductCard`, `ItemDetailDrawer`, `CartDrawer`, and the cart controls through an isolated reservation provider. Normal session checkout remains the default.
- Guest management uses a high-entropy HMAC token bound to the booking and application key; raw tokens are excluded from staff/socket serialization.
- `reservations:process-preorders` is registered every minute. Deployment must keep Laravel's scheduler and a queue worker running, and restart the socket service with the matching frontend changes.
- Set `RESERVATION_FRONTEND_URL` to one canonical frontend origin for emails and Safepay returns. It defaults to the first configured frontend origin.
- Refund timeouts are recorded for reconciliation rather than automatically resubmitting an uncertain financial request. Staff can verify/retry definitively rejected requests in Reservations.
- Verification: 89 backend tests (407 assertions), 5 socket tests, frontend type check and production build passed. The customer journey was checked in the local browser through card checkout, without submitting a payment. Existing menu/cart/socket lint violations remain unchanged; the new screens pass targeted lint checks.

## Confirmed product decisions

- Preordering is optional. Customers may continue to reserve only a table.
- Reuse the current menu, item details and customization, cart, payment, and checkout design.
- Reservation preorders require full advance payment by card. Remove cash only from this checkout context; existing dine-in and walk-in cash, card, and split-payment behavior remains available.
- Successful, verified payment automatically confirms the reservation after a final availability check.
- Release a paid preorder to the active kitchen queue at:
  `arrival time - max(30 minutes, longest purchased item preparation time + 10 minutes)`.
- Customer cancellation cancels the table reservation and preorder together. It is allowed at or before the instant two hours before arrival, and returns 95% of the amount paid. The remaining 5% is the cancellation fee.
- Include a cancellation link and restaurant contact information in the reservation email. Explain that customers may contact the restaurant to request cancellation too.

## Current flow and integration points

1. `frontend/src/app/[slug]/reserve/ReservationContainer.tsx` currently collects date/party size, a 30-minute time slot, a selected table, and guest details, then submits a booking. It does not load a menu, collect food choices, or take payment.
2. `backend/app/Http/Controllers/Api/ReservationController.php` checks table ownership and reservations in a one-hour window on either side of the requested time. It creates a `pending` booking, broadcasts `ReservationUpdated`, and sends `ReservationConfirmed` immediately if an email was supplied. The email currently says confirmed even though staff approval is pending.
3. Reservations have no relationship to orders or payments. Orders and payments already allow a null table session, so advance purchases do not require occupying a table or creating a live dining session.
4. Existing checkout in `PaymentController` requires a live table session. `PaymentCompletionService` confirms and broadcasts paid orders immediately, updates session accounting, and awards loyalty points.
5. `SafepayService` supports checkout and payment verification. `PaymentController::refund` currently changes a local status only; it does not send money back through Safepay.
6. `CartContext`, `CartDrawer`, `PaymentDrawer`, and the payment callback are coupled to live table sessions. `ItemDetailDrawer` writes directly to the current cart. Reusing their design requires explicit checkout context and cart isolation.
7. KDS reads active orders from both the database and Redis. Redis also stores today's reservations, but a booking created days earlier is not reliably promoted into that set on arrival day. Kitchen timing currently derives from purchase time, which would make an advance order look overdue.
8. Admin reservations show booking information and status actions, without items, payments, or refund details. Only demand forecasting currently has a scheduled command in `backend/routes/console.php`.
9. The application timezone is currently UTC. Reservation date/time inputs have no restaurant timezone attached.

## Proposed customer flow

1. Keep the current date, party-size, time-slot, and table selection.
2. Offer **Reserve table only** or **Add food preorder**. Selecting preorder opens the restaurant's full published, available menu using the existing menu design, item details, ingredient customization, and cart design.
3. Show a persistent reservation summary while browsing: restaurant, local arrival date/time, selected table, and party size. Fetch the menu by the selected restaurant ID; the current main menu contains a hardcoded restaurant ID that must not be copied into this flow.
4. Keep the reservation cart in separate state and storage keyed by restaurant and reservation draft. It must never merge into, clear, or broadcast to an existing dining session's cart.
5. Collect guest details before payment. Require email for a paid preorder so the customer receives confirmation, receipt, and management/cancellation access. Keep the existing table-only email requirement unchanged.
6. Present the same checkout visual design with full card payment only. Show quantities, customizations, notes, subtotal, applicable existing discounts/tax, and final total.
7. Before payment, explicitly disclose: card payment; cancellation deadline in the restaurant's local time; 5% cancellation fee; and a 95% refund for an eligible cancellation. Example: a PKR 10,000 payment produces a PKR 500 fee and PKR 9,500 refund.
8. Reserve a short, expiring table hold while checkout is in progress. Default hold duration: 10 minutes, consistent with the current payment timeout. Failed or abandoned checkout must not create a confirmed reservation or an indefinite table block.
9. Verify payment on the server. Confirm the booking, show its preorder and receipt, and send the confirmation email once. Returning from Safepay must return to this reservation, not `/menu`, and must not clear the dine-in cart.
10. Table-only bookings keep their existing staff approval lifecycle. Correct email wording to reflect pending versus confirmed status.

## Data and state changes

Use additive migrations. Existing bookings, orders, and payments must continue to work with null/default values for the new fields.

| Area | Planned additions |
| --- | --- |
| Restaurant | Explicit IANA timezone, initially `Asia/Karachi` for the current restaurant; use this for reservation interpretation without changing all existing application timestamps. |
| Reservation | Absolute UTC arrival and cancellation deadline, checkout hold expiry/state, secure signed management access, policy snapshot, cancellation actor/reason. Keep current date/time fields for compatibility. |
| Order | Nullable unique `reservation_id` for one preorder per reservation; `reservation_preorder` order type; `scheduled` paid status; `kitchen_release_at` and `kitchen_released_at`. Leave `session_id` null until an explicit arrival/seating link. |
| Order items | Snapshot purchased item name, unit price, ingredient choices, notes, and preparation time so later menu changes do not silently change a paid preorder. |
| Payment/refunds | Persist original amount, refunded amount and retained fee; an auditable refund record with gateway reference, request key, state, timestamps, and failure/reconciliation details. Represent a 95% return as a partial refund rather than a full refund. |
| Indexes | Reservation conflict/hold lookups, due scheduled orders, unique reservation-to-order association, and unique cancellation/refund request identifiers. |

Preorder order lifecycle:

`pending_payment → scheduled (paid) → confirmed (released to KDS) → preparing → ready → served/completed`

Eligible cancellation can move an unreleased or released preorder to `cancelled`, while the refund has its own processing lifecycle. Existing dine-in transitions retain their current meanings.

## Backend services and APIs

1. Introduce reservation checkout, payment completion, cancellation/refund, and kitchen-release services with Form Request validation. Reuse existing ingredient pricing, tax/discount rules, gateway client, receipt generation, and loyalty helpers where appropriate.
2. Keep `POST /reservations` compatible with table-only bookings. Add `POST /reservation-checkouts` for booking plus preorder/hold creation, and scoped checkout retry/status endpoints for that draft. Generate reservation-specific Safepay return URLs.
3. Add token-protected reservation management, cancellation quote, and cancellation submission endpoints. Anonymous access uses a high-entropy HMAC token bound to the booking and application key; raw secrets must not appear in staff/socket payloads. Guest name, reservation ID, or the short confirmation code alone cannot authorize financial actions.
4. Validate the complete reservation datetime on the server, restaurant opening hours, table capacity/ownership, and menu/ingredient availability and ownership. Check reservation overlap across midnight using full datetimes. Reject past slots even if their date is today.
5. Serialize competing bookings by locking the table row inside a database transaction, then checking active bookings and unexpired checkout holds. Recheck under lock on payment completion. Use one lock order across booking, release, and cancellation paths.
6. Treat server pricing as authoritative. Reject/requote changed or unavailable items before taking payment rather than silently charging a different amount. Freeze the accepted quote during the checkout attempt.
7. Route verified preorder callbacks/webhooks into preorder completion. Mark the order paid and scheduled, auto-confirm the reservation, and generate the receipt/email. Do not run live session accounting or broadcast a food order to the kitchen at this point.
8. Guard all alternate entry points: generic order cancellation, reservation status cancellation, payment refund, staff actions, and socket webhooks must route linked preorders through the same policy/service. They cannot bypass the deadline, duplicate refunds, or resurrect a cancelled preorder with a late payment callback.
9. Enforce restaurant scoping for reservation status changes and add authenticated staff validation for the affected socket actions. The current reservation status updater does not check ownership itself.
10. Make payment completion, confirmation emails, release, cancellation, and refunds idempotent. Account for duplicate/out-of-order webhooks, browser retries, and a payment arriving after a checkout hold expires. If payment succeeded but the table can no longer be confirmed, queue a full refund without the customer cancellation fee and surface the problem clearly.

## Card payments and real refunds

- Reservation checkout must reject cash at the API as well as hiding it in the UI. Verify the hosted gateway setup restricts this checkout to card payments.
- Implement an actual Safepay partial return for the approved 95% amount. Safepay documents partial refunds and distinguishes refunds from reversals based on transaction settlement/age; verify the appropriate supported operation against this merchant integration in sandbox. See [Safepay refund documentation](https://safepay-docs.netlify.app/modify-payments/refund/).
- Calculate and store money in integer paisa when determining the fee: round the 5% fee once, then subtract it from the original paid amount. Do not recalculate from current menu prices.
- A refund request is not a completed refund. Persist processing, successful, failed, and uncertain outcomes. Reconcile timeouts with the gateway before any retry that could return money twice.
- After accepting an eligible cancellation, cancel the booking/order and prevent kitchen release immediately, even if the gateway return is still processing. Show the pending refund to the customer and administrator.
- Notify the customer when cancellation is accepted and when the refund completes or needs assistance. Reverse awarded loyalty points exactly once. Fee retention and net refunded amounts must be visible in the payment ledger.
- Default policy for restaurant-initiated cancellation or inability to fulfill: full refund with no 5% customer cancellation fee. Staff recording a customer's phone cancellation uses the same two-hour/5% policy as the customer link. Audit the actor and reason.

## Cancellation link and email

- Link opens a reservation management page with booking, preorder, paid amount, deadline, fee, and refund quote. Simply opening the link does not cancel anything; require an explicit confirmation submission so email scanners cannot cancel bookings.
- Before or exactly at the two-hour deadline, permit customer cancellation. After the deadline, disable self-service cancellation and explain how to contact the restaurant. Enforce this on the server too.
- The reservation confirmation email includes the guest/table/date/time, confirmation code, purchased items and customizations, payment/receipt, cancellation deadline and terms, a clear **Manage or cancel reservation** link, and restaurant phone/email when available.
- State explicitly that the customer may contact the restaurant to request cancellation. Table-only emails also receive management/cancellation access, with no food payment fee when nothing was paid.
- Send emails after the relevant database transaction commits. Email delivery retries must not duplicate bookings or charges.

## Automatic kitchen release and sockets

1. Store release time at checkout using purchased preparation-time snapshots and the agreed formula. Revalidate eligibility at payment completion.
2. Add an every-minute scheduled command that selects due, fully paid, confirmed reservations with unreleased scheduled preorders. Claim each order under lock and check cancellation/refund state immediately before release.
3. Persist release atomically and use durable delivery/reconciliation so a crash between database commit and socket publishing cannot lose a ticket. Repeated scheduler runs must not create duplicate tickets. After downtime, catch up active due orders while flagging reservations already past arrival for staff attention.
4. Publish a reservation preorder release event to the restaurant kitchen room. Do not send a future booking's order-confirmed/payment/cart messages into the table room of unrelated diners currently using that table.
5. Include reservation date/time, guest, table, preorder badge, quantities, customization notes, and preparation deadline in KDS tickets. Calculate preorder urgency against arrival/readiness time, not the date of purchase. Ordinary order timing remains unchanged.
6. Update the active-order database endpoint and Redis initialization/reconnect paths to include released preorders only. Recover from database state after Redis expiry or restart. Reconcile on reconnect and deduplicate tickets by order ID.
7. Reload today's reservations from the database using restaurant-local dates rather than depending on a Redis set populated only when a same-day booking event occurred. Scope live reservation updates to the correct restaurant and date.
8. Broadcast cancellation/status changes to remove cancelled tickets and update reservation details. The current socket order-status payload uses `orderId` while the KDS listener expects `order_id`; normalize this affected contract and verify ordinary order transitions too.

## Admin dashboard and arrival

- Add preorder/payment badges and an expandable detail view to the reservations table: item quantities, customizations, notes, subtotal/tax/discount/total, paid amount, kitchen release time, order progress, receipt, cancellation fee, and refund status.
- Keep date filtering and table-only rows usable. Add scoped preorder/payment status filters where useful, with real-time invalidation for affected reservations.
- Automatically confirmed paid bookings should not show a redundant staff Confirm action. Cancellation controls must distinguish a customer's request from a restaurant-initiated cancellation, display the applicable refund, and use the centralized service.
- At arrival, provide an explicit staff seating/link action that associates the prepaid order with the correct live table session. Do not create a live session when the advance booking is paid, or automatically attach by table number to another party's session.
- Present the preorder as already paid after seating. Additional food uses the normal menu/cart/checkout and must not charge the preorder again. Recompute session payment/accounting state from actual linked orders rather than treating the whole visit as permanently paid.
- Review admin order/payment statuses, dashboard counts, sales/refund summaries, and preparation-time metrics so scheduled bookings are not counted as active kitchen work and days of advance waiting are not treated as food preparation time. Preserve current results for existing dine-in data.

## Defaults for edge cases

- For a booking made inside its two-hour cancellation window, clearly state before payment that self-service cancellation is already closed and require acknowledgement. Do not silently promise a refundable window that no longer exists.
- Allow preordering only when there is sufficient time for the purchased preparation time plus buffer before arrival; preserve table-only booking when a preorder cannot be prepared in time. If a valid payment completes after the calculated release instant, release immediately once confirmed.
- Do not silently substitute food if a paid item later becomes unavailable. Flag it to staff for customer contact and, if necessary, restaurant-initiated cancellation/refund.
- Editing a paid preorder, rescheduling it, and splitting a reservation preorder payment are outside this implementation. Customers can cancel/rebook under the stated policy; normal dining-session split payments remain available.
- No-show does not automatically initiate a refund. Administrators can see the paid order and handle exceptions explicitly.

## Implementation sequence

1. **Characterization and schema:** add regression coverage for the current table-only and dining flows; introduce additive fields, relationships, state types, timezone helpers, and reservation policy configuration.
2. **Reservation checkout:** implement conflict-safe holds, quote validation, isolated preorder creation, full card checkout, callbacks/webhooks, automatic confirmation, receipts, and expiry/late-payment handling.
3. **Cancellation/refunds:** implement secure management access, fee/deadline checks, gateway return handling/reconciliation, staff cancellation, and customer emails.
4. **Customer interface:** reuse the current menu/customization/cart/checkout design with an isolated reservation context, accurate terms, callback restoration, confirmation, and management page.
5. **Kitchen automation:** implement scheduled release, durable delivery/recovery, enriched tickets, database/Redis hydration, date/time handling, and cancellation updates.
6. **Admin and seating:** add preorder/payment/refund details and safe actions, explicit arrival/session linking, and affected reporting adjustments.
7. **End-to-end verification and rollout:** validate in sandbox, run regression suites, migrate existing data, verify worker/scheduler operation, then enable preorder entry. A rollout flag may hide new preorder creation while allowing existing paid bookings, releases, cancellations, and refunds to continue.

## Required verification

- Optional table-only reservation still works, including staff confirmation, email, cancellation, and no food charge.
- All available menu categories/items and ingredient choices appear for the selected restaurant with the existing UI design; unavailable/foreign-restaurant items cannot be purchased.
- Reservation cart and redirect restoration do not alter a concurrent dine-in cart, shared session, or its payment state.
- Full advance card checkout works; cash is rejected for preorders but remains functional for ordinary dining; existing equal/itemized split tests continue to pass.
- Concurrent bookings cannot acquire the same overlapping table slot. Include expired holds, duplicate submit, abandoned checkout, gateway failure, and late success.
- Verified payment confirms exactly once and sends one confirmation; unpaid orders never release to KDS.
- Test kitchen release immediately before/at/after its due time, item preparation snapshots, scheduler replay/downtime, database/Redis restart, restaurant scoping, midnight/date rollover, and KDS reconnect.
- Test cancellation just before, exactly at, and just after the two-hour cutoff, using restaurant time. A PKR 10,000 customer cancellation returns PKR 9,500; restaurant cancellation returns PKR 10,000.
- Test duplicate cancellation, cancellation racing kitchen release/payment completion, partial-return timeout/reconciliation, failure/retry, and duplicate/out-of-order webhooks without duplicate money movement.
- Email link opening is read-only; unauthorized/altered tokens cannot expose or cancel a reservation. Verify email rendering, receipt access, and contact wording.
- Admin can inspect preorder details and refund progress, cannot access another restaurant's booking, and cannot bypass centralized cancellation policy.
- Seating links the correct prepaid order; subsequent meals can be bought normally without charging the preorder twice.
- Run the complete backend suite, frontend type/lint/build checks, socket contract tests, and browser journeys for both preorder and existing dining flows. Perform a Safepay sandbox payment and partial-return exercise before enabling production.

## Operational requirements

- Production needs the Laravel scheduler invoked every minute, supervised queue workers, Redis, correct restaurant timezone, valid frontend/email links, and gateway webhook delivery.
- Add visibility for missed/overdue releases, failed email jobs, unresolved payment callbacks, and pending/failed refunds. A customer closing the browser must not interrupt confirmation, release, cancellation, or refund processing.
- Backfill current reservations' absolute arrival times using the restaurant's confirmed local timezone; do not create preorders or payment records for existing table-only bookings.
- Before deployment, confirm this merchant account's card-only checkout and partial refund/reversal capabilities in sandbox. Do not simulate successful financial returns by changing database status.
