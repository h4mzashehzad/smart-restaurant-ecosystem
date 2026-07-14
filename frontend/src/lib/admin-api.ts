import { isAxiosError } from 'axios';
import { api } from '@/lib/api';
import type {
  AdminIngredient,
  AdminMenuCategory,
  AdminMenuItem,
  AdminOrder,
  AdminOrdersFilters,
  AdminPayment,
  AdminQueueEntry,
  AdminReservation,
  AdminReview,
  AdminReviewsFilters,
  CreateCategoryPayload,
  CreateIngredientPayload,
  CreateMenuItemPayload,
  CreateTablePayload,
  CreateTeamMemberPayload,
  DashboardStats,
  DeleteCategoryResult,
  DeleteMenuItemResult,
  PaginatedResponse,
  PeakHourPoint,
  PopularItem,
  RestaurantDetails,
  RestaurantTable,
  RevenuePoint,
  SentimentSummary,
  TeamMember,
  UpdateCategoryPayload,
  UpdateIngredientPayload,
  UpdateMenuItemPayload,
  UpdateRestaurantPayload,
  UpdateTablePayload,
  UpdateTeamMemberPayload,
  WastageReport,
  WaiterServiceRequest,
  LoyaltySummary,
  AdminLoyaltyCustomer,
  AdminLoyaltyCustomerDetail,
  AdminLoyaltyCustomersFilters,
} from '@/types/admin';

/**
 * Admin dashboard API client.
 *
 * IMPORTANT: none of these methods send `restaurant_id` — every `/admin/*`
 * endpoint on the backend derives the operator's restaurant from the
 * authenticated user's token (see `ResolvesRestaurant` on the Laravel side).
 * This keeps the dashboard strictly single-tenant: an operator can only
 * ever see and mutate their own restaurant's data.
 *
 * This module reuses the shared axios instance configured in `api.ts`
 * (auth header + 401 handling) via the internal client getter.
 */
const client = api.http;

async function get<T>(url: string, params?: object): Promise<T> {
  const response = await client.get(url, { params });
  return response.data.data as T;
}

async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await client.post(url, data);
  return response.data.data as T;
}

async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await client.patch(url, data);
  return response.data.data as T;
}

async function del<T>(url: string): Promise<T> {
  const response = await client.delete(url);
  return response.data.data as T;
}

