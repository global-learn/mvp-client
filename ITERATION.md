# ITERATION — Полный анализ клиент vs бэкенд

> Swagger-источник: `docs-json.json`. Анализ на: 2026-06-09.

---

## 1. Departments ✅ РЕАЛИЗОВАНО

| Endpoint | API-метод | Hook | UI |
|---|---|---|---|
| `GET /departments` | ✅ `departmentApi.list` | ✅ `useDepartmentsQuery` | ✅ показывается в дереве |
| `GET /departments/:id` | ✅ `departmentApi.getById` | ✅ `useDepartmentQuery` | — не требуется |
| `POST /departments` | ✅ `departmentApi.create` | ✅ `useCreateDepartmentMutation` | ✅ inline-форма (admin only) |
| `PATCH /departments/:id` | ✅ `departmentApi.update` | ✅ `useUpdateDepartmentMutation` | ✅ inline rename в DepartmentList (admin) |
| `DELETE /departments/:id` | ✅ `departmentApi.delete` | ✅ `useDeleteDepartmentMutation` | ✅ inline confirm-delete (admin) |

---

## 2. Divisions ✅ РЕАЛИЗОВАНО

| Endpoint | API-метод | Hook | UI |
|---|---|---|---|
| `GET /divisions` | ✅ `divisionApi.list` | ✅ `useDivisionsQuery` | ✅ показывается в дереве |
| `GET /divisions/:id` | ✅ `divisionApi.getById` | ✅ `useDivisionQuery` | — не требуется |
| `POST /divisions` | ✅ `divisionApi.create` | ✅ `useCreateDivisionMutation` | ✅ inline-форма в DepartmentList |
| `PATCH /divisions/:id` | ✅ `divisionApi.update` | ✅ `useUpdateDivisionMutation` | ✅ inline rename в DepartmentList (admin) |
| `DELETE /divisions/:id` | ✅ `divisionApi.delete` | ✅ `useDeleteDivisionMutation` | ✅ inline confirm-delete (admin) |

---

## 3. Positions ✅ РЕАЛИЗОВАНО

| Endpoint | API-метод | Hook | UI |
|---|---|---|---|
| `GET /positions` | ✅ `positionApi.list` | ✅ `usePositionsQuery` | ✅ дерево в вкладке «Должности» + select при создании сотрудника |
| `GET /positions/tree` | ✅ `positionApi.tree` | ✅ `usePositionTreeQuery` | ✅ иерархия строится на клиенте из flat-списка |
| `GET /positions/:id` | ✅ `positionApi.getById` | ✅ `usePositionQuery` | — не требуется |
| `POST /positions` | ✅ `positionApi.create` | ✅ `useCreatePositionMutation` | ✅ вкладка «Должности» → кнопка «Добавить должность» + выбор родителя |
| `PATCH /positions/:id` | ✅ `positionApi.update` | ✅ `useUpdatePositionMutation` | ✅ inline rename в списке должностей |
| `DELETE /positions/:id` | ✅ `positionApi.delete` | ✅ `useDeletePositionMutation` | ✅ inline confirm-delete |

**Роли:** вкладка «Должности» отображается только для `admin`. Rename/delete доступны только `admin`.

---

## 4. Employees

| Endpoint | API-метод | Hook | UI |
|---|---|---|---|
| `GET /employees` | ✅ `employeeApi.list` (+ `departmentId`, `roleId` фильтры) | ✅ `useEmployeesQuery` | ✅ список + фильтры по роли/департаменту |
| `GET /employees/:id` | ✅ `employeeApi.getById` | ✅ `useEmployeeQuery` | ✅ клик → модалка «Карточка сотрудника» |
| `GET /employees/me/subordinates` | ✅ `employeeApi.getSubordinates` | ✅ `useMySubordinatesQuery` | ❌ нигде не используется |
| `POST /employees` | ✅ `employeeApi.create` | ✅ `useCreateEmployeeMutation` | ✅ модалка «Добавить сотрудника» |
| `PATCH /employees/:id` | ✅ `employeeApi.update` (+ `avatarId`) | ✅ `useUpdateEmployeeMutation` | ✅ форма редактирования в карточке (admin) + загрузка аватара в профиле |
| `PATCH /employees/:id/promote` | ✅ `employeeApi.promote` | ✅ `usePromoteEmployeeMutation` | ❌ нет UI (promote = смена должности, не роли) |
| `DELETE /employees/:id` | ✅ `employeeApi.dismiss` | ✅ `useDismissEmployeeMutation` | ✅ кнопка «Уволить» с confirm в карточке (admin) |
| `POST /files` | ✅ `fileApi.upload` (в `shared/api/fileApi.ts`) | — | ✅ загрузка фото-аватара в ProfilePage → `AvatarPicker` |

