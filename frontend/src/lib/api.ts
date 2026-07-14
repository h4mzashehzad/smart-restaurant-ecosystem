import axios, { AxiosInstance, AxiosError } from 'axios';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
};

const API_URL = getBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  /** Shared axios instance (auth header + 401 handling already wired up). */
  get http(): AxiosInstance {
    return this.client;
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const token = localStorage.getItem('auth_token');
          localStorage.removeItem('auth_token');

          // Only redirect if we formerly had a token (expired session)
          // and we're not already heading to an auth page.
          const path = window.location.pathname;
          const isAdminRoute = path.startsWith('/admin');
          const isAdminLogin = path.startsWith('/admin/login');

          if (!token) {
            return Promise.reject(error);
          }

          if (isAdminRoute && !isAdminLogin) {
            window.location.href = '/admin/login';
          } else if (
            !isAdminRoute &&
            !path.startsWith('/login') &&
            !path.startsWith('/register') &&
            path !== '/'
          ) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async verifyOtp(email: string, otp: string) {
    const response = await this.client.post('/auth/verify-otp', { email, otp });
    if (response.data.success) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async login(identifier: string, password: string) {
    const response = await this.client.post('/auth/login', { identifier, password });
    if (response.data.success) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data.data;
  }

  // Table & Session endpoints

  /** Public — works for guests too. Returns table info + active session if any. */
  async scanTable(qrCode: string) {
    const response = await this.client.get(`/tables/${qrCode}/scan`);
    return response.data.data;
  }

  /** Public POST — creates or joins a session in one call. Pass deviceId for guests. */
  async scanAndJoin(qrCode: string, deviceId: string) {
    const response = await this.client.post(
      `/tables/${qrCode}/scan`,
      {},
      { headers: { 'X-Device-Id': deviceId } }
    );
    return response.data.data;
  }

  async joinSession(sessionId: number, deviceId: string) {
    const response = await this.client.post(
      `/sessions/${sessionId}/join`,
      {},
      { headers: { 'X-Device-Id': deviceId } }
    );
    return response.data.data;
  }

  async leaveSession(sessionId: number, deviceId: string) {
    const response = await this.client.post(
      `/sessions/${sessionId}/leave`,
      {},
      { headers: { 'X-Device-Id': deviceId } }
    );
    return response.data;
  }

  async endSession(sessionId: number, deviceId: string) {
    const response = await this.client.post(
      `/sessions/${sessionId}/end`,
      {},
      { headers: { 'X-Device-Id': deviceId } }
    );
    return response.data;
  }

  async getSession(sessionId: number) {
    const response = await this.client.get(`/sessions/${sessionId}?_t=${Date.now()}`);
    return response.data.data;
  }

  async getSessionParticipants(sessionId: number) {
    const response = await this.client.get(`/sessions/${sessionId}/participants`);
    return response.data.data;
  }

  async startSession(tableId: number, deviceId: string) {
    const response = await this.client.post(
      `/tables/${tableId}/start-session`,
      {},
      { headers: { 'X-Device-Id': deviceId } }
    );
    return response.data.data;
  }

  // Menu endpoints
  async getMenu(restaurantId: number) {
    const response = await this.client.get(`/restaurants/${restaurantId}/menu`);
    return response.data.data;
  }

  async getMenuItem(itemId: number) {
    const response = await this.client.get(`/menu-items/${itemId}`);
    return response.data.data;
  }

  async getRecommendations() {
    const response = await this.client.get('/menu-items/recommended');
    return response.data; // Return full object {success, data, source}
  }

  // Order endpoints
  async createOrder(orderData: any) {
    const response = await this.client.post('/orders', orderData);
    return response.data.data;
  }

  // ── Payments ────────────────────────────────────────────────────────────
  async checkout(data: {
    session_id: number;
    table_id: number;
    items: {
      menu_item_id: number;
      quantity: number;
      customizations?: {
        ingredient_id: number;
        action: 'add' | 'remove' | 'modify';
        quantity?: number;
      }[];
    }[];
    special_instructions?: string | null;
    mode: 'full' | 'split_equal' | 'split_itemized';
    payment_method?: 'cash' | 'safepay';
    participant_id?: number | null;
    device_id?: string;
  }) {
    const response = await this.client.post('/payments/checkout', data);
    return response.data;
  }

  async setupSplitBill(data: {
    order_id: number;
    session_id: number;
    split_type: 'equal' | 'itemized';
    participant_ids?: number[];
  }) {
    const response = await this.client.post('/payments/split-bill/setup', data);
    return response.data;
  }

  async unlockSplitBill(data: { order_id: number; session_id: number }) {
    const response = await this.client.post('/payments/split-bill/unlock', data);
    return response.data;
  }

  async claimSplitItem(data: {
    order_id: number;
    session_id: number;
    order_item_id: number;
    unit_index: number;
    action: 'claim' | 'unclaim';
    participant_id?: number | null;
    device_id?: string;
  }) {
    const response = await this.client.post('/payments/split-bill/claim', data);
    return response.data;
  }

  async participantCheckout(data: { payment_id: number; payment_method: 'cash' | 'safepay' }) {
    const response = await this.client.post('/payments/split-bill/participant-checkout', data);
    return response.data;
  }

  async getSessionBill(sessionId: number) {
    const response = await this.client.get(`/sessions/${sessionId}/bill`);
    return response.data.data;
  }

  async getPaymentStatus(sessionId: number) {
    const response = await this.client.get(`/sessions/${sessionId}/payment-status`);
    return response.data.data;
  }

  async confirmCashPayment(paymentId: number) {
    const response = await this.client.post(`/payments/${paymentId}/confirm-cash`);
    return response.data;
  }

  async getPendingCashPayments(restaurantId: number) {
    const response = await this.client.get('/payments/cash/pending', {
      params: { restaurant_id: restaurantId },
    });
    return response.data.data;
  }

  async getReceiptUrl(paymentId: number) {
    const response = await this.client.get(`/payments/${paymentId}/receipt`);
    return response.data.data;
  }

  async verifySafepayCallback(tracker: string, cancelled = false) {
    const response = await this.client.get('/payments/safepay/callback', {
      params: cancelled ? { tracker, cancelled: 1 } : { tracker },
    });
    return response.data;
  }

  async getOrder(orderId: number) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data.data;
  }

  async getActiveOrders() {
    const response = await this.client.get('/orders/active');
    return response.data.data;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const response = await this.client.patch(`/orders/${orderId}/status`, { status });
    return response.data.data;
  }

  async getSessionOrders(sessionId: number) {
    const response = await this.client.get(`/sessions/${sessionId}/orders`);
    return response.data.data;
  }

  // Admin / KDS endpoints
  async getActiveKitchenOrders(restaurantId: number) {
    const response = await this.client.get(`/admin/kitchen/orders/active?restaurant_id=${restaurantId}`);
    return response.data.data;
  }

  // Service Request endpoints
  async createServiceRequest(data: {
    restaurant_id: number;
    table_id: number;
    session_id: number;
    request_type: string;
    priority?: string;
    message?: string;
  }) {
    const response = await this.client.post('/service-requests', data);
    return response.data.data;
  }

  async getActiveServiceRequests(restaurantId: number) {
    const response = await this.client.get(
      `/service-requests?restaurant_id=${restaurantId}&status=pending&status=acknowledged`
    );
    return response.data.data;
  }

  // Feedback endpoints
  async submitFeedback(data: {
    restaurant_id: number;
    order_id: number;
    rating: number;
    review_text?: string;
    item_ratings?: Array<{
      menu_item_id: number;
      rating: number;
      review_text?: string;
    }>;
  }) {
    const response = await this.client.post('/feedback', data);
    return response.data;
  }

  async getFeedback(orderId: number) {
    const response = await this.client.get(`/feedback/${orderId}`);
    return response.data;
  }

  // ── Reservation endpoints ──────────────────────────────────────────────

  async getRestaurantBySlug(slug: string) {
    const response = await this.client.get(`/restaurants/slug/${slug}`);
    return response.data.data;
  }

  async getTableAvailability(restaurantId: number, date: string, time: string, partySize: number = 1) {
    const response = await this.client.get(`/restaurants/${restaurantId}/tables/availability`, {
      params: { date, time, party_size: partySize },
    });
    return response.data.data;
  }

  async getTimeSlots(restaurantId: number, date: string) {
    const response = await this.client.get(`/restaurants/${restaurantId}/time-slots`, {
      params: { date },
    });
    return response.data.data;
  }

  async createReservation(data: {
    restaurant_id: number;
    table_id: number;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    special_requests?: string;
  }) {
    const response = await this.client.post('/reservations', data);
    return response.data;
  }

  async getReservation(confirmationCode: string) {
    const response = await this.client.get(`/reservations/${confirmationCode}`);
    return response.data.data;
  }

  async cancelReservation(reservationId: number) {
    const response = await this.client.post(`/reservations/${reservationId}/cancel`);
    return response.data;
  }

  async getRestaurantReservations(restaurantId: number, date?: string) {
    const response = await this.client.get(`/admin/restaurants/${restaurantId}/reservations`, {
      params: date ? { date } : {},
    });
    return response.data.data;
  }

  // ── Queue endpoints ────────────────────────────────────────────────────

  async joinQueue(data: {
    restaurant_id: number;
    guest_name: string;
    guest_phone: string;
    party_size: number;
  }) {
    const response = await this.client.post('/queue/join', data);
    return response.data;
  }

  async getRestaurantQueue(restaurantId: number) {
    const response = await this.client.get(`/admin/restaurants/${restaurantId}/queue`);
    return response.data.data;
  }
}

export const api = new ApiClient();
