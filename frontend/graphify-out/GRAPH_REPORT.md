# Graph Report - frontend  (2026-07-16)

## Corpus Check
- 146 files · ~143,521 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1007 nodes · 2046 edges · 59 communities (44 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `61c0d053`
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
- postcss.config.mjs
- sonner.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 178 edges
2. `SocketClient` - 84 edges
3. `ApiClient` - 51 edges
4. `useAuth()` - 29 edges
5. `Button()` - 26 edges
6. `useSession()` - 21 edges
7. `Skeleton()` - 17 edges
8. `ErrorState()` - 16 edges
9. `PageHeader()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/layout.tsx → src/lib/utils.ts
- `MenuItemCardProps` --references--> `AdminMenuItem`  [EXTRACTED]
  src/components/admin/menu/MenuItemCard.tsx → src/types/admin.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertDialogContent()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (59 total, 15 thin omitted)

### Community 0 - "TeamContainer.tsx"
Cohesion: 0.06
Nodes (90): CategoriesContainer(), CategoryForm, EMPTY_FORM, toForm(), toPayload(), DashboardContainer(), formatCurrency(), EMPTY_FORM (+82 more)

### Community 2 - "useAuth"
Cohesion: 0.13
Nodes (15): AdminDashboardLayout(), LoginContent(), RegisterContent(), ScanPage(), ScanState, TableInfo, AdminShell(), initials() (+7 more)

### Community 4 - "admin-api.ts"
Cohesion: 0.06
Nodes (31): IMPORTANT: none of these methods send `restaurant_id` — every `/admin/*`, AdminLoyaltyCustomerDetail, AdminLoyaltyCustomersFilters, AdminOrder, AdminOrdersFilters, AdminPayment, AdminQueueEntry, AdminReservation (+23 more)

### Community 5 - "KDSContainer.tsx"
Cohesion: 0.05
Nodes (37): KDSContainer(), KDSOrder, PRIORITY_ORDER, sortRequests(), CashPayment, CashPaymentCardProps, FlaggedFeedback, FlaggedFeedbackAlert() (+29 more)

### Community 6 - "cn"
Cohesion: 0.10
Nodes (29): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Breadcrumb(), BreadcrumbEllipsis() (+21 more)

### Community 7 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, prettier, prettier-plugin-tailwindcss, tailwindcss, @tailwindcss/postcss (+5 more)

### Community 8 - "Detailed implementation guides"
Cohesion: 0.06
Nodes (30): 10. Payment refunds & reconciliation, 11. Advanced analytics & exports, 12. Loyalty administration, 13. AI recommendation controls, 14. Activity feed / audit log, 15. Offline / PWA admin, 1. Manager role + granular permissions, 2. Staff invite delivery (email / WhatsApp) (+22 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.07
Nodes (32): Separator(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+24 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "PaymentContext.tsx"
Cohesion: 0.10
Nodes (26): BillSummary(), BillSummaryProps, ClaimableUnit, ClaimRecord, ItemizedSplit(), ItemizedSplitProps, PaymentDrawerProps, PaymentStatusTracker() (+18 more)

### Community 12 - "useSession"
Cohesion: 0.18
Nodes (11): Priority, PRIORITY_OPTS, PriorityOption, REQUEST_OPTIONS, RequestOption, RequestType, STATUS_INFO, STATUS_STEPS (+3 more)

### Community 13 - "AdminShell.tsx"
Cohesion: 0.10
Nodes (19): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+11 more)

### Community 14 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "chart.tsx"
Cohesion: 0.06
Nodes (41): AnalyticsContainer(), categoryConfig, forecastConfig, formatCurrency(), Period, revenueConfig, sentimentConfig, TIER_COLORS (+33 more)

### Community 16 - "MenuContainer.tsx"
Cohesion: 0.21
Nodes (13): CartDrawer(), CartDrawerProps, CartFab(), CartFabProps, CartItem(), OrderSuccess(), OrderSuccessProps, PaymentDrawer() (+5 more)

### Community 17 - "api.ts"
Cohesion: 0.20
Nodes (7): DrawerState, FeedbackDrawer(), ItemReview, OrderDetail, OrderMenuItem, Portal(), PortalProps

### Community 18 - "CartDrawer.tsx"
Cohesion: 0.19
Nodes (12): AdjustableIngredient, computeCustomizationExtra(), IngredientPicker(), IngredientPickerProps, Ingredient, ItemDetailDrawer(), ItemDetailDrawerProps, MenuItemDetail (+4 more)

### Community 19 - "SessionContext.tsx"
Cohesion: 0.17
Nodes (14): ACTIVE_STATUSES, ActiveOrder, ActiveSession, getOrCreateDeviceId(), loadPersistedSession(), persistSession(), ServiceRequest, SessionContext (+6 more)

### Community 20 - "ReservationContainer.tsx"
Cohesion: 0.18
Nodes (10): Props, formatDate(), friendlyDate(), ReservationContainer(), Restaurant, Step, STEP_LABELS, STEPS (+2 more)

### Community 21 - "CartContext.tsx"
Cohesion: 0.28
Nodes (12): CartItemProps, CartContext, CartContextType, CartProvider(), loadPersisted(), mergeItems(), normalizeCartItem(), persist() (+4 more)

### Community 22 - "AdminSidebar.tsx"
Cohesion: 0.29
Nodes (8): AdminSidebar(), AdminSidebarProps, isActiveHref(), ADMIN_NAV_GROUPS, AdminNavGroup, AdminNavItem, KDS_NAV_ITEM, visibleNavGroups()

### Community 23 - "sheet.tsx"
Cohesion: 0.06
Nodes (33): AdminLoyaltyCustomer, AdminLoyaltyTransaction, AdminMenuItemIngredientPivot, AdminOrderItem, AdminReviewsFilters, CreateCategoryPayload, CreateTablePayload, DemandForecastHourly (+25 more)

### Community 24 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, axios, @base-ui/react, class-variance-authority, clsx, date-fns, @google/model-viewer, @headlessui/react (+22 more)

### Community 25 - "pagination.tsx"
Cohesion: 0.11
Nodes (8): metadata, metadata, metadata, metadata, metadata, metadata, metadata, RequireAdmin()

### Community 26 - "layout.tsx"
Cohesion: 0.29
Nodes (6): metadata, outfit, plusJakartaSans, RootLayout(), QueryProvider(), AuthProvider()

### Community 27 - "popover.tsx"
Cohesion: 0.29
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 28 - "tabs.tsx"
Cohesion: 0.16
Nodes (8): metadata, QueueContainer(), STATUS_CONFIG, timeAgo(), CallbackInner(), api, API_URL, writeJustPaidPayload()

### Community 29 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 30 - "test-reverb.js"
Cohesion: 0.50
Nodes (3): channel, Pusher, socket

### Community 35 - "axios"
Cohesion: 0.28
Nodes (9): MenuContainer(), ArMenuItem, toArMenuItem(), toProxiedArModelUrl(), ARViewerOverlay(), ARViewerOverlayProps, ViewerState, CategorySlider() (+1 more)

### Community 36 - "@base-ui/react"
Cohesion: 0.15
Nodes (9): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogMedia(), AlertDialogOverlay() (+1 more)

### Community 37 - "clsx"
Cohesion: 0.29
Nodes (5): metadata, SessionBanner(), statusConfig, UserMenu(), useSession()

### Community 38 - "date-fns"
Cohesion: 0.31
Nodes (9): hasArModel(), ItemContent(), isTopRated(), MenuItemRating(), MenuItemRatingProps, TopRatedBadge(), isCustomizable(), ProductCard() (+1 more)

### Community 40 - "@headlessui/react"
Cohesion: 0.20
Nodes (9): SelectContent(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 41 - "@heroicons/react"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 42 - "@hookform/resolvers"
Cohesion: 0.32
Nodes (7): formatTier(), LoyaltyDashboardDrawer(), LoyaltyDashboardDrawerProps, LoyaltySnapshot, LoyaltyTransactionRow, TIER_STYLES, typeBadge()

### Community 43 - "lucide-react"
Cohesion: 0.38
Nodes (6): formatPkr(), MenuItemPreviewModal(), MenuItemPreviewModalProps, SPICE_LABELS, AdminMenuItem, AdminMenuItemIngredient

### Community 44 - "next"
Cohesion: 0.60
Nodes (5): ALLOWED_HOST_SUFFIXES, contentTypeFor(), GET(), HEAD(), isAllowedModelUrl()

### Community 46 - "next-themes"
Cohesion: 0.40
Nodes (5): MenuItemEditModalProps, AdminIngredient, AdminMenuCategory, CreateMenuItemPayload, UpdateMenuItemPayload

### Community 47 - "qrcode"
Cohesion: 0.40
Nodes (4): IntrinsicElements, JSX, ModelViewerProps, react

## Knowledge Gaps
- **299 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `TeamContainer.tsx`, `useAuth`, `badge.tsx`, `@base-ui/react`, `@headlessui/react`, `sidebar.tsx`, `AdminShell.tsx`, `chart.tsx`, `recharts`, `AdminSidebar.tsx`, `layout.tsx`, `popover.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `SocketClient` connect `SocketClient` to `.connect`, `KDSContainer.tsx`, `PaymentContext.tsx`, `SessionContext.tsx`, `CartContext.tsx`, `tabs.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `ApiClient` connect `ApiClient` to `api.ts`, `tabs.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TeamContainer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05578391074574281 - nodes in this community are weakly interconnected._
- **Should `SocketClient` be split into smaller, more focused modules?**
  _Cohesion score 0.02666666666666667 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._