**Вывод:** ✅ РЕАЛИЗОВАНО. Карточка сотрудника (просмотр/редактирование/увольнение), фильтры по роли и департаменту, загрузка аватара через `POST /files`.

---

## 5. Что есть в бэкенде, но не используется на клиенте вообще

| Endpoint | Статус | Комментарий |
|---|---|---|
| `GET /auth/me/profile` | ❌ не вызывается | Возвращает полный профиль (user + role + employee + division + dept + position). Используется только `GET /auth/me`. |
| `POST /auth/complete-registration` | ❌ не реализовано | Flow «приглашение по ссылке» — сотрудник устанавливает пароль по токену. Модель `invite/model/types.ts` есть, но помечена как «Mock до бэкенда». |
| `GET /roles/:id`, `POST /roles`, `DELETE /roles/:id` | ❌ не реализовано | Управление ролями. Сейчас только `GET /roles` для select. |
| `POST /user`, `GET /user`, `GET /user/:id` | ❌ не реализовано | Отдельный CRUD пользователей (без employee-обёртки). Назначение неочевидно при наличии `/employees`. |
| `GET /employees/me/subordinates` | ❌ нигде не применяется | Хук есть, но не вызывается ни на одной странице. |
| `GET /courses/{id}/analytics` | ❌ не вызывается | Детальная аналитика по курсу: разбивка по division/department. |

---

## 6. Чего не хватает на бэкенде

| Потребность | Статус бэкенда | Комментарий |
|---|---|---|
| Фильтр сотрудников по роли | ✅ реализован | `GET /employees` принимает `roleId`. Клиентская фильтрация в `CompanyPage`. |
| Фильтр сотрудников по департаменту | ✅ реализован | `GET /employees` принимает `departmentId`. Клиентская фильтрация по `department.id`. |
| Загрузка аватара сотрудника | ✅ реализовано | `POST /files` → `PATCH /employees/:id` с `avatarId`. `AvatarPicker` подключён к реальному API. |
| Поиск сотрудников (full-text) | ❌ отсутствует | Нет query-параметра `search` на `GET /employees`. |
| Подтверждение онбординга шага с фидбеком | ⚠️ уточнить | `POST /onboardings/{id}/complete-step` — нет поля для комментария/фидбека в теле запроса, хотя CLAUDE.md описывает это как фичу. |

---

## 7. Полезные фичи, которые стоит добавить (предложения)

### 7.1 Карточка/профиль сотрудника (drawer или страница)
Открывается по клику на сотрудника в списке или дереве.
- Использует `GET /employees/:id`
- Показывает: ФИО, email, роль, отдел/дивизия, должность, дата трудоустройства
- Кнопки: «Редактировать», «Повысить», «Уволить» — только для admin/dept_head/div_head

### 7.2 Inline-управление структурой (edit + delete)
В `DepartmentList` добавить карандаш/корзину рядом с названием департамента и отдела.
- Rename в месте (inline input)
- Delete с confirm-диалогом
- API и хуки уже готовы

### 7.3 Раздел «Должности» на странице Компании (новая вкладка)
Третья вкладка «Должности» рядом с «По отделам» / «Сотрудники».
- Таблица / дерево должностей (`GET /positions/tree`)
- Кнопка «Добавить», inline-rename, удаление
- API и хуки уже готовы

### 7.4 Flow «Пригласить по ссылке»
Заменяет текущий вариант с паролем при создании сотрудника.
- Admin создаёт сотрудника без пароля → бэкенд генерирует invite-токен
- Сотрудник переходит по ссылке `/complete-registration?token=...` → страница `register` → `POST /auth/complete-registration`
- Нужна страница `/complete-registration` (маршрут + форма установки пароля)
- Бэкенд: эндпоинт `POST /auth/complete-registration` уже есть

