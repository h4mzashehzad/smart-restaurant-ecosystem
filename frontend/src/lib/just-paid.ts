/** Written by Safepay callback; consumed by PaymentContext after redirect to /menu. */
export const JUST_PAID_STORAGE_KEY = 'sre_just_paid';

export type JustPaidPayload = {
  sessionId: number;
  paymentId: number;
  receiptUrl: string | null;
  orderNumber: string;
  amount?: number;
};

export function readJustPaidPayload(): JustPaidPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(JUST_PAID_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JustPaidPayload;
  } catch {
    return null;
  }
}

export function clearJustPaidPayload(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(JUST_PAID_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function writeJustPaidPayload(payload: JustPaidPayload): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(JUST_PAID_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}
