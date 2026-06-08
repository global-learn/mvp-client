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
| GET | /courses/{id}/enrollments | ✅ courseRealApi.getCourseEnrollmentDtos → getCourseEnrollments |

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

Загрузка вопросов через `GET /test-definitions/{id}` реализована, включая `passingPercent`. Attempt-флоу (submit/score) не реализован.

| Метод | Endpoint | Статус |
|-------|----------|--------|
| GET | /test-definitions/{id} | ✅ testDefApi.getById → useTestDefinitionQuery → TestPlayer (вкл. passingPercent) |
| POST | /tests/{testId}/attempts | ❌ не реализован |
| GET | /attempts/{id} | ❌ не реализован |
| POST | /attempts/{id}/answers | ❌ не реализован |
| POST | /attempts/{id}/finish | ❌ не реализован |

> Тест отображается корректно, порог прохождения берётся из бэкенда. Результат пишется только в completedItems (без attempt-попытки на бэкенде).

---

### ✅ Onboarding — полностью на реальном API

| Метод | Endpoint | Статус |
|-------|----------|--------|
| POST | /onboarding/templates | ✅ onboardingRealApi.createTemplate |
| GET | /onboarding/templates | ✅ onboardingRealApi.getTemplates → OnboardingContext |
| GET | /onboarding/templates/{id} | ✅ onboardingRealApi.getTemplateById |
| POST | /onboardings | ✅ onboardingRealApi.assign → OnboardingContext |
| GET | /onboardings/mine | ✅ onboardingRealApi.getMyOnboardings → myAssignments |
| GET | /onboardings/assigned-by-me | ✅ onboardingRealApi.getManagedOnboardings → managedAssignments |
| GET | /onboardings | ✅ onboardingRealApi.getAllOnboardings → allAssignments (admin only) |
| GET | /onboardings/{id} | ✅ onboardingRealApi.getOnboardingById |
| POST | /onboardings/{id}/complete-step | ✅ onboardingRealApi.completeStep |
| POST | /onboardings/{id}/chat/messages | ✅ onboardingRealApi.sendChatMessage |
| GET | /onboardings/{id}/chat/messages | ✅ onboardingRealApi.getChatMessages |

---

### ❌ Control (статистика) — полностью mock

| Что нужно | Статус |
|-----------|--------|
| Агрегация enrollments по роли | ❌ нет эндпоинта в swagger |
| ControlPage → controlApi.ts | ❌ mock |

> Нет эндпоинта в swagger. Либо бэкенд добавит, либо строим из /employees + /me/enrollments на клиенте.

---

## Что сломано / работает некорректно прямо сейчас

1. **Тест-плеер attempt flow** — вопросы и `passingPercent` загружаются через реальный API, но результат не записывается на бэкенде (нет attempt). Шаг помечается завершённым сразу через `completeStep`.

2. **`approveCourse` / `rejectCourse`** — noop. Нет эндпоинта изменения статуса курса в swagger (нет `status` в `PATCH /courses/{id}`).

3. **Онбординг — сообщения чата** — при загрузке назначения сообщения начинаются с пустого списка. Исторические сообщения не подгружаются (нет вызова `getChatMessages` при инициализации). Новые сообщения, отправленные в текущей сессии, отображаются корректно.

4. **Онбординг — divisionName** — поле `divisionName` в `OnboardingAssignment` будет пустой строкой, так как `EmployeeDto` содержит только `divisionId` (без названия отдела). Бэкенд может решить, добавив `division: {id, name}` в `EmployeeResponseDto`.

---

## Следующие задачи (приоритет)

### А: Test Attempts (опционально)

```
POST /tests/{testId}/attempts     → начать попытку при старте теста
POST /attempts/{id}/answers       → каждый ответ пользователя
POST /attempts/{id}/finish        → завершить, получить score
```

> Вопросы и passingPercent уже загружаются. Нужно заменить client-side scoring на серверный attempt-флоу.

### Б: Cleanup (финал)

- Удалить `courseApi.ts` (mock) — больше не импортируется нигде.
- Удалить `onboardingApi.ts` (mock) — больше не импортируется в Context.

---

## Технические долги

| Файл | Проблема |
|------|----------|
| `courseApi.ts` | Файл-заглушка — больше не импортируется. Можно удалить. |
| `onboardingApi.ts` | Файл-заглушка — больше не импортируется в Context. Можно удалить. |
| `controlApi.ts` | Полностью mock — нет эндпоинтов в swagger |
| `CourseBuilder` | Не поддерживает редактирование существующего курса (только создание) |
| `OnboardingContext` | `divisionName` пустая строка — `EmployeeDto` не возвращает название отдела |
| `OnboardingContext` | Исторические сообщения чата не загружаются при инициализации |

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