### 7.5 Уведомления (нотификации)
`notificationApi` реализован, Sidebar уже рендерит список, но:
- Нет TanStack Query — данные грузятся вручную через `useState/useEffect` (нет refetch, no stale)
- Нет polling или SSE для real-time (допустимо сделать polling каждые 30 с)
- Нет счётчика непрочитанных в иконке sidebar

### ~~7.7~~ Архивация курса ✅ Выполнено

---

### 7.6 Детальная аналитика по курсу
На странице курса (для admin/managers) добавить вкладку «Аналитика»:
- Использует `GET /courses/:id/analytics`
- Показывает разбивку завершивших по отделам/департаментам

---

---

---

# Education — Курсы и обучение

---

## 9. Course — CRUD и структура ✅ РЕАЛИЗОВАНО

| Endpoint | API-метод | UI |
|---|---|---|
| `GET /courses` | ✅ `courseRealApi.list` | ✅ CoursesListPage, CoursesContext |
| `GET /courses/:id` | ✅ `courseRealApi.getById` | ✅ CourseDetailPage, CoursePlayerPage |
| `POST /courses` | ✅ `courseWriteApi.create` | — (теперь используется только как fallback) |
| `POST /courses/full` | ✅ `courseWriteApi.createFull` | ✅ CourseBuilder → CoursesContext.createCourse (атомарное создание) |
| `PATCH /courses/:id` | ✅ `courseWriteApi.update` | ✅ CourseBuilder (обновление обложки/метаданных) |
| `DELETE /courses/:id` | ✅ `courseWriteApi.delete` | ✅ CourseDetailPage — кнопка «Удалить курс» (admin / автор курса) |
| `PATCH /courses/:id/archive` | ✅ `courseWriteApi.archive` | ✅ CourseDetailPage — кнопка «В архив» (admin/автор) |
| `PATCH /courses/:id/unarchive` | ✅ `courseWriteApi.unarchive` | ✅ CourseDetailPage — кнопка «Из архива» (admin/автор) |
| `POST /courses/:id/modules` | ✅ `courseWriteApi.addModule` | ✅ CourseBuilder |
| `DELETE /courses/:id/modules/:moduleId` | ✅ `courseWriteApi.deleteModule` | ✅ CourseBuilder |
| `POST /courses/:id/modules/:moduleId/steps` | ✅ `courseWriteApi.addStep` | ✅ CourseBuilder |
| `DELETE /courses/:id/modules/:moduleId/steps/:stepId` | ✅ `courseWriteApi.deleteStep` | ✅ CourseBuilder |

**Атомарное создание курса (B6 закрыт):** `CoursesContext.createCourse` переработан:
1. Все уроки и тест-определения создаются параллельно (`Promise.all`)
2. Обложка загружается (`POST /files`)
3. Курс со всей структурой создаётся одним атомарным вызовом `POST /courses/full`
4. Вопросы добавляются к тестам уже после создания курса (требуют `courseId`)

Если шаги 1–2 упадут — курс не создаётся вовсе (нет частично собранной структуры).
`passingPercent` теперь корректно передаётся при создании тест-определения.

**Удаление курса (U4 закрыт):** кнопка «Удалить курс» в `CourseDetailPage`:
- Видна только admin и автору курса
- Двухшаговый confirm (кнопка → «Удалить навсегда?» + «Отмена»)
- После удаления — редирект на `/courses`

**Архивация (7.7 закрыт):**
- Кнопка «В архив» / «Из архива» рядом с «Удалить» — видна только admin/автору
- Архивированные курсы не отображаются обычным пользователям (`GET /courses` без `includeArchived`)
- Для admin/автора: запрос идёт с `includeArchived=true`, архивные курсы видны только им
- Видимость архивных курсов обрабатывается в `isCourseVisibleToUser` в CoursesContext
- На странице курса — бейдж «Архив», кнопка «Назначить» скрыта для архивных курсов
- На странице списка — архивные курсы вынесены в отдельный блок «Архив» внизу (только для автора/admin)

