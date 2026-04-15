import axios from 'axios';

// Единый экземпляр axios для всего приложения.
// Когда появится бэкенд — меняешь VITE_API_URL в .env, и все запросы пойдут туда.
// Именно здесь подключают interceptors: добавление JWT токена, обработка 401 и т.д.

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Пример interceptor для JWT-авторизации (раскомментируй когда появится auth):
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// Пример interceptor для обработки ошибок:
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) window.location.href = '/login';
//     return Promise.reject(error);
//   }
// );
