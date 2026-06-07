import axios from 'axios';

// Backend error shape (AllExceptionsFilter)
type BackendError = {
  message?: string;
  code?: string;
  statusCode?: number;
};

/**
 * Returns HTTP status code from an axios error, or undefined for non-HTTP errors.
 */
export function getApiStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
}

/**
 * Extracts a user-visible message from any caught error.
 * Priority: backend `message` field → network error → fallback.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Нет соединения с сервером';
    const data = error.response.data as BackendError | undefined;
    if (typeof data?.message === 'string' && data.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