**Страница списка курсов — «Мои курсы» (переработано):**
- Секция делится на две: «Прохожу» (enrolled) и «Создал» (authored, не enrolled)
- Authored courses с отдельным стилем: синий значок карандаша, highlight-бордер, бейдж «Вы автор»
- Курсы, где пользователь и автор, и слушатель, показываются в «Прохожу» с бейджем «Автор»
- Sub-labels «Прохожу» / «Создал» выделены вертикальной цветной полоской (border-left), хорошо различимы

**Исправленные баги (пост-реализация):**
- `isArchived: boolean` — бэкенд возвращает это поле вместо `status: 'archived'`; добавлено в Zod-схемы, маппер теперь: `dto.isArchived === true ? 'archived' : mapStatus(dto.status)`
- `authorId` сравнение — бэкенд хранит employee ID, а не auth account ID; все проверки `authorId === user.id` заменены на `authorId === user.id || authorId === user.employee?.id`
- `author` nested object — бэкенд возвращает `author: {id, fullname, avatarId}` вместо плоского `authorId`; добавлена `CourseAuthorDtoSchema`, `authorId` теперь опциональный
- `completedSet` пуст при первом рендере — `/me/enrollments` возвращает `progress: []`; теперь `completedSet` строится как объединение `enrollment.completedItems` И `step.isCompleted` из данных курса (которые возвращает `GET /courses/:id`)
- Кнопка «Начать курс» вместо «Продолжить» при уже имеющемся прогрессе — исправлено вышеуказанным фиксом `completedSet`
- После `markItemComplete` данные курса (шаги `isCompleted`) не обновлялись — добавлена инвалидация `queryKeys.courses.detail(courseId)`
- Шаг можно было повторно отметить выполненным (кнопка «Отметить» не скрывалась) — исправлено фиксом `completedSet`

**Редактирование курса:**
- Добавлена кнопка «Редактировать» на `CourseDetailPage` для admin/автора (кроме архивных)
- Inline-форма редактирования: название, описание, область видимости (departmentId/divisionId), обложка
- `updateCourse` реализован в `CoursesContext` через `PATCH /courses/:id`
- После сохранения инвалидируются оба ключа: `queryKeys.courses.all` и `queryKeys.courses.detail(courseId)`

**Прочее UI:**
- `CourseCard` теперь полностью кликабельная ссылка (`<Link>`) — нет отдельной кнопки «Открыть курс»
- Добавлен адаптив (responsive) для страницы списка курсов и страницы курса (`@media ≤768px`, `≤480px`)
- «Программа курса» — постоянная секция на странице курса (вне плеера): список модулей → шагов с прогрессом и типом

---

## 10. Course Analytics ✅ РЕАЛИЗОВАНО (детальная)

| Endpoint | API-метод | UI |
|---|---|---|
| `GET /courses/analytics` | ⚠️ вызывается в `controlApi`, но только для фильтрации | ⚠️ не дашборд |
| `GET /courses/:id/analytics` | ✅ `courseRealApi.getAnalytics` + `useCourseAnalyticsQuery` | ✅ `CourseDetailPage` — панель «Аналитика по подразделениям» |

**Реализовано:** Zod-схема `CourseAnalyticsDtoSchema` добавлена в `schemas.ts`. Hook `useCourseAnalyticsQuery` в `hooks.ts`. В `CourseDetailPage` для `canControl`-ролей отображается панель с разбивкой по департаментам и отделам (прогресс-бары, процент завершения, кол-во). Загружается параллельно с основными данными курса.

---

