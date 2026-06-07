# API Implementation Status

Статус реализации клиентского кода по каждому эндпоинту swagger.

**Легенда:**
- ✅ Клиентский код реализован (schemas + API-функции + хуки)
- 🔌 Реализован, но UI ещё на моке (код готов, страница не подключена)
- ⏳ Backend есть, клиент ещё не реализован
- ❌ Backend ещё не реализован

---

## auth

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST | `/auth/register` | 🔌 | `entities/user/api/authApi.ts` |
| POST | `/auth/complete-registration` | 🔌 | `entities/user/api/authApi.ts` |
| POST | `/auth/login` | 🔌 | `entities/user/api/authApi.ts` |
| POST | `/auth/refresh` | ✅ | `shared/api/axios.ts` (interceptor) |
| POST | `/auth/logout` | 🔌 | `entities/user/api/authApi.ts` |
| POST | `/auth/change-password` | 🔌 | `entities/user/api/authApi.ts` |
| GET  | `/auth/me` | ❌ | — (backend не реализован, auth мокается) |

## user

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST | `/user` | ⏳ | — |
| GET  | `/user` | ⏳ | — |
| GET  | `/user/{id}` | 🔌 | `entities/user/api/authApi.ts` (getUserById) |

## departments

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/departments` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/departments` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/departments/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| PATCH  | `/departments/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| DELETE | `/departments/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |

## divisions

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/divisions` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/divisions` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/divisions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| PATCH  | `/divisions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| DELETE | `/divisions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |

## positions

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/positions` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/positions` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/positions/tree` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| GET    | `/positions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| PATCH  | `/positions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |
| DELETE | `/positions/{id}` | ✅ | `entities/company/api/companyApi.ts` + `hooks.ts` |

## employees

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/employees` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| GET    | `/employees` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| GET    | `/employees/me/subordinates` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| GET    | `/employees/{id}` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| PATCH  | `/employees/{id}` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| DELETE | `/employees/{id}` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |
| PATCH  | `/employees/{id}/promote` | ✅ | `entities/user/api/employeeApi.ts` + `employeeHooks.ts` |

## onboarding-templates

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/onboarding/templates` | 🔌 | `entities/onboarding/api/onboardingRealApi.ts` |
| GET    | `/onboarding/templates` | ❌ | — (backend не реализован, mock в `onboardingApi.ts`) |

## onboardings

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/onboardings` (assign) | 🔌 | `entities/onboarding/api/onboardingRealApi.ts` |
| GET    | `/onboardings` | ❌ | — (backend не реализован) |
| GET    | `/onboardings/{id}` | ❌ | — (backend не реализован) |
| POST   | `/onboardings/{id}/complete-step` | 🔌 | `entities/onboarding/api/onboardingRealApi.ts` |

## onboarding-chat

| Method | Path | Клиент | Файл |
|--------|------|--------|------|
| POST   | `/onboardings/{id}/chat/messages` | 🔌 | `entities/onboarding/api/onboardingRealApi.ts` |
| GET    | `/onboardings/{id}/chat/messages` | ❌ | — (backend не реализован) |

---

## Когда auth переедет на реальный бэкенд

1. Добавить `GET /auth/me` на бэке
2. В `UserContext.tsx`:
   - `login()` → `authApi.login()` → сохранить id
   - источник `user` → `useQuery(queryKeys.auth.me, () => authApi.getMe())`
   - убрать `MOCK_CREDENTIALS`, `sessionStorage`
3. `ProtectedRoute` → ждать `isLoading` из query
4. Все остальные хуки (departments, employees, onboarding) уже готовы
