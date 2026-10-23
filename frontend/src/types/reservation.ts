export interface ReservationDraft {
  restaurant_id: number;
  table_id: number;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  checkout_key: string;
  slug: string;
  restaurantName: string;
  tableNumber: string;
  timezone: string;
}

/** getRandomValues also works on the HTTP LAN origins used by local diners. */
export function reservationCheckoutKey(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface ReservationRefund {
  id: number;
  amount_paisa: number;
  fee_paisa: number;
  status: string;
  last_error?: string | null;
}

export interface ReservationPreorder {
  id: number;
  order_number: string;
  status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  kitchen_release_at: string;
  special_instructions?: string;
  session_id?: number | null;
  items: { id: number; item_name: string; quantity: number; total_price: string; customization_notes?: string }[];
  payments: { id: number; status: string; amount: string; paid_at?: string | null; receipt_url?: string | null; refunds: ReservationRefund[] }[];
}

export interface ManagedReservation {
  id: number;
  guest_name: string;
  guest_phone: string;
  confirmation_code: string;
  status: string;
  checkout_state: string;
  checkout_expires_at?: string;
  arrival_at: string;
  cancellation_deadline: string;
  cancellation_fee_percent: number;
  party_size: number;
  restaurant: { id: number; name: string; slug: string; timezone: string; phone?: string; email?: string };
  table?: { table_number: string };
  preorder?: ReservationPreorder | null;
  refunds: ReservationRefund[];
  cancellation: { allowed: boolean; deadline: string; fee_paisa: number; refund_paisa: number };
}

export function restaurantTime(instant: string, timezone: string): string {
  return new Date(instant).toLocaleString('en-PK', { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' });
}
