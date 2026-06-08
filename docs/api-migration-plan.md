# API Migration Plan — Global Learn

> Ветка `feat/add-api`. Последнее обновление: 2026-06-08.
> Документ для внутреннего использования — описывает текущий статус и что осталось.

---

## Статус по endpoint'ам

### ✅ Auth — полностью готово

| Метод | Endpoint | Статус |
|-------|----------|--------|
| POST | /auth/login | ✅ |
| POST | /auth/logout | ✅ |
| GET | /auth/me | ✅ |
| POST | /auth/refresh | ✅ (interceptor) |
| POST | /auth/register | ✅ |
| POST | /auth/complete-registration | ✅ |
| POST | /auth/change-password | ✅ |

---

### ✅ Company — API функции готовы

| Метод | Endpoint | Статус |
|-------|----------|--------|
| GET/POST/PATCH/DELETE | /departments | ✅ companyApi.ts |
| GET/POST/PATCH/DELETE | /divisions | ✅ companyApi.ts |
| GET/POST/PATCH/DELETE | /positions | ✅ companyApi.ts |
| GET | /positions/tree | ✅ companyApi.ts |

---

### ✅ Employees — API функции готовы

| Метод | Endpoint | Статус |
|-------|----------|--------|
| GET | /employees | ✅ employeeApi.ts |
| GET | /employees/{id} | ✅ employeeApi.ts |
| GET | /employees/me/subordinates | ✅ employeeApi.ts |
| POST | /employees | ✅ employeeApi.ts |
| PATCH | /employees/{id} | ✅ employeeApi.ts |
| PATCH | /employees/{id}/promote | ✅ employeeApi.ts |
| DELETE | /employees/{id} | ✅ employeeApi.ts |

---

### ✅ Courses (read) — готово

| Метод | Endpoint | Статус |
|-------|----------|--------|
| GET | /courses | ✅ courseRealApi → useCoursesQuery |
| GET | /courses/{id} | ✅ courseRealApi → useCourseQuery / getCourseWithModules |
| GET | /me/enrollments | ✅ courseRealApi → useMyEnrollmentDtosQuery |
| GET | /enrollments/{id} | ✅ enrollmentWriteApi.getById |

---

### ✅ Courses (write / создание) — готово

| Метод | Endpoint | Статус |
|-------|----------|--------|
| POST | /files | ✅ fileApi.upload (обложка) |
| GET | /files/{id} | — не нужен (URL приходит в ответе POST) |
| DELETE | /files/{id} | — не реализован |
| POST | /courses | ✅ courseWriteApi.create |
| PATCH | /courses/{id} | ✅ courseWriteApi.update |
| DELETE | /courses/{id} | — не реализован в UI |
| POST | /courses/{id}/modules | ✅ courseWriteApi.addModule |
| DELETE | /courses/{id}/modules/{moduleId} | ✅ courseWriteApi.deleteModule |
| POST | /courses/{id}/modules/{moduleId}/steps | ✅ courseWriteApi.addStep |
| DELETE | /courses/{id}/modules/{moduleId}/steps/{stepId} | ✅ courseWriteApi.deleteStep |
| POST | /lessons | ✅ lessonApi.create |
| PATCH | /lessons/{id} | — не реализован |
| DELETE | /lessons/{id} | ✅ lessonApi.delete |
| POST | /test-definitions | ✅ testDefApi.create |
| GET | /test-definitions/{id} | ❌ нужен для плеера |
| PATCH | /test-definitions/{id} | — не реализован |
| DELETE | /test-definitions/{id} | ✅ testDefApi.delete |
| POST | /test-definitions/{id}/questions | ✅ testDefApi.addQuestion |
| DELETE | /test-definitions/{id}/questions/{questionId} | — не реализован |
| POST | /courses/{id}/questions | ✅ questionApi.create |
| GET | /courses/{id}/questions | — не реализован |
| DELETE | /questions/{id} | — не реализован |

---

### ✅ Enrollments / Applications — реализовано

| Метод | Endpoint | Статус |
|-------|----------|--------|
| POST | /courses/{id}/enroll | ✅ courseWriteApi.enrollEmployee → enroll (self) + assignCourse |
| POST | /courses/{id}/applications | ✅ courseWriteApi.applyForCourse → requestEnrollment |
| GET | /courses/{id}/applications | ✅ courseWriteApi.getApplications → getCourseRequests |
| GET | /me/applications | — не реализован |
| PATCH | /courses/{id}/applications/{appId}/approve | ✅ lookup appId → approveEnrollmentRequest |
| PATCH | /courses/{id}/applications/{appId}/reject | ✅ lookup appId → rejectEnrollmentRequest |
| DELETE | /enrollments/{id} | — не реализован |
| POST | /enrollments/{id}/steps/{stepId}/complete | ✅ enrollmentWriteApi.completeStep → markItemComplete |
| POST | /enrollments/{id}/steps/{stepId}/start | — не реализован |

---

### ⚠️ Test Attempts — частично

