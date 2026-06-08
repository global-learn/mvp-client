# Backend — что нужно от бэкенда

> Дата: 2026-06-08. Документ для бэкенд-команды.
> Всё описанное ниже блокирует реализацию на клиенте или приводит к mock-данным.

---

## 1. Изменения в schema.prisma

### 1.1 `Lesson.content` — КРИТИЧНО

**Проблема:** Модель `Lesson` содержит только поле `name`. Нет поля для хранения текста урока.
Плеер урока показывает markdown-контент, Builder позволяет его редактировать — но сохранить некуда.

```prisma
model Lesson {
  // добавить:
  content String @db.Text @default("")
}
```

После этого обновить:
- `POST /lessons` → принимать `{ name, content? }`
- `PATCH /lessons/{id}` → принимать `{ name?, content? }`
- `GET /courses/{id}` → возвращать `lesson.content` внутри шагов

---

### 1.2 `Employee.birthDate` — нужно для профиля

**Проблема:** На странице профиля отображается дата рождения, но поля в схеме нет.

```prisma
model Employee {
  // добавить:
  birthDate DateTime? @map("birth_date") @db.Timestamptz
}
```

---

### 1.3 `Test.passingPercent` — нужно для тест-плеера

**Проблема:** `POST /attempts/{id}/finish` возвращает `passed: boolean`, но порог хардкодом 80%.
У каждого теста должен быть свой минимальный процент прохождения.

```prisma
model Test {
  // добавить:
  passingPercent Int @default(80) @map("passing_percent")
}
```

После этого:
- `POST /test-definitions` → принимать `{ name, passingPercent? }` (default 80)
- `GET /test-definitions/{id}` → возвращать `passingPercent` в DTO
- `POST /attempts/{id}/finish` → использовать `test.passingPercent` вместо хардкода

---

### 1.4 `CourseEnrollment.assignedById` — кто назначил курс

**Проблема:** При прямом назначении курса менеджером нет записи о том, кто это сделал.
Статистика на странице курса хочет показывать «Назначил: Иван Иванов».

```prisma
model CourseEnrollment {
  // добавить:
  assignedById String? @map("assigned_by_id") @db.Uuid
  assignedBy   Employee? @relation("EnrollmentAssignedBy", fields: [assignedById], references: [id], onDelete: SetNull)
}
```

Вернуть `assignedById` в `EnrollmentResponseDto`.
`POST /courses/{id}/enroll` → принимать и сохранять `assignedById` из текущего пользователя.

---

### 1.5 `OnboardingTemplate.@@unique([positionId, divisionId])` — слишком ограничительно

**Проблема:** Ограничение разрешает только один шаблон на связку должность+отдел.
На практике может быть несколько шаблонов для одного отдела (разные менеджеры, разные цели).

```prisma
model OnboardingTemplate {
  // удалить строку:
  @@unique([positionId, divisionId])
}
```

---

## 2. Отсутствующие GET-эндпоинты

### 2.1 Онбординг — всё на mock, потому что нет GET

Весь раздел онбординга на клиенте работает с mock-данными. Схема поддерживает все эти данные — нужны только эндпоинты чтения.

| Эндпоинт | Что возвращает |
|----------|----------------|
| `GET /onboarding/templates` | Пагинированный список шаблонов |
| `GET /onboarding/templates/{id}` | Шаблон со шагами и feedbackOptions |
| `GET /onboardings` | Список назначений с фильтрами (см. ниже) |
| `GET /onboardings/{id}` | Назначение со шагами, feedbackSelections |
| `GET /onboardings/{onboardingId}/chat/messages` | Пагинированная история чата |

**Фильтры для `GET /onboardings`:**
- `?assignedToId={employeeId}` — свои назначения (для сотрудника)
- `?assignedById={employeeId}` — созданные мной (для менеджера)
- `?status=IN_PROGRESS|COMPLETED|CANCELLED`

---

### 2.2 `GET /courses/{id}/enrollments` — нет эндпоинта

**Проблема:** На странице курса есть панель «Статистика прохождения» со списком всех записанных.
Нет способа получить список enrollments для конкретного курса.

