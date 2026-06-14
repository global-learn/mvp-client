# GAPS — клиент vs бэкенд (свежий проход)

> Дата: 2026-06-13. Источник истины — текущий бэкенд (`../global-learn-cl`, см. его `CHECKLIST.md`).
> Метод: список эндпоинтов бэкенда ⟷ фактические вызовы `api.*` в `src/`.
> Этот файл дополняет `ITERATION.md`/`SUMMARY.md`/`NEED.md` (они от 2026-06-08/09 и местами устарели).

## Поправки к устаревшим заметкам
- `CLAUDE.md` (строка ~290) утверждает «Все entity-API mock-овые». **Неверно:** клиент уже ходит в
  реальный бэкенд через `courseRealApi`, `onboardingRealApi`, `employeeApi`, `controlApi`, `authApi`.
  ~~Mock-файлы `courseApi.ts`, `onboardingApi.ts` — мёртвый код, можно удалять.~~ ✅ Оба удалены
  (2026-06-14 / B3). Также удалён мёртвый self-register флоу (`/register`, `/verify-email`) — бэк
  не поддерживает публичную саморегистрацию (`POST /auth/register` — `@Roles('admin')`).

---

## A. Эндпоинты бэкенда, НЕ используемые клиентом (фичи не выведены в UI)

| Бэкенд-эндпоинт | Что это | Влияние | Приоритет |
|---|---|---|---|
| `PATCH /courses/:id/submit` | Отправить DRAFT-курс на модерацию | **Курсы менеджеров навсегда застревают в DRAFT** — их нельзя отправить на проверку | 🔴 высокий |
| `PATCH /courses/:id/publish` | Опубликовать курс (admin) | Админ не может опубликовать курс из UI → весь воркфлоу модерации мёртв | 🔴 высокий |
| `PATCH /courses/:id/reject` | Отклонить курс с примечанием (admin) | Нет отклонения на проверке | 🔴 высокий |
| `POST /auth/forgot-password` | Запрос письма сброса пароля | **Нет UI восстановления пароля** (есть только смена в профиле) | 🔴 высокий |
| `POST /auth/reset-password` | Сброс по токену из письма | Нет страницы сброса | 🔴 высокий |
| `POST /courses/:id/enroll/bulk` | Групповое зачисление | Массовое назначение либо делается циклом одиночных, либо отсутствует | 🟡 средний |
| ~~`POST /enrollments/:id/steps/:stepId/start`~~ | Отметить шаг начатым | ✅ ИСПРАВЛЕНО — плеер вызывает `startStep` при открытии непройденного шага (best-effort) | ~~🟡~~ |
| ~~`DELETE /enrollments/:id`~~ | Отменить зачисление | ✅ ИСПРАВЛЕНО — кнопка «Отменить запись» в `CourseDetailPage` | ~~🟡~~ |
| ~~`GET /me/applications`~~ | Мои заявки на курсы | ✅ ИСПРАВЛЕНО — виджет «Мои заявки» на `/courses` (виден статус, вкл. REJECTED) | ~~🟡~~ |
| `GET /attempts/:id` | Статус попытки теста | Состояние попытки тянется иначе/не тянется | 🟡 средний |
| ~~Банк вопросов: `GET /courses/:id/questions(+/stats)`, `GET/PATCH/DELETE /questions/:id`~~ | Управление банком вопросов | ✅ ИСПРАВЛЕНО — модалка «Банк вопросов» в CourseDetailPage (список+ответы+used-count, статистика, редактирование, удаление). Осталось не выведено: `questions/bulk` (ручное добавление в тест), `PATCH /test-definitions/:id` (переименование теста/порог) — низкий приоритет | ~~🟡~~ |
| `GET /courses/:id/modules/:moduleId/questions` | Банк вопросов модуля | Модуль виден в модалке банка как лейбл у вопроса; отдельный per-module эндпоинт не нужен | 🟢 низкий |
| `GET /lessons/:id` | Урок отдельно | Контент урока приходит внутри курса — ок | 🟢 низкий |
| ~~`DELETE /files/:id`~~ | Удаление файла | ✅ ИСПРАВЛЕНО — при замене обложки курса старый файл удаляется (best-effort) в `updateCourse` | ~~🟢~~ |
| Роли: `POST /roles`, `GET /roles/:id`, `DELETE /roles/:id` | CRUD ролей | Роли управляются seed-ом, UI не нужен | 🟢 низкий |
| `POST /user`, `GET /user` (list) | Создание/список users | Дублируется `/employees` — не нужно | 🟢 низкий |