## 11. Lesson — Уроки

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /lessons` | ✅ `lessonApi.create` | ✅ при создании курса в CourseBuilder |
| `PATCH /lessons/:id` | ✅ `lessonApi.update` | ❌ **никогда не вызывается** |
| `DELETE /lessons/:id` | ✅ `lessonApi.delete` | ❌ **никогда не вызывается** |

**Критическая проблема:** после публикации курса отредактировать содержимое урока невозможно — `PATCH /lessons/:id` не вызывается ни в одном месте. Текущий CourseBuilder создаёт новые уроки, но нет режима редактирования существующего курса.

---

## 12. Test Definition — Тесты

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /test-definitions` | ✅ `testDefApi.create` | ✅ при создании курса |
| `GET /test-definitions/:id` | ✅ `testDefApi.getById` | ✅ CourseDetailPage (тест-плеер) |
| `PATCH /test-definitions/:id` | ✅ `testDefApi.update` — метода нет | ❌ не реализован в API-слое |
| `DELETE /test-definitions/:id` | ✅ `testDefApi.delete` | ❌ не вызывается из UI |
| `POST /test-definitions/:id/questions` | ✅ `testDefApi.addQuestion` | ✅ при создании курса |
| `DELETE /test-definitions/:id/questions/:questionId` | ❌ нет метода | ❌ не реализован |

---

## 13. Question Bank — Банк вопросов

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /courses/:id/questions` | ✅ `questionApi.create` | ✅ при создании курса |
| `GET /courses/:id/questions` | ❌ нет метода | ❌ нет UI просмотра банка |
| `DELETE /questions/:id` | ❌ нет метода | ❌ нет UI удаления вопроса |

**Вывод:** Банк вопросов — write-only с клиента. Просмотреть или удалить вопрос без пересоздания курса нельзя.

---

## 14. Test Attempt — Прохождение тестов

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /tests/:testId/attempts` | ✅ `testAttemptApi.start` | ✅ CourseDetailPage — возвращает ID существующей активной попытки вместо 409 |
| `GET /tests/:testId/attempts` | ✅ `testAttemptApi.getAttempts` | ❌ нет UI (список прошлых попыток) |
| `GET /attempts/:id` | ❌ нет метода | ❌ нельзя возобновить прерванную попытку |
| `POST /attempts/:id/answers` | ✅ `testAttemptApi.answer` | ✅ CourseDetailPage |
| `POST /attempts/:id/finish` | ✅ `testAttemptApi.finish` | ✅ CourseDetailPage |

**Бэкенд-фикс:** `POST /tests/:testId/attempts` теперь возвращает ID существующей активной попытки вместо 409 — повторное открытие теста больше не ломается.

**Проблема (A3):** При перезагрузке страницы во время теста попытка теряется. `GET /attempts/:id` позволил бы восстановить состояние, но не реализован.

---

## 15. Enrollment — Записи на курс

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /courses/:id/enroll` | ✅ `courseWriteApi.enrollEmployee` | ✅ AssignCourseModal (назначение) + автозапись в Player |
| `GET /courses/:id/enrollments` | ✅ `courseRealApi.getCourseEnrollmentDtos` | ✅ ControlPage (через controlApi) |
| `GET /me/enrollments` | ✅ `courseRealApi.getMyEnrollmentDtos` | ✅ CoursesContext |
| `GET /enrollments/:id` | ✅ `enrollmentWriteApi.getById` | ✅ CoursesContext (после completeStep) |
| `DELETE /enrollments/:id` | ❌ нет метода | ❌ нельзя отменить запись |
| `POST /enrollments/:id/steps/:stepId/start` | ❌ нет метода | ❌ шаг не помечается как «начатый» |
| `POST /enrollments/:id/steps/:stepId/complete` | ✅ `enrollmentWriteApi.completeStep` | ✅ CoursePlayerPage / CourseDetailPage |

**Вывод:** Прохождение работает. Нет отмены записи и старта шага (влияет на прогресс в аналитике).

---

## 16. Course Application — Заявки на курс

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /courses/:id/applications` | ✅ `courseWriteApi.applyForCourse` | ✅ EnrollButton → CoursesContext.requestEnrollment |
| `GET /courses/:id/applications` | ✅ `courseWriteApi.getApplications` | ✅ CourseDetailPage (модерация) |
| `PATCH /courses/:id/applications/:appId/approve` | ✅ `courseWriteApi.approveApplication` | ✅ CourseDetailPage |
| `PATCH /courses/:id/applications/:appId/reject` | ✅ `courseWriteApi.rejectApplication` | ✅ CourseDetailPage |
| `GET /me/applications` | ❌ нет метода | ❌ сотрудник не видит свои заявки |

**Проблема:** Сотрудник может подать заявку, но увидеть её статус (`pending_approval`/`rejected`) нигде нельзя — `GET /me/applications` не вызывается. Единственный индикатор — badge на кнопке курса.

