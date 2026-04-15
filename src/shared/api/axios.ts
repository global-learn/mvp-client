import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Единый экземпляр axios для всего приложения.
// withCredentials: true — браузер автоматически прикладывает HTTP-only cookies
// к каждому запросу (access token + refresh token).

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ================================================================
// 401 INTERCEPTOR — автоматическое обновление access token
// ================================================================
//
// Схема:
//   1. Запрос уходит с access token в cookie (автоматически, браузер сам)
//   2. Бэкенд вернул 401 — access token истёк
//   3. Interceptor вызывает POST /auth/refresh
//   4. Бэкенд проверяет refresh token (тоже в cookie) и ставит новый access
//   5. Исходный запрос повторяется — теперь проходит
//   6. Если refresh тоже истёк — редирект на /login
//
// isRefreshing + failedQueue решают race condition:
//   5 одновременных запросов получили 401 → только первый вызывает /auth/refresh,
//   остальные 4 ждут в очереди и выполняются после успешного обновления.

type FailedRequest = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(original));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh');
      processQueue(null);
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
