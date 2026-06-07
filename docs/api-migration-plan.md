# План миграции с mock на реальный API

Документ описывает, как перевести фронт с in-memory mock-данных на реальный бэкенд **без переписывания UI**. Цель — минимизировать риск регрессий и держать рабочее приложение на каждом шаге.

> Last updated: 2026-06-07. Ветка `feat/add-api`. Шаг 1 (Auth) — выполнен.

---

## TL;DR

1. **Сейчас (этот этап):** код почищен от удалённых разделов (клиенты, чат, треки). Установлены `@tanstack/react-query` + `zod`. Создан скаффолд: `QueryClientProvider`, `queryKeys`, `schemas.ts`.
2. **Следующие сессии:** мигрируем по одному entity. Каждая миграция = новый PR.
3. **Порядок миграции:** `auth` → `courses (read)` → `enrollments` → `onboarding` → `company/control`.

---

## Что уже сделано

- ✅ Удалены `pages/clients`, `pages/chat`, `pages/complete-registration`, `entities/invite`
- ✅ Удалён `UserType = 'CLIENT'`, `CourseType = 'client'`, `isService`, `canManageClients`, `canAssignToClients`
- ✅ `UserContext` очищен от invite-логики
- ✅ Сайдбар без пунктов «Клиенты» и «Чат»
- ✅ `Providers` обёрнут `QueryClientProvider` с дефолтами + devtools в dev
- ✅ Скаффолд `shared/lib/query/queryKeys.ts` (центральный реестр ключей)
- ✅ Скаффолд `shared/api/schemas.ts` (zod-схемы для границы API)
- ✅ **Шаг 1 — Auth:** `UserContext` переведён на реальный API
  - `login` → `POST /auth/login` + `refetchQueries(auth.me)`
  - `logout` → `POST /auth/logout` + `navigate('/login')` + `queryClient.clear()`
  - Текущий пользователь: `GET /auth/me` → `GET /employees/{id}` → `GET /divisions/{id}` → `GET /departments/{id}` (+ positions)
  - axios interceptor: `/auth/me` 401 не триггерит refresh (предотвращает редирект-петлю)
  - Схема `MeResponseDtoSchema` добавлена в `schemas.ts`
  - `EmployeeProfile.birthDate` и `position` — опциональные (API не возвращает birthDate)

---

## Архитектурные решения

### Кто держит серверный стейт

**Раньше:** `CoursesContext`, `OnboardingContext` хранили `useState` массивы и сами их мутировали. Эти контексты становятся источником проблем при API: гонки, stale-данные, ручные инвалидации.

**Теперь:** server-state живёт в **TanStack Query cache**.
- `useQuery` отдаёт данные + статус загрузки/ошибки.
- `useMutation` + `invalidateQueries` обновляет кэш.
- React Context остаётся только для:
  - auth (текущий пользователь — он на каждой странице нужен синхронно),
  - UI-state, который не приходит с сервера (модалки, фильтры).

### Layout слоя API

```
src/
├── shared/
│   ├── api/
│   │   ├── axios.ts          # инстанс + refresh-интерцептор (уже есть)
│   │   └── schemas.ts        # zod-схемы DTO (заглушки сейчас)
│   └── lib/query/
│       └── queryKeys.ts      # центральные ключи кэша
└── entities/
    └── <name>/
        ├── api/
        │   ├── <name>Api.ts  # CRUD-функции: get, create, update
        │   └── hooks.ts      # useQuery / useMutation хуки поверх API
        └── model/
            └── types.ts      # frontend-типы (производные от zod-схем)
```

Хуки **в `entities/<name>/api/hooks.ts`** — это контракт для UI. Страница импортирует `useCoursesQuery()`, а не дёргает axios напрямую.

### Auth: refresh-интерцептор

Уже работает (см. `shared/api/axios.ts`). Когда появится реальный `/auth/refresh`:
- Cookies `accessToken` + `refreshToken` ставит бэкенд (`Set-Cookie`).
- Browser сам прикладывает их (`withCredentials: true`).
- При 401 → POST `/auth/refresh` → ретрай.