> Полностью покрыто клиентом: departments/divisions/positions (CRUD+деревья), employees
> (вкл. dashboard/subordinates/tree/promote/dismiss), курсы (create/full/list/get/update/archive/
> modules/steps/generate-test), заявки (apply/approve/reject), enrollments (enroll/mine/get/complete),
> онбординг (templates+assignments полностью, чат, cancel), сертификаты, уведомления (REST).

---

## B. Рассогласования моделей и риски ошибок (баги)

1. 🔴 **Realtime-уведомления не работают (handshake).**
   `NotificationContext.tsx` подключается `io('/notifications', { withCredentials:true })`, но
   **не передаёт `auth.token`**. Бэкенд `NotificationsGateway.handleConnection` читает
   `client.handshake.auth?.token` (не cookie!) → токена нет → `client.disconnect()`.
   Auth у нас cookie-based (httpOnly) — JS не может прочитать access-токен для `auth.token`.
   Итог: сокет рвётся, события `notification:created` не доходят. Уведомления живут только на
   ручном `GET /me/notifications`. Чинить: либо гейтвей читает токен из cookie, либо клиент
   отдаёт токен (напр. короткий ws-токен).

2. ✅ **[ИСПРАВЛЕНО] Чат онбординга realtime (B2).** Было: бэкенд поднимает `OnboardingChatGateway`,
   но клиент его не подключал — сообщения только ручным `GET .../chat/messages`. Доп. проблема:
   комната ключевалась по скрытому `chatId`, а payload `message:created` не содержал id чата/онбординга
   → клиент не смог бы атрибутировать входящее сообщение. Решение: **бэк** — комната `chat:<onboardingId>`
   (чат 1:1 с онбордингом, клиент знает только его id), `subscribe { onboardingId }`, в payload добавлен
   `onboardingId`. **Клиент** — `OnboardingContext` держит один сокет `/chat`, `subscribeToChat(id)`,
   обработчик `message:created` дописывает сообщение в нужное назначение (атрибуция по `onboardingId`,
   dedup по `id` против эха своего же сообщения, re-subscribe на `connect` после реконнекта). Обе
   страницы (`OnboardingPage`, `OnboardingManagePage`) подписываются на активный чат. Cookie-WS-auth
   уже починен в B1.

3. ✅ **[ИСПРАВЛЕНО] Типы шагов онбординга.** Было: клиент знал 5 типов
   (`task/document/meeting/video/course`), бэк — только `TEXT|COURSE`, лишние схлопывались в TEXT
   (потеря данных). Решение по `first.md` стр.291 (только TEXT/COURSE) — урезали клиент:
   `OnboardingStepType = 'text' | 'course'`, лейблы/иконки/`mapBackendStepType` упрощены,
   `EMPTY_STEP_DRAFT.type='text'`, удалён мёртвый mock `onboardingApi.ts`. Селектор шага в
   `OnboardingManagePage` теперь рендерит только 2 типа.

4. ✅ **[ИСПРАВЛЕНО] `OnboardingStep.required` — фикция.** Было: в маппере `required` всегда `true`,
   у бэкенда нет per-step признака обязательности, но в редакторе была галочка «Обязательный» и
   бейджи «обязательно»/«обяз.» (висели на каждом невыполненном шаге = шум). Решение: убрали поле
   `required` из типа `OnboardingStep`, из мапперов, чекбокс редактора и оба бейджа + осиротевшие CSS
   (`requiredMark`, `stepEditorRequired`, `stepFormCheckbox`). (Общий `dueDate` оставлен — он реальный,
   приходит из `recommendedEndDate`.)

5. ✅ **[ИСПРАВЛЕНО] `divisionName` в назначениях пустой.** Было: `mapAssignmentDto` ставил
   `divisionName: ''` (EmployeeDto не содержит имени отдела, только `divisionId` + `department.name`).
   Решение: `fetchDivisionMap()` тянет справочник `/divisions` (id→name) и прокидывается в
   `mapAssignmentDto` (для списков и одиночного `getOnboardingById`). Отдел теперь виден в 3 местах UI.

6. 🟢 **Сертификат — нет PDF.** Бэкенд отдаёт только запись (id/issuedAt), без файла. Клиентский
   `CertificateModal` рисует «бумагу» сам — ок, но «распечатать/скачать PDF» с сервера нечем
   (см. бэкенд `PLAN.md` P3).

7. 🟢 **`/courses/analytics` и `/courses/:id/analytics` без роли на бэке** — клиент дёргает их;
   если бэкенд закроет `@Roles`, сломается. Держать в курсе при правках бэка.

