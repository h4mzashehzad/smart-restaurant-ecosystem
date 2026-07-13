import { isAxiosError } from 'axios';

/** Extracts a user-friendly message from an API error, falling back gracefully. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[] | string> }
      | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors).flat()[0];
      if (typeof first === 'string' && first.trim()) return first;
    }
    return fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