Загрузка вопросов через `GET /test-definitions/{id}` реализована. Attempt-флоу (submit/score) не реализован.

| Метод | Endpoint | Статус |
|-------|----------|--------|
| GET | /test-definitions/{id} | ✅ testDefApi.getById → useTestDefinitionQuery → TestPlayer lazy-load |
| POST | /tests/{testId}/attempts | ❌ не реализован |
| GET | /attempts/{id} | ❌ не реализован |
| POST | /attempts/{id}/answers | ❌ не реализован |
| POST | /attempts/{id}/finish | ❌ не реализован |

> Тест отображается корректно. Результат пишется только в completedItems (без attempt-попытки на бэкенде).

---

### ❌ Onboarding READ — нет эндпоинтов в бэкенде

В swagger только POST-эндпоинты. Контекст полностью на mock.

| Метод | Endpoint | Статус |
|-------|----------|--------|
| POST | /onboarding/templates | ✅ onboardingRealApi.ts (не подключён к контексту) |
| POST | /onboardings | ✅ onboardingRealApi.ts (не подключён к контексту) |
| POST | /onboardings/{id}/complete-step | ✅ onboardingRealApi.ts (не подключён к контексту) |
| POST | /onboardings/{id}/chat/messages | ✅ onboardingRealApi.ts (не подключён к контексту) |
| GET | /onboarding/templates | ❌ эндпоинт отсутствует в бэкенде |
| GET | /onboardings | ❌ эндпоинт отсутствует в бэкенде |

> Ждём GET-эндпоинты от бэкенда. Когда появятся — подключить onboardingRealApi к OnboardingContext.

---

### ❌ Control (статистика) — полностью mock

| Что нужно | Статус |
|-----------|--------|
| Агрегация enrollments по роли | ❌ нет эндпоинта в swagger |
| ControlPage → controlApi.ts | ❌ mock |

> Нет эндпоинта в swagger. Либо бэкенд добавит, либо строим из /employees + /me/enrollments на клиенте.

---

## Что сломано / работает некорректно прямо сейчас

1. **Тест-плеер attempt flow** — вопросы загружаются через реальный API, но результат не записывается на бэкенде (нет attempt). Шаг помечается завершённым сразу через `completeStep`.

2. **`getCourseEnrollments`** — mock. Нет прямого эндпоинта для списка записей по курсу.

3. **`approveCourse` / `rejectCourse`** — mock. Нет эндпоинта в swagger.

4. **Статистика в CourseDetailPage** — имена пользователей в таблице enrollments показываются как `userId` (нет batch lookup API).

5. **Онбординг** — весь на mock. Ждём GET эндпоинты от бэкенда.

---

## Следующие задачи (приоритет)

### А: Test Attempts (опционально)

```
POST /tests/{testId}/attempts     → начать попытку при старте теста
POST /attempts/{id}/answers       → каждый ответ пользователя
POST /attempts/{id}/finish        → завершить, получить score
```

> Вопросы уже загружаются. Нужно заменить client-side scoring на серверный attempt-флоу.

### Б: Онбординг (ждём бэкенд GET-эндпоинты)

Подключить `onboardingRealApi` к `OnboardingContext`, когда появятся:
- `GET /onboarding/templates`
- `GET /onboardings`

### В: Cleanup (финал)

- Удалить `courseApi.ts` (mock) — остались `getCourseEnrollments`, `approveCourse`, `rejectCourse`.
- Удалить `MOCK_USER_INFO` из `CourseDetailPage` (остался только в stats panel, нужен batch endpoint).
- Удалить `onboardingApi.ts` (mock) — после Б.

---

## Технические долги

| Файл | Проблема |
|------|----------|
| `CoursesContext.tsx` | Импортирует `courseApi` (mock) для 3 операций: getCourseEnrollments, approveCourse, rejectCourse |
| `CourseDetailPage.tsx` | `MOCK_USER_INFO` используется только в stats panel (нет batch-endpoint на бэкенде) |
| `OnboardingContext.tsx` | Весь на `onboardingApi` (mock) — ждём GET-эндпоинты |
| `controlApi.ts` | Полностью mock — нет эндпоинтов в swagger |
| `CourseBuilder` | Не поддерживает редактирование существующего курса (только создание) |

---

## Архитектурные решения (зафиксировано)

- Server-state в TanStack Query cache, не в useState.
- Контексты только для: auth user (синхронный доступ везде) + UI-state.
- Zod-схемы валидируют ответ на границе API в `*Api.ts`, не в компонентах.
- `queryKeys.ts` — единый реестр ключей, инвалидация по namespace (`queryKeys.courses.all`).
- Cookie-based auth: `withCredentials: true`, auto-refresh через axios interceptor.
- Vite proxy: `/api` → `http://localhost:3000` (CORS + cookies в dev).
- Backend `employeeId` = auth `userId` (один UUID, проверено через `/employees/{me.id}`).
- `enrollment.userId` хранит `employeeId` (не auth userId) — `getEnrollment` сравнивает с `user.employee.id`.
