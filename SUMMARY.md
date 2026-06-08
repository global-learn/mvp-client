# SUMMARY — Global Learn: Текущее состояние

> Обновлено: 2026-06-08. Ветка `feat/add-api`.

---

## 1. Эндпоинты бэкенда и статус на фронте

### Auth
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /auth/login | ✅ |
| POST | /auth/logout | ✅ |
| GET | /auth/me/profile | ✅ `authApi.myProfile()` → `UserContext` |
| POST | /auth/refresh | ✅ axios interceptor |
| POST | /auth/register | ✅ |
| POST | /auth/complete-registration | ✅ |
| POST | /auth/change-password | ✅ |

### Employees
| Метод | Путь | Фронт |
|-------|------|-------|
| GET | /employees | ✅ `employeeApi.list()` |
| GET | /employees/:id | ✅ `employeeApi.getById()` |
| GET | /employees/me/subordinates | ✅ `employeeApi.getSubordinates()` |
| POST | /employees | ✅ `employeeApi.create()` |
| PATCH | /employees/:id | ✅ `employeeApi.update()` |
| PATCH | /employees/:id/promote | ✅ `employeeApi.promote()` |
| DELETE | /employees/:id | ✅ `employeeApi.delete()` |

### Company (Departments / Divisions / Positions)
| Метод | Путь | Фронт |
|-------|------|-------|
| GET/POST | /departments | ✅ `departmentApi.list()` + `departmentApi.create()` |
| GET/POST | /divisions | ✅ `divisionApi.list()` + `divisionApi.create()` |
| PATCH/DELETE | /departments, /divisions | ❌ нет UI |
| GET | /positions | ✅ `positionApi.list()` (для формы добавления сотрудника) |
| GET/POST/PATCH/DELETE | /positions | ❌ нет UI управления |
| GET | /positions/tree | ❌ не используется |
| GET | /roles | ✅ `roleApi.list()` (для формы добавления сотрудника) |
| POST | /employees | ✅ `employeeApi.create()` (форма «Добавить сотрудника») |

### Courses (read)
| Метод | Путь | Фронт |
|-------|------|-------|
| GET | /courses | ✅ `useCoursesQuery` |
| GET | /courses/:id | ✅ `useCourseQuery` |
| GET | /courses/analytics | ✅ `controlApi.getEmployeeEnrollments()` — список курсов с записями |
| GET | /courses/:id/analytics | ❌ не используется напрямую (загружается полный курс для подсчёта шагов) |
| GET | /me/enrollments | ✅ `useMyEnrollmentDtosQuery` |
| GET | /enrollments/:id | ✅ `enrollmentWriteApi.getById` |
| GET | /courses/:id/enrollments | ✅ `getCourseEnrollments` |

### Courses (write)
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /courses | ✅ `courseWriteApi.create` |
| PATCH | /courses/:id | ✅ `courseWriteApi.update` |
| DELETE | /courses/:id | ❌ нет UI |
| POST | /courses/:id/modules | ✅ `courseWriteApi.addModule` |
| DELETE | /courses/:id/modules/:moduleId | ✅ `courseWriteApi.deleteModule` |
| POST | /courses/:id/modules/:moduleId/steps | ✅ `courseWriteApi.addStep` |
| DELETE | /courses/:id/modules/:moduleId/steps/:stepId | ✅ `courseWriteApi.deleteStep` |
| POST | /files | ✅ `fileApi.upload` |
| GET | /files/:id | ✅ `fileApi.getUrl` → `useCoverUrl` |
| DELETE | /files/:id | ❌ нет |

### Lessons
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /lessons | ✅ `lessonApi.create` |
| PATCH | /lessons/:id | ✅ `lessonApi.update` (есть, но не вызывается в CourseBuilder при редактировании) |
| DELETE | /lessons/:id | ✅ `lessonApi.delete` |

### Test Definitions
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /test-definitions | ✅ `testDefApi.create` |
| GET | /test-definitions/:id | ✅ `testDefApi.getById` → `useTestDefinitionQuery` |
| PATCH | /test-definitions/:id | ❌ нет |
| DELETE | /test-definitions/:id | ✅ `testDefApi.delete` |
| POST | /test-definitions/:id/questions | ✅ `testDefApi.addQuestion` |
| DELETE | /test-definitions/:id/questions/:questionId | ❌ нет |
| POST | /courses/:id/questions | ✅ `questionApi.create` |
| GET | /courses/:id/questions | ❌ нет |
| DELETE | /questions/:id | ❌ нет |

### Test Attempts
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /tests/:testId/attempts | ✅ `testAttemptApi.start()` — вызывается при открытии теста |
| GET | /attempts/:id | ❌ не используется |
| POST | /attempts/:id/answers | ✅ `testAttemptApi.answer()` — отправляется для каждого вопроса |
| POST | /attempts/:id/finish | ✅ `testAttemptApi.finish()` — результат с сервера |