export const adminApi = {
  // ── Dashboard ────────────────────────────────────────────────────────
  getDashboardStats: () => get<DashboardStats>('/admin/dashboard/stats'),

  // ── Analytics (admin only) ──────────────────────────────────────────
  getRevenue: (params?: { period?: 'daily' | 'weekly' | 'monthly'; days?: number }) =>
    get<RevenuePoint[]>('/admin/analytics/revenue', params),

  getPeakHours: (params?: { days?: number }) =>
    get<PeakHourPoint[]>('/admin/analytics/peak-hours', params),

  getPopularItems: (params?: { limit?: number }) =>
    get<PopularItem[]>('/admin/analytics/popular-items', params),

  getSentimentSummary: () => get<SentimentSummary>('/admin/analytics/sentiment-summary'),

  getWastageReport: () => get<WastageReport>('/admin/analytics/wastage-report'),

  // ── Restaurant (admin only) ─────────────────────────────────────────
  getRestaurant: () => get<RestaurantDetails>('/admin/restaurant'),

  updateRestaurant: (payload: UpdateRestaurantPayload) =>
    patch<RestaurantDetails>('/admin/restaurant', payload),

  // ── Team (admin only) ───────────────────────────────────────────────
  getTeam: () => get<TeamMember[]>('/admin/team'),

  createTeamMember: (payload: CreateTeamMemberPayload) =>
    post<TeamMember>('/admin/team', payload),

  updateTeamMember: (id: number, payload: UpdateTeamMemberPayload) =>
    patch<TeamMember>(`/admin/team/${id}`, payload),

  removeTeamMember: (id: number) => del<void>(`/admin/team/${id}`),

  // ── Tables (admin only) ─────────────────────────────────────────────
  getTables: () => get<RestaurantTable[]>('/admin/tables'),

  createTable: (payload: CreateTablePayload) => post<RestaurantTable>('/admin/tables', payload),

  updateTable: (id: number, payload: UpdateTablePayload) =>
    patch<RestaurantTable>(`/admin/tables/${id}`, payload),

  deleteTable: (id: number) => del<void>(`/admin/tables/${id}`),

  regenerateTableQr: (id: number) =>
    post<RestaurantTable>(`/admin/tables/${id}/regenerate-qr`),

  downloadTableQr: async (id: number, tableNumber: string) => {
    try {
      const response = await client.get(`/admin/tables/${id}/qr-download`, {
        responseType: 'blob',
      });

      const contentType = String(response.headers['content-type'] ?? '');
      if (contentType.includes('application/json')) {
        const text = await (response.data as Blob).text();
        const parsed = JSON.parse(text) as { message?: string };
        throw new Error(parsed.message || 'Could not download the QR code image.');
      }

      const blob = response.data as Blob;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `table-${tableNumber}-qr.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text) as { message?: string };
          if (parsed.message) throw new Error(parsed.message);
        } catch (inner) {
          if (inner instanceof Error && inner.message !== 'Could not download the QR code image.') {
            throw inner;
          }
        }
      }
      throw error;
    }
  },

  // ── Menu (admin only) ───────────────────────────────────────────────
  // Backend exposes categories (with nested items) at /admin/menu/categories.
  getMenu: async () => {
    const categories = await get<
      Array<AdminMenuCategory & { menuItems?: AdminMenuItem[] }>
    >('/admin/menu/categories');

    return categories.map((category) => ({
      ...category,
      menu_items: category.menu_items ?? category.menuItems ?? [],
    }));
  },

  getIngredients: () => get<AdminIngredient[]>('/admin/ingredients'),

  createIngredient: (payload: CreateIngredientPayload) =>
    post<AdminIngredient>('/admin/ingredients', payload),

  updateIngredient: (id: number, payload: UpdateIngredientPayload) =>
    patch<AdminIngredient>(`/admin/ingredients/${id}`, payload),

  getCategories: async () => {
    const categories = await get<
      Array<AdminMenuCategory & { menuItems?: AdminMenuItem[] }>
    >('/admin/menu/categories');

    return categories.map((category) => ({
      ...category,
      menu_items: category.menu_items ?? category.menuItems ?? [],
    }));
  },

  createCategory: (payload: CreateCategoryPayload) =>
    post<AdminMenuCategory>('/admin/menu/categories', payload),

  updateCategory: (id: number, payload: UpdateCategoryPayload) =>
    patch<AdminMenuCategory>(`/admin/menu/categories/${id}`, payload),

  deleteCategory: async (id: number): Promise<DeleteCategoryResult> => {
    const response = await client.delete(`/admin/menu/categories/${id}`);
    return {
      message: (response.data.message as string) ?? 'Category deleted',
      data: response.data.data as AdminMenuCategory | undefined,
    };
  },

  createMenuItem: (payload: CreateMenuItemPayload) =>
    post<AdminMenuItem>('/admin/menu/items', payload),

  updateMenuItem: (id: number, payload: UpdateMenuItemPayload) =>
    patch<AdminMenuItem>(`/admin/menu/items/${id}`, payload),

  uploadMenuItemImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await client.post(`/admin/menu/items/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as AdminMenuItem;
  },

  deleteMenuItem: async (id: number): Promise<DeleteMenuItemResult> => {
    const response = await client.delete(`/admin/menu/items/${id}`);
    return {
      message: (response.data.message as string) ?? 'Menu item deleted',
      data: response.data.data as AdminMenuItem | undefined,
    };
  },

  // ── Orders ───────────────────────────────────────────────────────────
  getOrders: (filters?: AdminOrdersFilters) =>
    get<PaginatedResponse<AdminOrder>>('/admin/orders', filters),

  getOrder: (id: number) => get<AdminOrder>(`/admin/orders/${id}`),

  updateOrderStatus: (id: number, status: string) => api.updateOrderStatus(id, status),

  // ── Waiter / Service Requests ────────────────────────────────────────
  // Staff list lives at /service-requests (paginated). Unwrap to an array.
  getWaiterRequests: async (params?: { status?: string; view?: 'current' | 'history' }) => {
    const result = await get<PaginatedResponse<WaiterServiceRequest> | WaiterServiceRequest[]>(
      '/service-requests',
      { view: 'current', ...params }
    );
    return Array.isArray(result) ? result : (result?.data ?? []);
  },

  acknowledgeWaiterRequest: (id: number) =>
    patch<WaiterServiceRequest>(`/service-requests/${id}/acknowledge`),

  resolveWaiterRequest: (id: number) => patch<WaiterServiceRequest>(`/service-requests/${id}/resolve`),

  // ── Reviews ──────────────────────────────────────────────────────────
  getReviews: (filters?: AdminReviewsFilters) =>
    get<PaginatedResponse<AdminReview>>('/admin/feedback', {
      ...filters,
      ...(filters?.flagged !== undefined ? { flagged: filters.flagged ? 1 : 0 } : {}),
    }),

  dismissReviewFlag: (id: number) => patch<AdminReview>(`/admin/feedback/${id}/dismiss-flag`),

  // ── Reservations ─────────────────────────────────────────────────────
  getReservations: (params?: { date?: string }) =>
    get<AdminReservation[]>('/admin/reservations', params),

  updateReservationStatus: (id: number, status: string) =>
    patch<AdminReservation>(`/admin/reservations/${id}/status`, { status }),

  // ── Queue ─────────────────────────────────────────────────────────────
  getQueue: () => get<AdminQueueEntry[]>('/admin/queue'),

  updateQueueStatus: (id: number, status: string) =>
    patch<AdminQueueEntry>(`/admin/queue/${id}/status`, { status }),

  // ── Payments ──────────────────────────────────────────────────────────
  getPayments: (params?: { status?: string; page?: number }) =>
    get<PaginatedResponse<AdminPayment>>('/admin/payments', params),

  getPendingCashPayments: () => get<AdminPayment[]>('/admin/payments/pending-cash'),

  confirmCashPayment: (paymentId: number) => api.confirmCashPayment(paymentId),

  // ── Loyalty Program ───────────────────────────────────────────────────
  getLoyaltySummary: () => get<LoyaltySummary>('/admin/loyalty/summary'),

  getLoyaltyCustomers: (filters?: AdminLoyaltyCustomersFilters) =>
    get<PaginatedResponse<AdminLoyaltyCustomer>>('/admin/loyalty/customers', filters),

  getLoyaltyCustomer: (id: number, params?: { page?: number; per_page?: number }) =>
    get<AdminLoyaltyCustomerDetail>(`/admin/loyalty/customers/${id}`, params),
};

export type AdminApi = typeof adminApi;
