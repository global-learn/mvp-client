import { toast as sonner } from 'sonner';
import type { AxiosError } from 'axios';

function extractMessage(error: unknown): string {
  // ZodError (and other schema errors) have .issues — never expose raw validation JSON to users
  if (
    error != null &&
    typeof error === 'object' &&
    'issues' in (error as object) &&
    Array.isArray((error as Record<string, unknown>).issues)
  ) {
    return 'Что-то пошло не так';
  }
  const axiosErr = error as AxiosError<{ message?: string }>;
  const serverMsg = axiosErr?.response?.data?.message;
  if (serverMsg && typeof serverMsg === 'string') return serverMsg;
  if (error instanceof Error) return error.message;
  return 'Что-то пошло не так';
}

export const toast = {
  success: (msg: string) => sonner.success(msg),
  error:   (msg: string) => sonner.error(msg),
  apiError: (error: unknown, fallback: string) =>
    sonner.error(extractMessage(error) || fallback),
};