---

---

# Onboarding — Онбординг

---

## 17. Templates — Шаблоны

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /onboarding/templates` | ✅ `onboardingRealApi.createTemplate` | ✅ TemplateModal → OnboardingManagePage |
| `GET /onboarding/templates` | ✅ `onboardingRealApi.getTemplates` | ✅ OnboardingContext |
| `GET /onboarding/templates/:id` | ✅ `onboardingRealApi.getTemplateById` | ⚠️ вызывается только в assign-flow |
| `PUT /onboarding/templates/:id` | ❌ **не вызывается** | ❌ `updateTemplate` в OnboardingContext обновляет только локальный state |

**Критическая проблема:** Редактирование шаблона в UI (TemplateModal) не сохраняется на бэкенде. `PUT /onboarding/templates/:id` никогда не вызывается. Все правки теряются при перезагрузке.

**Дополнительная проблема:** При создании шаблона `positionId` всегда отправляется как `'00000000-0000-0000-0000-000000000000'` — это захардкоженный placeholder, который может не существовать в БД бэкенда.

---

## 18. Assignments — Назначения онбординга

| Endpoint | API-метод | UI |
|---|---|---|
| `POST /onboardings` | ✅ `onboardingRealApi.assign` | ✅ AssignModal → OnboardingManagePage |
| `GET /onboardings` | ✅ `onboardingRealApi.getAllOnboardings` | ✅ OnboardingContext |
| `GET /onboardings/mine` | ✅ `onboardingRealApi.getMyOnboardings` | ✅ OnboardingContext |
| `GET /onboardings/assigned-by-me` | ✅ `onboardingRealApi.getManagedOnboardings` | ✅ OnboardingContext |
| `GET /onboardings/:id` | ✅ `onboardingRealApi.getOnboardingById` | ✅ OnboardingContext (после шага) |
| `POST /onboardings/:id/complete-step` | ✅ `onboardingRealApi.completeStep` | ✅ OnboardingPage |
| `POST /onboardings/:id/cancel` | ❌ нет метода | ❌ нет кнопки отмены онбординга |

**Критическая проблема — AssignModal использует захардкоженный список сотрудников:**

```typescript
const MOCK_EMPLOYEES = [
  { id: 'emp-2',  name: 'Мария Иванова', ... },
  ...
]
```

Кнопка «Назначить» отправляет `emp-2`, `emp-3` и т.д. — не реальные ID из БД. Назначение онбординга **не работает** для реальных сотрудников.

Аналогично — `DIVISIONS`/`DEPARTMENTS` в фильтрах вкладки «Назначения» тоже захардкожены — фильтрация работает только с mock-данными.

---

## 19. Chat — Чат онбординга

| Endpoint | API-метод | UI |
|---|---|---|
| `GET /onboardings/:id/chat/messages` | ✅ `onboardingRealApi.getChatMessages` | ❌ **никогда не вызывается** |
| `POST /onboardings/:id/chat/messages` | ✅ `onboardingRealApi.sendChatMessage` | ✅ ChatPanel (отправка) |
| `POST /onboardings/:id/chat/messages/read` | ❌ нет метода | ❌ не реализован |
| WebSocket `/chat` namespace | ❌ нет | ❌ нет |

**Критическая проблема:** `mapAssignmentDto` всегда инициализирует `messages: []`. История чата **не загружается** — при открытии онбординга чат всегда пуст. Отправленные сообщения добавляются только в локальный React state и теряются при перезагрузке.

---

---

# Notifications — Уведомления

---

## 20. Notifications

| Endpoint | API-метод | UI |
|---|---|---|
| `GET /me/notifications` | ✅ `notificationApi.list` | ✅ Sidebar (загружается один раз при mount) |
| `POST /me/notifications/:id/read` | ✅ `notificationApi.markRead` | ❌ определён, но не вызывается из Sidebar |
| `POST /me/notifications/read-all` | ✅ `notificationApi.markAllRead` | ✅ Sidebar (кнопка «Прочитать всё») |
| WebSocket `/notifications` namespace | ❌ нет | ❌ нет |

**Проблемы:**
- Уведомления грузятся через `useState/useEffect` — нет TanStack Query, нет `staleTime`, нет автоматического refetch
- Нет polling — новые уведомления появляются только после перезагрузки страницы
- Счётчик непрочитанных есть в `unreadCount`, но **не отображается в иконке** сайдбара
- `markRead` (по одному) не используется — только `markAllRead`

---

---

# Сводный план работ (все модули)

## Критические баги (ломают бизнес-логику)

| # | Баг | Где | Что нужно сделать |
|---|---|---|---|
| B1 | AssignModal использует `MOCK_EMPLOYEES` | `OnboardingManagePage.tsx:390` | Заменить на `useEmployeesQuery` + поиск по имени |
| B2 | `updateTemplate` не вызывает `PUT /onboarding/templates/:id` | `OnboardingContext.tsx:215` | Реализовать API-вызов `onboardingRealApi.updateTemplate` |
| B3 | Chat history не загружается | `onboardingRealApi.ts:41` / `onboardingRealApi.getChatMessages` | Вызывать `getChatMessages` при загрузке каждого онбординга |
| B4 | `positionId` захардкожен как `00000000-...` | `OnboardingContext.tsx:188` | Убрать обязательность `positionId` или дать пользователю выбрать |
| B5 | `PATCH /lessons/:id` никогда не вызывается | — | Добавить режим редактирования курса в CourseBuilder |
| ~~B6~~ | ~~Атомарность создания курса не гарантирована~~ | — | ✅ Выполнено — `POST /courses/full`, параллельное создание контента |

## Отсутствующий UI (API готов)

| # | Фича | Сложность | Ценность |
|---|---|---|---|
| ~~U1~~ | ~~Карточка/drawer сотрудника + edit/dismiss~~ | — | ✅ Выполнено |
| ~~U2~~ | ~~Inline rename + delete для dept/div~~ | — | ✅ Выполнено |
| ~~U3~~ | ~~Вкладка «Должности» (CRUD)~~ | — | ✅ Выполнено |
| ~~U4~~ | ~~Кнопка «Удалить курс» + confirm~~ | — | ✅ Выполнено |
| U5 | Страница «Мои заявки» (`GET /me/applications`) | S | Средняя — сотрудник не видит статус своих заявок |
| ~~U6~~ | ~~Детальная аналитика курса~~ | — | ✅ Выполнено — панель в CourseDetailPage |
| U7 | Кнопка «Отменить онбординг» | XS | Средняя |
| U8 | Отмена записи на курс (`DELETE /enrollments/:id`) | XS | Низкая |
| U9 | Flow `/complete-registration` (invite-by-link) | M | Средняя |

## Недостающие возможности (нет в бэкенде)

| # | Потребность | Комментарий |
|---|---|---|
| ~~A1~~ | ~~Фильтр сотрудников по `departmentId`~~ | Бэкенд теперь поддерживает `departmentId` и `roleId` |
| ~~A2~~ | ~~Поле `avatarFileId` на сотруднике~~ | Бэкенд поддерживает `avatarId` в `PATCH /employees/:id` |
| A3 | Resumption теста (`GET /attempts/:id`) | При перезагрузке попытка теряется |
| A4 | Отметка «начат» у онбординг-шага | Нет `POST /onboardings/:id/steps/:stepId/start` — только complete |

## Технический долг

| # | Долг | Где | Рекомендация |
|---|---|---|---|
| T1 | Уведомления через `useState/useEffect` | `Sidebar.tsx:89–116` | Перевести на TanStack Query + polling 30 с |
| T2 | MOCK_DIVISIONS/DEPARTMENTS в фильтрах назначений | `OnboardingManagePage.tsx:498–516` | Заменить на реальные запросы через хуки |
| T3 | `onboardingRealApi.fetchEmployeeMap` — N+1 запросов | `onboardingRealApi.ts:77` | Оптимизировать через пакетную загрузку или `GET /employees` с фильтром |
| T4 | `controlApi.getEmployeeEnrollments` — fan-out запросов | `controlApi.ts:19–40` | Добавить курсор/пагинацию или серверный агрегат |

> XS = несколько часов, S = 1–2 дня, M = 3–5 дней