> При `isPassed === true` вызывается `enrollmentWriteApi.completeStep`. Оценка теперь на сервере.

### Enrollments
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /courses/:id/enroll | ✅ `courseWriteApi.enrollEmployee` |
| DELETE | /enrollments/:id | ❌ нет UI отмены записи |
| POST | /enrollments/:id/steps/:stepId/start | ❌ не вызывается |
| POST | /enrollments/:id/steps/:stepId/complete | ✅ `enrollmentWriteApi.completeStep` |

### Course Applications
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /courses/:id/applications | ✅ `courseWriteApi.applyForCourse` |
| GET | /courses/:id/applications | ✅ `courseWriteApi.getApplications` |
| PATCH | .../approve | ✅ |
| PATCH | .../reject | ✅ |
| GET | /me/applications | ❌ нет страницы «Мои заявки» |

### Onboarding
| Метод | Путь | Фронт |
|-------|------|-------|
| POST | /onboarding/templates | ✅ `onboardingRealApi.createTemplate` |
| GET | /onboarding/templates | ✅ `onboardingRealApi.getTemplates` |
| GET | /onboarding/templates/:id | ✅ `onboardingRealApi.getTemplateById` |
| PUT | /onboarding/templates/:id | ❌ `updateTemplate` — только локальный стейт |
| POST | /onboardings | ✅ `onboardingRealApi.assign` |
| GET | /onboardings | ✅ `getAllOnboardings` (admin) |
| GET | /onboardings/mine | ✅ `getMyOnboardings` |
| GET | /onboardings/assigned-by-me | ✅ `getManagedOnboardings` |
| GET | /onboardings/:id | ✅ `getOnboardingById` |
| POST | /onboardings/:id/complete-step | ✅ `onboardingRealApi.completeStep` |
| POST | /onboardings/:id/cancel | ❌ нет UI |
| GET | /onboardings/:id/chat/messages | ✅ API есть, **но не вызывается при открытии** |
| POST | /onboardings/:id/chat/messages | ✅ `onboardingRealApi.sendChatMessage` |
| POST | /onboardings/:id/chat/messages/read | ❌ нет |

### Notifications
| Метод | Путь | Фронт |
|-------|------|-------|
| GET | /me/notifications | ✅ `notificationApi.list()` — загружается в сайдбаре при mount |
| POST | /me/notifications/:id/read | ❌ нет отдельной кнопки |
| POST | /me/notifications/read-all | ✅ `notificationApi.markAllRead()` — вызывается при открытии панели |

---

## 2. Страницы и их состояние

| Страница | Маршрут | Состояние |
|----------|---------|-----------|
| Landing | `/` | ✅ статичная |
| Login | `/login` | ✅ реальный API |
| Register | `/register` | ✅ реальный API |
| Dashboard | `/dashboard` | ✅ работает |
| Courses List | `/courses` | ✅ реальный API, обложки, карточки |
| Course Detail | `/courses/:id` | ✅ полный курс с модулями, обложка, плеер |
| Course Create | `/courses/create` | ✅ создание работает |
| **Course Edit** | нет маршрута | ❌ отсутствует |
| Profile | `/profile` | ⚠️ частично — сертификаты в памяти, не в БД |
| Company | `/company` | ✅ реальный API — departments/divisions/employees/roles/positions из API; add dept/div/employee через API |
| Control | `/control` | ✅ реальный API — аггрегирует из `GET /courses/analytics` + enrollments per course + employees |
| Onboarding (сотрудник) | `/onboarding` | ✅ реальный API, шаги, чат |
| Onboarding (менеджер) | `/onboarding/manage` | ⚠️ частично — assignments/templates реальные, но список сотрудников в форме назначения — `MOCK_EMPLOYEES` |
| **Мои заявки** | нет маршрута | ❌ отсутствует (`GET /me/applications` не используется) |
| **Уведомления** | нет маршрута | ❌ отсутствует (бэкенд есть, фронт нет) |

---

## 3. Известные проблемы и несоответствия

### Критичные
| Проблема | Где |
|----------|-----|
| OnboardingManagePage — список сотрудников в форме назначения — `MOCK_EMPLOYEES` | `OnboardingManagePage.tsx:389` |
| История чата онбординга не загружается при открытии | `OnboardingContext` |
| `approveCourse` / `rejectCourse` — noop, нет эндпоинта смены статуса курса | `CoursesContext` |
| `courseType` захардкожен `'all'`, бэкенд не возвращает это поле | `mapCourse` в `courseRealApi.ts` |
| `status` курса захардкожен `'published'` | `mapCourse` в `courseRealApi.ts` |

