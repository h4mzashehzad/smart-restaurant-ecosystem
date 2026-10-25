import { api } from './api';
import type { User } from '@/contexts/AuthContext';
export interface RestaurantRegistrationPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  password_confirmation?: string;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_address: string;
  restaurant_email: string;
  restaurant_phone: string;
  opening_time: string | null;
  closing_time: string | null;
  timezone: string;
}
export interface RegistrationChallenge {
  challenge_id: string;
  email: string;
  expires_at: number;
  resend_after: number;
}
export const restaurantRegistration = {
  start: async (data: RestaurantRegistrationPayload, existing: boolean) =>
    (
      await api.http.post<{ data: RegistrationChallenge }>(
        `/auth/restaurant-registration${existing ? '/existing' : ''}`,
        data
      )
    ).data.data,
  verify: async (challenge_id: string, otp: string) =>
    (
      await api.http.post<{ data: { user: User; token: string } }>(
        '/auth/restaurant-registration/verify',
        { challenge_id, otp }
      )
    ).data.data,
  resend: async (challenge_id: string) =>
    (
      await api.http.post<{ data: { resend_after: number; expires_at: number } }>(
        '/auth/restaurant-registration/resend',
        { challenge_id }
      )
    ).data.data,
};
