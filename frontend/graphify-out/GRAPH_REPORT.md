# Graph Report - frontend  (2026-07-12)

## Corpus Check
- 125 files · ~126,632 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 898 nodes · 1619 edges · 67 communities (34 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `398eb06e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TeamContainer.tsx
- SocketClient
- useAuth
- ApiClient
- admin-api.ts
- KDSContainer.tsx
- cn
- devDependencies
- Detailed implementation guides
- sidebar.tsx
- compilerOptions
- PaymentContext.tsx
- useSession
- AdminShell.tsx
- components.json
- chart.tsx
- MenuContainer.tsx
- api.ts
- CartDrawer.tsx
- SessionContext.tsx
- ReservationContainer.tsx
- CartContext.tsx
- AdminSidebar.tsx
- sheet.tsx
- dependencies
- pagination.tsx
- layout.tsx
- popover.tsx
- tabs.tsx
- README.md
- test-reverb.js
- page.tsx
- page.tsx
- page.tsx
- badge.tsx
- axios
- @base-ui/react
- clsx
- date-fns
- eslint.config.mjs
- @headlessui/react
- @heroicons/react
- @hookform/resolvers
- lucide-react
- next
- next.config.ts
- next-themes
- qrcode
- react-day-picker
- react-dom
- react-hook-form
- @react-three/fiber
- recharts
- shadcn
- sonner
- tailwind-merge
- @tanstack/react-query
- three
- tw-animate-css
- zod
- zustand
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 166 edges
2. `SocketClient` - 84 edges
3. `ApiClient` - 49 edges
4. `useAuth()` - 29 edges
5. `Button()` - 20 edges
6. `useSession()` - 19 edges
7. `compilerOptions` - 16 edges
8. `Detailed implementation guides` - 16 edges
9. `useCart()` - 15 edges
10. `Skeleton()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `ChartContainer()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `ChartTooltipContent()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json

## Import Cycles
- None detected.

## Communities (67 total, 33 thin omitted)

### Community 0 - "TeamContainer.tsx"
Cohesion: 0.06
Nodes (61): AnalyticsContainer(), chartConfig, formatCurrency(), formatCurrency(), MenuContainer(), formatCurrency(), OrdersContainer(), STATUS_FILTERS (+53 more)

### Community 2 - "useAuth"
Cohesion: 0.05
Nodes (34): metadata, DashboardContainer(), formatCurrency(), AdminDashboardLayout(), metadata, formatCurrency(), PaymentsContainer(), metadata (+26 more)

### Community 4 - "admin-api.ts"
Cohesion: 0.07
Nodes (39): IMPORTANT: none of these methods send `restaurant_id` — every `/admin/*`, AdminMenuCategory, AdminMenuItem, AdminOrder, AdminOrderItem, AdminOrdersFilters, AdminPayment, AdminQueueEntry (+31 more)

### Community 5 - "KDSContainer.tsx"
Cohesion: 0.06
Nodes (32): KDSContainer(), KDSOrder, PRIORITY_ORDER, sortRequests(), CashPayment, CashPaymentCardProps, FlaggedFeedback, FlaggedFeedbackAlert() (+24 more)

### Community 6 - "cn"
Cohesion: 0.08
Nodes (33): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogMedia(), AlertDialogOverlay() (+25 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, prettier (+25 more)

### Community 8 - "Detailed implementation guides"
Cohesion: 0.06
Nodes (32): 10. Payment refunds & reconciliation, 11. Advanced analytics & exports, 12. Loyalty administration, 13. AI recommendation controls, 14. Activity feed / audit log, 15. Offline / PWA admin, 1. Manager role + granular permissions, 2. Staff invite delivery (email / WhatsApp) (+24 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.08
Nodes (29): Separator(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+21 more)

### Community 10 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 11 - "PaymentContext.tsx"
Cohesion: 0.11
Nodes (23): BillSummary(), BillSummaryProps, ClaimableUnit, ClaimRecord, ItemizedSplit(), ItemizedSplitProps, PaymentDrawerProps, PaymentStatusTracker() (+15 more)

### Community 12 - "useSession"
Cohesion: 0.11
Nodes (19): metadata, ScanPage(), ScanState, TableInfo, SessionBanner(), statusConfig, UserMenu(), Priority (+11 more)

### Community 13 - "AdminShell.tsx"
Cohesion: 0.10
Nodes (19): initials(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), DropdownMenu() (+11 more)

### Community 14 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "chart.tsx"
Cohesion: 0.14
Nodes (17): react, react, CalendarDayButton(), ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent() (+9 more)

### Community 16 - "MenuContainer.tsx"
Cohesion: 0.25
Nodes (11): MenuContainer(), CartDrawer(), CartFab(), CartFabProps, CategorySlider(), CategorySliderProps, ItemDetailDrawer(), ProductCard() (+3 more)

### Community 17 - "api.ts"
Cohesion: 0.15
Nodes (8): CallbackInner(), DrawerState, FeedbackDrawer(), ItemReview, OrderDetail, OrderMenuItem, api, API_URL

### Community 18 - "CartDrawer.tsx"
Cohesion: 0.16
Nodes (10): CartDrawerProps, OrderSuccess(), OrderSuccessProps, Ingredient, ItemDetailDrawerProps, MenuItemDetail, SPICE_LABELS, PaymentDrawer() (+2 more)

### Community 19 - "SessionContext.tsx"
Cohesion: 0.17
Nodes (14): ACTIVE_STATUSES, ActiveOrder, ActiveSession, getOrCreateDeviceId(), loadPersistedSession(), persistSession(), ServiceRequest, SessionContext (+6 more)

### Community 20 - "ReservationContainer.tsx"
Cohesion: 0.18
Nodes (10): Props, formatDate(), friendlyDate(), ReservationContainer(), Restaurant, Step, STEP_LABELS, STEPS (+2 more)

### Community 21 - "CartContext.tsx"
Cohesion: 0.26
Nodes (10): CartItem(), CartItemProps, CartContext, CartContextType, CartProvider(), loadPersisted(), mergeItems(), persist() (+2 more)

### Community 22 - "AdminSidebar.tsx"
Cohesion: 0.29
Nodes (8): AdminSidebar(), AdminSidebarProps, isActiveHref(), ADMIN_NAV_GROUPS, AdminNavGroup, AdminNavItem, KDS_NAV_ITEM, visibleNavGroups()

### Community 23 - "sheet.tsx"
Cohesion: 0.20
Nodes (6): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetOverlay(), SheetTitle()

### Community 24 - "dependencies"
Cohesion: 0.22
Nodes (9): class-variance-authority, dependencies, class-variance-authority, react-qr-code, @react-three/drei, socket.io-client, react-qr-code, @react-three/drei (+1 more)

### Community 25 - "pagination.tsx"
Cohesion: 0.22
Nodes (7): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 26 - "layout.tsx"
Cohesion: 0.29
Nodes (6): metadata, outfit, plusJakartaSans, RootLayout(), QueryProvider(), AuthProvider()

### Community 27 - "popover.tsx"
Cohesion: 0.29
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 28 - "tabs.tsx"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 29 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 30 - "test-reverb.js"
Cohesion: 0.50
Nodes (3): channel, Pusher, socket

## Knowledge Gaps
- **263 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `TeamContainer.tsx`, `useAuth`, `badge.tsx`, `sidebar.tsx`, `AdminShell.tsx`, `chart.tsx`, `AdminSidebar.tsx`, `sheet.tsx`, `pagination.tsx`, `layout.tsx`, `popover.tsx`, `tabs.tsx`?**
  _High betweenness centrality (0.310) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `chart.tsx`, `axios`, `@base-ui/react`, `clsx`, `date-fns`, `@headlessui/react`, `@heroicons/react`, `@hookform/resolvers`, `lucide-react`, `next`, `next-themes`, `qrcode`, `react-day-picker`, `react-dom`, `react-hook-form`, `@react-three/fiber`, `recharts`, `shadcn`, `sonner`, `tailwind-merge`, `@tanstack/react-query`, `three`, `tw-animate-css`, `zod`, `zustand`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `react` connect `chart.tsx` to `dependencies`, `sidebar.tsx`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TeamContainer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06222222222222222 - nodes in this community are weakly interconnected._
- **Should `SocketClient` be split into smaller, more focused modules?**
  _Cohesion score 0.02666666666666667 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05202661826981246 - nodes in this community are weakly interconnected._