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
          if (token && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
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
    return response.data.data;
  }

  // Order endpoints
  async createOrder(orderData: any) {
    const response = await this.client.post('/orders', orderData);
    return response.data.data;
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
}

export const api = new ApiClient();
