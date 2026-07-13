// Shared types for the restaurant admin dashboard.
// These mirror the JSON shapes returned by the Laravel backend's
// `/api/admin/*` endpoints. Fields marked optional may not be present
// on every response depending on eager-loaded relations.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type QueueStatus = 'waiting' | 'called' | 'seated' | 'cancelled' | 'no_show';

export type ServiceRequestStatus = 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'cash' | 'safepay';

// ── Dashboard / Analytics ────────────────────────────────────────────────

export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  active_orders: number;
  total_customers: number;
  pending_reservations: number;
  average_rating: number;
  open_waiter_requests: number;
  flagged_reviews: number;
}

export interface RevenuePoint {
  period: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

export interface PeakHourPoint {
  hour: number;
  order_count: number;
  revenue: number;
}

export interface PopularItem {
  id: number;
  name: string;
  base_price: number;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface SentimentBreakdownEntry {
  sentiment_label: string;
  count: number;
  avg_score: number;
  avg_rating: number;
}

export interface SentimentSummary {
  sentiment_breakdown: SentimentBreakdownEntry[];
  flagged_reviews: number;
}

export interface LowStockIngredient {
  id: number;
  name: string;
  stock_quantity: number;
  minimum_threshold: number;
  unit?: string;
}

export interface WastageReport {
  low_stock_ingredients: LowStockIngredient[];
  total_low_stock: number;
}

// ── Restaurant ────────────────────────────────────────────────────────────

export interface RestaurantDetails {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_active: boolean;
}

export interface UpdateRestaurantPayload {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
}

// ── Team ──────────────────────────────────────────────────────────────────

export type TeamRole = 'admin' | 'staff';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: TeamRole;
  is_active: boolean;
  created_at?: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: TeamRole;
}

export interface UpdateTeamMemberPayload {
  name?: string;
  phone?: string;
  role?: TeamRole;
  is_active?: boolean;
}

// ── Tables ────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'inactive';

export interface RestaurantTable {
  id: number;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_code?: string | null;
  qr_code_url?: string | null;
  current_session_id?: number | null;
}

export interface CreateTablePayload {
  table_number: string;
  capacity: number;
}

export interface UpdateTablePayload {
  table_number?: string;
  capacity?: number;
  status?: TableStatus;
}

// ── Menu ──────────────────────────────────────────────────────────────────

export type SpiceLevel = 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';

export interface AdminMenuItemIngredientPivot {
  quantity: number;
  is_optional: boolean;
  is_removable: boolean;
}

export interface AdminMenuItemIngredient {
  id: number;
  name: string;
  unit?: string;
  is_allergen?: boolean;
  allergen_type?: string | null;
  pivot: AdminMenuItemIngredientPivot;
}

export interface AdminMenuItem {
  id: number;
  category_id: number;
  name: string;
  slug?: string;
  description?: string | null;
  base_price: number;
  preparation_time?: number | null;
  spice_level?: SpiceLevel | null;
  cuisine_type?: string | null;
  calories?: number | null;
  is_available: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_signature?: boolean;
  image_url?: string | null;
  average_rating?: number | null;
  total_orders?: number;
  updated_at?: string;
  ingredients?: AdminMenuItemIngredient[];
}

export interface AdminMenuCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  menu_items: AdminMenuItem[];
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface DeleteCategoryResult {
  message: string;
  data?: AdminMenuCategory;
}

export interface AdminIngredient {
  id: number;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
  minimum_threshold: number;
  is_allergen: boolean;
  allergen_type?: string | null;
}

export interface CreateIngredientPayload {
  name: string;
  unit?: string;
  cost_per_unit?: number;
  stock_quantity?: number;
  minimum_threshold?: number;
  is_allergen?: boolean;
  allergen_type?: string | null;
}

export interface UpdateIngredientPayload {
  name?: string;
  unit?: string;
  cost_per_unit?: number;
  stock_quantity?: number;
  minimum_threshold?: number;
  is_allergen?: boolean;
  allergen_type?: string | null;
}

export interface MenuItemIngredientPayload {
  ingredient_id: number;
  quantity: number;
  is_optional?: boolean;
  is_removable?: boolean;
}

export interface CreateMenuItemPayload {
  category_id: number;
  name: string;
  description?: string | null;
  base_price: number;
  preparation_time?: number | null;
  spice_level?: SpiceLevel | null;
  cuisine_type?: string | null;
  calories?: number | null;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_available?: boolean;
  is_signature?: boolean;
  ingredients?: MenuItemIngredientPayload[];
}

export interface UpdateMenuItemPayload {
  name?: string;
  description?: string | null;
  base_price?: number;
  preparation_time?: number | null;
  is_available?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_signature?: boolean;
  spice_level?: SpiceLevel | null;
  cuisine_type?: string | null;
  calories?: number | null;
  image_url?: string | null;
  category_id?: number;
  ingredients?: MenuItemIngredientPayload[];
}

export interface DeleteMenuItemResult {
  message: string;
  data?: AdminMenuItem;
}

// ── Orders ────────────────────────────────────────────────────────────────

export interface AdminOrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  menu_item: { id: number; name: string };
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  placed_at: string;
  table: { id: number; table_number: string } | null;
  user: { id: number; name: string } | null;
  items: AdminOrderItem[];
}

export interface AdminOrdersFilters {
  status?: OrderStatus;
  date?: string;
  page?: number;
}

// ── Waiter / Service Requests ─────────────────────────────────────────────

export interface WaiterServiceRequest {
  id: number;
  request_type: 'waiter_call' | 'bill_request' | 'water_refill' | 'cutlery' | 'complaint' | 'other';
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  message?: string | null;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  table: { id: number; table_number: string } | null;
  user?: { id: number; name: string } | null;
}

// ── Reviews / Feedback ────────────────────────────────────────────────────

export interface AdminReview {
  id: number;
  rating: number;
  review_text?: string | null;
  is_flagged: boolean;
  flagged_reason?: string | null;
  sentiment_label?: string | null;
  sentiment_score?: number | null;
  created_at: string;
  user?: { id: number; name: string } | null;
}

export interface AdminReviewsFilters {
  flagged?: boolean;
  rating?: number;
  page?: number;
}

// ── Reservations ──────────────────────────────────────────────────────────

export interface AdminReservation {
  id: number;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  special_requests?: string | null;
  confirmation_code: string;
  table: { id: number; table_number: string } | null;
}

// ── Queue ─────────────────────────────────────────────────────────────────

export interface AdminQueueEntry {
  id: number;
  queue_number: number;
  guest_name: string;
  guest_phone: string;
  party_size: number;
  status: QueueStatus;
  estimated_wait_time: number;
  joined_at: string;
  called_at?: string | null;
  seated_at?: string | null;
}

// ── Payments ──────────────────────────────────────────────────────────────

export interface AdminPayment {
  id: number;
  order_id?: number;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  order: {
    id: number;
    order_number: string;
    table_id?: number;
    table_number?: string;
    table?: { table_number?: string } | null;
    items_summary?: Array<{ name: string; quantity: number }>;
  } | null;
}

// ── Generic pagination envelope (Laravel paginate()) ─────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