8. ✅ **[ИСПРАВЛЕНО] Завершение регистрации по приглашению.** Было: `completeRegistration` слал
   `{ email, newPassword }` без `token` (бэк требует `token`), а единственный UYI — mock
   `/verify-email`. Бэкенд шлёт инвайт-ссылку `APP_URL/complete-registration?token=…&email=…`,
   но такого роута на клиенте не было. Стало: `authApi.completeRegistration(token,email,newPassword)`
   + страница `/complete-registration` (читает token+email из query). Старый `/verify-email` (mock)
   остался мёртвым роутом — можно удалить отдельно.

---

## C. Что проверить отдельно (не подтверждено как баг, но подозрительно)
- ✅ **[ПРОВЕРЕНО — багов нет] Маппинг `scope` курса.** Create (`CoursesContext.createCourse`)
  выводит `scope` из target (DIVISION→DEPARTMENT→ALL) и шлёт оба id; edit (`CourseDetailPage.
  handleSaveEdit`) шлёт `scope` из селекта + `departmentId` при ≠ALL, `divisionId` при DIVISION.
  Форма `CourseBuilder` хранит `scope` явно. Консистентно, бэк SET NULL подчищает лишние id.
- ⚠️ **[ИЗВЕСТНОЕ ОГРАНИЧЕНИЕ, не баг] Пагинация `limit: 200`.** Клиент почти везде шлёт
  `limit: 200` без UI-пагинации — при росте данных списки будут обрезаться. Приемлемо для текущего
  масштаба; полноценная пагинация — отдельная крупная фича (не «пачка»). Оставлено как есть.
- ✅ **[ИСПРАВЛЕНО — была XSS] Рендер урока.** Плеер (`CoursePlayerPage`) и превью билдера уже
  использовали безопасный `react-markdown` (по умолчанию экранирует сырой HTML + санитизирует URL).
  Но `CourseDetailPage.LessonText` рендерил самописный regex-markdown через `dangerouslySetInnerHTML`
  **без экранирования входа** → авторский `<script>`/`<img onerror>` исполнялся (XSS, контент задаёт
  менеджер-автор). Заменено на `<ReactMarkdown>`. Других `dangerouslySetInnerHTML` в проекте нет.

---

## Приоритеты / прогресс (что чинить первым)
- [x] 🔴 **B1 — realtime-токен (WS auth по cookie).** Бэкенд-гейтвеи читают `access_token` из cookie.
- [x] 🔴 **A — submit/publish/reject** (модерация курсов в UI). Заодно починен баг `mapStatus`.
- [x] 🔴 **A — forgot/reset-password** (восстановление пароля в UI).
- [x] 🟡 **B2 — чат онбординга realtime** (socket.io `/chat`; комната по `onboardingId`). См. журнал.
- [x] 🟡 **B3 — типы шагов онбординга урезаны до TEXT/COURSE** (по `first.md` стр.291). См. журнал.
- [x] 🔴 **B8 — завершение регистрации по приглашению** (см. ниже).
- [x] 🟡 **A — start-step / cancel-enrollment / me/applications**. См. журнал.
- [x] 🟢 Остальное: ✅ чистка mock-кода/мёртвого self-register флоу + CSS; ✅ модельные фикции
  (`required` убран, `divisionName` резолвится); ✅ C-scope проверен (багов нет);
  ✅ XSS в рендере урока закрыт; ⚠️ пагинация `limit:200` — осознанное ограничение (оставлено);
  ✅ банк вопросов (модалка: список/статистика/редактирование/удаление); ✅ `DELETE /files/:id`
  (чистка старой обложки при замене). См. журнал.

## Журнал
<!-- дата — что сделано -->
- 2026-06-13 — первичный анализ (этот файл).
- 2026-06-13 — B1: бэкенд-гейтвеи (`notifications`, `chat`) читают JWT из cookie `access_token`
  (`src/infra/gateway/ws-auth.ts`), fallback на `handshake.auth.token`. Билд зелёный.
  Caveat: в dev при кросс-origin (vite:5173 ↔ api:3001) cookie может не уйти в WS-handshake —
  нужен vite-прокси или SameSite=None; в prod за nginx (один origin) работает.
- 2026-06-13 — A: модерация курсов. `courseWriteApi.submitForReview/publish/reject`,
  `CoursesContext.submitCourse/approveCourse/rejectCourse` (были заглушки-noop), кнопки в
  `CourseDetailPage` (Отправить на проверку / Опубликовать / Отклонить+причина) + бейдж статуса.
  **Попутно баг:** `mapStatus` сравнивал lowercase, а бэк шлёт UPPERCASE enum (`DRAFT`/`PENDING_REVIEW`/
  `REJECTED`) → все курсы показывались `published`. Исправлено + проброшен `reviewNote`. tsc-typecheck зелёный.