### Технический долг
| Проблема | Где |
|----------|-----|
| `updateTemplate` — только локальный стейт, не вызывает PUT | `OnboardingContext` |
| `divisionName` в назначениях онбординга всегда пустая строка | `onboardingRealApi.mapAssignmentDto` |
| Сертификаты хранятся в `useState`, не персистентны | `CoursesContext.certificates` |
| `courseApi.ts` (mock) — не импортируется, можно удалить | `src/entities/course/api/courseApi.ts` |
| `onboardingApi.ts` (mock) — не импортируется, можно удалить | `src/entities/onboarding/api/onboardingApi.ts` |
| `controlApi.ts` — полностью mock | `src/entities/control/api/controlApi.ts` |
| `console.log('body', dto)` в контроллере | `global-learn-cl/.../course.controller.ts` |

---

## 4. План (приоритизировано)

### Приоритет A — Функциональные дыры (страницы полностью на mock)

#### ~~A0. CompanyPage — реальный API~~ ✅ ГОТОВО
- `GET /departments`, `/divisions`, `/employees`, `/positions`, `/roles` при mount
- `POST /departments` + `POST /divisions` — создание через `companyApi`
- `POST /employees` — форма «Добавить сотрудника» с реальными данными (email, пароль, дата, роль)
- Убран инвайт-таб (нет бэкенд-концепции), убраны MOCK_ORG / ALL_EMPLOYEES

#### ~~A1. Test Attempt Flow~~ ✅ ГОТОВО
- `POST /tests/:testId/attempts` → `attemptId` при открытии теста (`testAttemptApi.start`)
- `POST /attempts/:id/answers` → для каждого вопроса при сабмите
- `POST /attempts/:id/finish` → результат с сервера (`isPassed`, `score`)
- `completeStep` вызывается только при `isPassed === true`

#### ~~A2. Control Page — реальная аналитика~~ ✅ ГОТОВО
- `GET /courses/analytics` → список курсов с totalEnrollments > 0
- Для каждого активного курса параллельно: `GET /courses/:id` (шаги) + `GET /courses/:id/enrollments`
- `GET /employees` → маппинг employeeId → имя/email/департамент
- `GET /divisions` → маппинг divisionId → название
- Прогресс = `completedSteps / totalSteps * 100` (100 для COMPLETED)
- `controlApi.ts` полностью переписан, `ControlPage.tsx` не менялся

#### A2.5. OnboardingManagePage — реальный список сотрудников
Форма назначения онбординга использует `MOCK_EMPLOYEES` вместо реального API.  
Заменить на `employeeApi.list()` / `employeeApi.getSubordinates()` в зависимости от роли.  
Файл: `src/pages/onboarding-manage/ui/OnboardingManagePage.tsx:389`

#### ~~A3. Уведомления~~ ✅ ГОТОВО
- `GET /me/notifications` → `notificationApi.list()` при mount Sidebar
- Колокольчик в footer Sidebar с бейджем непрочитанных
- Раскрывающаяся панель с последними уведомлениями (тип + время)
- `POST /me/notifications/read-all` при открытии панели

Файлы: `src/widgets/sidebar/ui/Sidebar.tsx`, `src/shared/api/notificationApi.ts`

#### A4. Мои заявки на курсы
Страница или вкладка для сотрудника:
- `GET /me/applications` → список заявок со статусом
- Маршрут `/applications` или вкладка на `/courses`

### Приоритет B — Редактирование

#### B1. Редактирование курса
`CourseBuilder` поддерживает только создание. Нужен режим edit:
- Маршрут `/courses/:id/edit`
- Загружать существующий курс, `PATCH /courses/:id` — метаданные
- Редактирование контента урока через `PATCH /lessons/:id` (API уже есть)
- Добавление/удаление модулей и шагов (API уже есть)

#### B2. Редактирование шаблона онбординга
Подключить `PUT /onboarding/templates/:id` в `updateTemplate` вместо локального стейта.

#### B3. Отмена записи на курс
Кнопка «Отменить запись» → `DELETE /enrollments/:id`.  
Файл: `src/pages/course-detail/ui/CourseDetailPage.tsx`

#### B4. Удаление курса
Кнопка для автора/admin → `DELETE /courses/:id`.  
Файл: `src/pages/course-detail/` или `src/pages/course-create/`

### Приоритет C — UX-доработки

#### C1. История чата онбординга
При открытии назначения загружать существующие сообщения:
```typescript
// В OnboardingContext при load или при открытии конкретного назначения
const messages = await onboardingRealApi.getChatMessages(assignmentId);
patchAssignment({ ...assignment, messages });
```

#### C2. `POST /enrollments/:id/steps/:stepId/start`
Вызывать при открытии шага в плеере (трекинг времени начала).

#### C3. Отметка сообщений прочитанными
`POST /onboardings/:id/chat/messages/read` при открытии чата.

### Приоритет D — Очистка

| Действие | Файл |
|----------|------|
| Удалить mock-файл | `src/entities/course/api/courseApi.ts` |
| Удалить mock-файл | `src/entities/onboarding/api/onboardingApi.ts` |
| Заменить или удалить | `src/entities/control/api/controlApi.ts` |
| Убрать `console.log` | `global-learn-cl/src/modules/education/course/presentation/course.controller.ts` |