**Нужно:** `GET /courses/{id}/enrollments` → пагинированный `EnrollmentResponseDto[]`.

---

## 3. Недостающие данные в существующих эндпоинтах

### 3.1 `EmployeeResponseDto` — нет `email`, `role`, `department`

**Проблема:** `GET /employees` и `GET /employees/{id}` возвращают только:
```
{ id, createdAt, fullname, biography, employmentDate, dismissalDate, divisionId, positionId, avatarId }
```

Отсутствует:
- `email` — из таблицы `users`
- `role: { id, name }` — из `users.role_id → roles`
- `department: { id, name }` — через `divisions.department_id → departments`

Без этих полей невозможно:
- Показать список сотрудников для назначения курса (нет имени отдела и роли)
- Построить фильтрацию по департаменту в модалке назначения
- Отобразить кто подал заявку (нет email)

**Нужно добавить в `EmployeeResponseDto`:**
```json
{
  "email": "ivan@company.com",
  "role": { "id": "uuid", "name": "manager" },
  "department": { "id": "uuid", "name": "Разработка" }
}
```

---

### 3.2 `GET /auth/me` — приводит к водопаду из 4–5 запросов

**Проблема:** Сейчас `GET /auth/me` возвращает только `{ id, email, role: string }`.
Чтобы построить профиль пользователя, клиент делает:
1. `GET /auth/me`
2. `GET /employees/{id}`
3. `GET /divisions/{divisionId}`
4. `GET /departments/{departmentId}`
5. `GET /positions/{positionId}` (если есть)

Это 4–5 последовательных запросов при каждой загрузке приложения.

**Нужно:** обогатить `GET /auth/me` (или добавить `GET /me/profile`) чтобы возвращал:
```json
{
  "id": "...",
  "email": "...",
  "role": { "id": "uuid", "name": "admin" },
  "employee": {
    "id": "...",
    "fullname": "...",
    "biography": null,
    "employmentDate": "2024-01-01",
    "birthDate": null,
    "divisionId": "...",
    "division": { "id": "...", "name": "Backend", "departmentId": "..." },
    "department": { "id": "...", "name": "Разработка" },
    "position": { "id": "...", "name": "Senior Engineer" }
  }
}
```

---

### 3.3 `GET /test-definitions/{id}` — нет `passingPercent`

После добавления `Test.passingPercent` (п. 1.3) он должен возвращаться в `TestDefinitionResponseDto`:
```json
{
  "id": "...",
  "name": "...",
  "passingPercent": 80,
  "questions": [...]
}
```

---

### 3.4 `GET /courses/{id}/applications` — нужен фильтр по статусу

Панель одобрения заявок показывает только PENDING. Сейчас возвращаются все заявки включая APPROVED/REJECTED.

**Нужно:** поддержать `?status=PENDING|APPROVED|REJECTED` query-параметр.

---

## 4. Сводная таблица

| # | Тип | Описание | Приоритет |
|---|-----|----------|-----------|
| 1.1 | Schema + API | `Lesson.content` — поле текста урока | 🔴 Критично |
| 2.1 | API | GET-эндпоинты онбординга (5 штук) | 🔴 Критично |
| 3.1 | API | `EmployeeResponseDto` + email/role/department | 🔴 Критично |
| 3.2 | API | Обогащённый `GET /auth/me` / `GET /me/profile` | 🟠 Высокий |
| 2.2 | API | `GET /courses/{id}/enrollments` | 🟠 Высокий |
| 1.2 | Schema | `Employee.birthDate` | 🟡 Средний |
| 1.3 | Schema + API | `Test.passingPercent` | 🟡 Средний |
| 1.4 | Schema + API | `CourseEnrollment.assignedById` | 🟡 Средний |
| 1.5 | Schema | Убрать unique-ограничение OnboardingTemplate | 🟡 Средний |
| 3.3 | API | `passingPercent` в TestDefinitionResponseDto | 🟡 Средний (зависит от 1.3) |
| 3.4 | API | `?status` фильтр на applications | 🟢 Низкий |