**Что менять в UserContext:** убрать `MOCK_CREDENTIALS`, `sessionStorage`, `register/verifyEmail` localStorage-логику. `login()` → `POST /auth/login`. `useAuth().user` → `useQuery({ queryKey: queryKeys.auth.me, queryFn: () => api.get('/auth/me') })`.

---

## Контракт API (заглушка — согласовать с бэкендом)

Ниже черновик эндпоинтов из текущей mock-поверхности. Используется как чеклист.

### Auth
| Method | Path | Цель |
|--------|------|------|
| POST | `/auth/login` | Логин по email+password. Ставит cookies. |
| POST | `/auth/register` | Регистрация EMPLOYEE. |
| POST | `/auth/verify-email` | Подтверждение email по токену. |
| POST | `/auth/refresh` | Обновить access token. |
| POST | `/auth/logout` | Очистить cookies. |
| GET  | `/auth/me` | Текущий пользователь. |
| PATCH| `/users/me/avatar` | Обновить аватар. |

### Courses
| Method | Path | Цель |
|--------|------|------|
| GET    | `/courses` | Список курсов (фильтрация по роли — на бэке). |
| GET    | `/courses/:id` | Детали курса с модулями/шагами/элементами. |
| POST   | `/courses` | Создать курс. |
| POST   | `/courses/:id/approve` | Опубликовать (admin). |
| POST   | `/courses/:id/reject` | Вернуть в draft (admin). |
| POST   | `/courses/:id/enroll` | Сам пользователь подаёт заявку. |
| POST   | `/courses/:id/assign` | Назначить курс другому (canAssignCourse). |
| GET    | `/courses/:id/enrollments` | Все записи на курс. |
| GET    | `/courses/:id/requests` | Заявки на одобрение. |
| POST   | `/courses/:id/requests/:userId/approve` | Одобрить заявку. |
| POST   | `/courses/:id/requests/:userId/reject` | Отклонить заявку. |
| POST   | `/courses/:id/items/:itemId/complete` | Отметить элемент пройденным. |
| GET    | `/users/me/enrollments` | Мои записи на курсы. |
| GET    | `/users/assignable` | Список сотрудников для назначения. |

### Onboarding
| Method | Path | Цель |
|--------|------|------|
| GET    | `/onboarding/templates` | Шаблоны (видимые мне). |
| POST   | `/onboarding/templates` | Создать шаблон. |
| PATCH  | `/onboarding/templates/:id` | Редактировать. |
| POST   | `/onboarding/templates/:id/assign` | Назначить шаблон сотруднику. |
| GET    | `/onboarding/assignments/mine` | Мои назначения. |
| GET    | `/onboarding/assignments/managed` | Назначения, которые я создал. |
| GET    | `/onboarding/assignments/:id` | Детали назначения. |
| POST   | `/onboarding/assignments/:id/steps/:stepId/complete` | Отметить шаг. |
| POST   | `/onboarding/assignments/:id/steps/:stepId/feedback` | Оставить фидбэк. |
| GET    | `/onboarding/assignments/:id/messages` | История чата. |
| POST   | `/onboarding/assignments/:id/messages` | Отправить сообщение. |

### Company / Control
| Method | Path | Цель |
|--------|------|------|
| GET    | `/company/org` | Дерево департамент → отдел → должность → сотрудники. |
| POST   | `/company/departments` | Добавить департамент. |
| POST   | `/company/divisions` | Добавить отдел. |
| POST   | `/company/invites` | Пригласить сотрудника по email. |
| GET    | `/company/invites` | Список инвайтов. |
| GET    | `/admin/enrollments` | Плоский список записей для страницы контроля. Скоупинг — на бэке по роли. |

> **Важно:** скоупинг (admin видит всё, dept_head — свой департамент и т.д.) делает бэкенд. Фронт не пытается фильтровать. Это убирает дублирование логики.

---

## Пошаговый план миграции

Каждый шаг = отдельная сессия / PR. Между шагами приложение остаётся рабочим (на mock для немигрированных частей).

