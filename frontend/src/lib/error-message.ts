import { isAxiosError } from 'axios';

/** Extracts a user-friendly message from an API error, falling back gracefully. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