- 2026-06-13 — A: восстановление пароля. `authApi.forgotPassword/resetPassword`, страницы
  `ForgotPasswordPage` (`/forgot-password`) и `ResetPasswordPage` (`/reset-password`, читает
  `token`+`email` из query), ссылка «Забыли пароль?» на логине. tsc + eslint зелёные.
  Note: vite-сборку в этой среде не прогнать (нужен Node 24, стоит 18) — проверял `tsc -b` + eslint.
  Попутно нашёл баг B8 (completeRegistration без token) — записал, не чинил.
- 2026-06-13 — B8: завершение регистрации. `authApi.completeRegistration(token,email,newPassword)`
  (+token), страница `CompleteRegistrationPage` (`/complete-registration`, читает token+email из
  query — путь совпадает с инвайт-ссылкой бэка `APP_URL/complete-registration?...`). tsc+eslint зелёные.
- 2026-06-13 — B3 (решение): `first.md` стр.291 описывает шаги онбординга только TEXT/COURSE →
  enum на бэке НЕ расширяем; план — урезать клиентские типы до TEXT/COURSE.
- 2026-06-13 — B3 (сделано): `OnboardingStepType = 'text'|'course'`; обновлены `STEP_TYPE_LABELS`,
  `mapBackendStepType`, `StepIcon`+`TYPE_CSS` (убраны иконки Video/Users), `EMPTY_STEP_DRAFT`;
  удалён мёртвый mock `entities/onboarding/api/onboardingApi.ts`. tsc зелёный; lint — только
  предсуществующие `set-state-in-effect` (не мои). Осталось косметикой: неиспользуемые CSS-классы
  `typeBadgeDocument/Meeting/Video` в `Onboarding.module.css` можно убрать.
- 2026-06-14 — B2 (сделано): realtime-чат онбординга.
  **Бэк** (`../global-learn-cl`): `OnboardingChatGateway` — комната теперь `chat:<onboardingId>`
  (была `chat:<chatId>`, скрытый от клиента), `subscribe { onboardingId }`, в payload `message:created`
  добавлен `onboardingId`; `send-message.command-handler` шлёт `sendToChat(command.onboardingId, …)`
  (убран неиспользуемый `chatId`). **Клиент**: `OnboardingContext` — один сокет `io('/chat',
  {withCredentials})`, `subscribeToChat(id)`, обработчик `message:created` (атрибуция по `onboardingId`,
  dedup по `id`, re-subscribe на `connect`); `OnboardingPage`/`OnboardingManagePage` подписываются на
  активный чат (return cleanup из эффекта). Бэк tsc — чисто (2 ошибки в spec/e2e предсуществующие, не мои);
  клиент tsc-b зелёный, eslint — только предсуществующие `set-state-in-effect`/`react-refresh`.
  Известное ограничение (унаследовано): `subscribe` не проверяет, что юзер участник онбординга —
  комнату можно подслушать, зная чужой `onboardingId`. Нужна авторизация в гейтвее (отдельный пункт).
- 2026-06-14 — A (сделано): три неиспользуемых эндпоинта зачисления выведены в UI. Бэк не трогал —
  эндпоинты уже были (`POST /enrollments/:id/steps/:stepId/start`, `DELETE /enrollments/:id`,
  `GET /me/applications`). Клиент: `enrollmentWriteApi.startStep/cancel`, `myApplicationApi.getMine`,
  хук `useMyApplicationsQuery` + query-key `courses.myApplications`. `CoursesContext` — `startStep`
  (best-effort, молча глотает 409 при прыжке вперёд; backend `startStep` идемпотентен) и
  `cancelEnrollment` (оптимистично `status:'rejected'`, т.к. маппер сводит CANCELLED→rejected; бэк
  не фильтрует отменённые в `/me/enrollments`). UI: автоstart-step в `CoursePlayerPage` при открытии
  непройденного шага; кнопка «Отменить запись» в `CourseDetailPage` (класс `deleteBtn`, confirm);
  новый виджет `widgets/my-applications` на `/courses` (показывает PENDING/APPROVED/REJECTED — раньше
  отклонённые заявки были не видны). `requestEnrollment` инвалидирует `myApplications`. tsc-b зелёный;
  eslint затронутых — только предсуществующие `set-state-in-effect`/`react-refresh`/`prefer-const`/
  `react/no-danger` (не мои; мой `startStep`-эффект и `MyApplications.tsx` чисты).