### Шаг 1 — Auth
1. Реализовать `/auth/login`, `/auth/me`, `/auth/logout` на бэке.
2. Переписать `UserContext`:
   - `login` → `api.post('/auth/login', ...)` + invalidate `queryKeys.auth.me`.
   - Источник user: `useQuery(queryKeys.auth.me, () => api.get('/auth/me'))`.
   - Удалить `MOCK_CREDENTIALS`, `sessionStorage`, `register/verifyEmail` mock.
3. Обновить `ProtectedRoute`: ждать `isLoading` из query.

**Прохожу когда:** логин/логаут работают, refresh при 401 не выкидывает на /login.

### Шаг 2 — Courses (read-only)
1. Эндпоинты `GET /courses`, `GET /courses/:id`, `GET /users/me/enrollments`.
2. `entities/course/api/hooks.ts`:
   - `useCoursesQuery()`, `useCourseQuery(id)`, `useMyEnrollmentsQuery()`.
3. Заменить в `CoursesContext` `useState` на `useCoursesQuery`.

**Прохожу когда:** список курсов и страница курса грузятся с бэка, мои записи отображаются.

### Шаг 3 — Courses (write)
1. Мутации: enroll, assign, approve/reject, markItemComplete, request/approve/reject.
2. После каждой мутации — `invalidateQueries` на нужные ключи.
3. Можно добавить optimistic update для `markItemComplete` (прогресс должен реагировать мгновенно).

**Прохожу когда:** прохождение курсов работает end-to-end (включая выдачу сертификата).

### Шаг 4 — Onboarding
1. Шаблоны + назначения + шаги.
2. Чат: пока polling (`refetchInterval: 5000`) — позже WebSocket. Хук `useOnboardingMessages(assignmentId)`.

### Шаг 5 — Company + Control
1. `GET /company/org`, `POST /company/invites`.
2. `GET /admin/enrollments` — для страницы контроля. Удалить локальный скоупинг по роли.

### Шаг 6 — Чистка
- Удалить mock-API файлы из `entities/*/api/*Api.ts` (или оставить как dev-fixtures для Storybook).
- Удалить `Contexts`, ставшие пустыми обёртками вокруг хуков.
- Финальный проход линтером.

---

## Полезные паттерны

### Шаблон API-функции

```ts
// entities/course/api/courseApi.ts
import { api } from '@shared/api/axios';
import { CourseSummarySchema } from '@shared/api/schemas';

export const courseApi = {
  list: async () => {
    const { data } = await api.get('/courses');
    return CourseSummarySchema.array().parse(data);
  },
  // ...
};
```

### Шаблон хука

```ts
// entities/course/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import { courseApi } from './courseApi';

export function useCoursesQuery() {
  return useQuery({
    queryKey: queryKeys.courses.list(),
    queryFn: courseApi.list,
  });
}

export function useEnrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId }: { courseId: string }) => courseApi.enroll(courseId),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
      qc.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
  });
}
```

### Когда оставить Context

- **Auth user**: должен быть синхронно доступен везде (часть рендера зависит от роли). Контекст оборачивает `useQuery(auth.me)` и отдаёт уже распакованный `user`.
- **UI-state**: открытые модалки, активный фильтр, выбранный таб. Не сервер-стейт.

---

## Риски и как смягчить

| Риск | Митигация |
|------|-----------|
| Бэк ещё не готов, фронт не может развиваться | Mock-API остаются как есть, мигрируем по одному entity. Контракт согласуем заранее. |
| Бэк переименует поле — прод сломается | Zod-схемы парсят ответы. Ошибка вылетит сразу в dev/staging. |
| `useQuery` + `useState` гонки во время миграции | Запрещаем смешивать в одном компоненте: либо хук Query, либо локальный state. Сначала миграция контекста, потом — потребителей. |
| Refresh-токен race condition (5 одновременных 401) | Уже решено через очередь в `axios.ts:34-43`. |

---

## Что трогать НЕ нужно

- `shared/api/axios.ts` — interceptor уже верный, под cookies-auth.
- FSD-структура — она хорошо ложится под query-хуки.
- UI компоненты — основной рефакторинг на уровне entities, не страниц.