- 2026-06-14 — 🟢 чистка (пачка): удалён мёртвый mock `entities/course/api/courseApi.ts`
  (`courseApi`+`MOCK_USER_INFO`, нигде не импортирован); удалён мёртвый self-register флоу —
  страницы `pages/register` и `pages/verify-email` (заглушки: `UserContext.register` кидал ошибку,
  `verifyEmail` всегда `false`; бэк `POST /auth/register` — `@Roles('admin')`, публичной
  саморегистрации нет, инвайт идёт через `/complete-registration` из B8). Из `UserContext` убраны
  поля `register`/`verifyEmail` (интерфейс + value), из роутера — импорты и маршруты `/register`,
  `/verify-email`. Висячих ссылок нет (проверено grep по login/landing/widgets). Удалены неисп. CSS
  `typeBadgeDocument/Meeting/Video` в `Onboarding.module.css`. tsc-b зелёный; eslint — только
  предсуществующий `react-refresh` в `UserContext` (экспорт хуков рядом с провайдером, не мой).
  Примечание: `authApi.register` оставлен — валидная привязка к админскому эндпоинту (пока без UI).
- 2026-06-14 — 🟢 пачка #2 (модельные фикции + проверка C-scope):
  • B4 `required` (фикция) — убрано поле из типа `OnboardingStep`, из мапперов
    (`mapTemplateStep`/`getTemplateById`), чекбокс «Обязательный» из редактора шага, бейджи
    «обязательно»/«обяз.», `EMPTY_STEP_DRAFT.required` и draft-маппинг; удалены осиротевшие CSS
    `requiredMark`/`stepEditorRequired`/`stepFormCheckbox`.
  • B5 `divisionName` — добавлен `fetchDivisionMap()` (тянет `/divisions`, id→name), прокинут в
    `mapAssignmentDto` для списков и `getOnboardingById`; отдел теперь виден в OnboardingPage и
    OnboardingManagePage (3 места).
  • C-scope — проверено: маппинг scope↔target в create/edit/CourseBuilder консистентен, багов нет.
  tsc-b зелёный; eslint затронутых — только предсуществующие `set-state-in-effect` в
  OnboardingManagePage (не мои); `onboardingRealApi`/`types`/`OnboardingPage` чисты.
- 2026-06-14 — 🟢 пачка #3 (раздел C):
  • XSS (была реальная уязвимость) — `CourseDetailPage.LessonText` рендерил самописный
    regex-markdown через `dangerouslySetInnerHTML` без экранирования входа → авторский HTML
    (`<script>`/`<img onerror>`) исполнялся. Заменён на `<ReactMarkdown>` (как в плеере; v10
    по умолчанию экранирует HTML и санитизирует URL). Ушёл и `react/no-danger` eslint-disable.
    Других `dangerouslySetInnerHTML` в проекте нет.
  • Пагинация `limit:200` — проверено: осознанное ограничение, не баг; полноценная пагинация —
    отдельная фича, оставлено как есть.
  tsc-b зелёный; eslint CourseDetailPage — только предсуществующие `set-state-in-effect`/
  `exhaustive-deps` (прежняя ошибка `react/no-danger` на стр.47 исчезла — опасный код удалён).
- 2026-06-14 — 🟢 банк вопросов + `DELETE /files/:id`:
  • Банк вопросов — `questionApi` расширен (`list`/`stats`/`update`/`delete`); схемы
    `CourseQuestionDto`(+`usedInTestsCount`)/`QuestionBankStatsDto`; хуки
    `useCourseQuestionsQuery`/`useQuestionBankStatsQuery` + query-keys. Модалка `QuestionBankModal`
    (CourseDetailPage, кнопка «Банк вопросов» в авторских действиях): статистика (всего/в тестах/
    не используются), список вопросов с ответами/модулем/used-count, инлайн-редактирование
    (текст + варианты, тоггл правильного, добавить/удалить вариант), удаление с предупреждением
    про used-in-tests. Не выводил: `questions/bulk`, `PATCH /test-definitions/:id` — низкий приоритет.
  • `DELETE /files/:id` — `fileApi.delete`; в `updateCourse` при замене обложки старый `coverId`
    удаляется best-effort (бэк SET NULL, осиротевший объект в MinIO чистится).
  tsc-b зелёный; eslint — новые файлы (`QuestionBankModal`, api/hooks/schemas) чисты, в
  CourseDetailPage/CoursesContext только предсуществующие `set-state-in-effect`/`react-refresh`.
</content>
