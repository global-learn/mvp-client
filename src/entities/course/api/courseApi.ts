import type { Course, Enrollment, CreateCourseDto } from '../model/types';
import { getAllItems, calcProgress } from '../model/types';

// ================================================================
// API СЛОЙ — интерфейс к бэкенду
// ================================================================

let mockCourses: Course[] = [
  {
    id: '1',
    title: 'Основы JavaScript',
    description: 'Переменные, функции, объекты, асинхронность. Обязательный базовый курс для всех разработчиков компании.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'employee',
    createdAt: '2024-01-15',
    lessonsCount: 6,
    modules: [
      {
        id: 'm1-1', title: 'Переменные и типы данных',
        steps: [
          {
            id: 's1-1', title: 'Объявление переменных',
            items: [
              {
                id: 'c1-l1', type: 'lesson', title: 'let, const и var',
                content: `# Объявление переменных в JavaScript

В современном JavaScript есть три способа объявить переменную: \`let\`, \`const\` и \`var\`.

## let
Объявляет переменную с блочной областью видимости. Значение можно менять.

\`\`\`js
let count = 0;
count = 1; // OK
\`\`\`

## const
Объявляет константу — значение нельзя переназначить после инициализации.

\`\`\`js
const PI = 3.14;
// PI = 3; // Ошибка!
\`\`\`

## var
Устаревший способ, имеет функциональную область видимости. Избегайте его в новом коде.

**Правило:** используйте \`const\` по умолчанию, \`let\` если значение изменяется, \`var\` — никогда.`,
              },
              {
                id: 'c1-t1', type: 'test', title: 'Тест: переменные',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q1', question: 'Какое ключевое слово используется для объявления константы?',
                    options: [
                      { id: 'o1', text: 'var',   isCorrect: false },
                      { id: 'o2', text: 'let',   isCorrect: false },
                      { id: 'o3', text: 'const', isCorrect: true  },
                      { id: 'o4', text: 'final', isCorrect: false },
                    ],
                  },
                  {
                    id: 'q2', question: 'Какая область видимости у переменной, объявленной через let?',
                    options: [
                      { id: 'o5', text: 'Глобальная',           isCorrect: false },
                      { id: 'o6', text: 'Функциональная',        isCorrect: false },
                      { id: 'o7', text: 'Блочная',               isCorrect: true  },
                      { id: 'o8', text: 'Нет области видимости', isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 's1-2', title: 'Типы данных',
            items: [
              {
                id: 'c1-l2', type: 'lesson', title: 'Примитивные типы',
                content: `# Примитивные типы данных

JavaScript имеет 7 примитивных типов:

- **string** — строки: \`"привет"\`, \`'мир'\`, \`\`шаблон \${переменная}\`\`
- **number** — числа: \`42\`, \`3.14\`, \`Infinity\`, \`NaN\`
- **boolean** — булевы: \`true\` / \`false\`
- **null** — намеренное отсутствие значения
- **undefined** — значение не присвоено
- **symbol** — уникальный идентификатор
- **bigint** — целые числа произвольного размера

## Проверка типа
Используйте оператор \`typeof\`:

\`\`\`js
typeof "hello"   // "string"
typeof 42        // "number"
typeof true      // "boolean"
typeof undefined // "undefined"
typeof null      // "object" ← историческая ошибка JS!
\`\`\``,
              },
              {
                id: 'c1-t2', type: 'test', title: 'Тест: типы данных',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q3', question: 'Что вернёт typeof null?',
                    options: [
                      { id: 'o9',  text: '"null"',    isCorrect: false },
                      { id: 'o10', text: '"object"',  isCorrect: true  },
                      { id: 'o11', text: '"boolean"', isCorrect: false },
                      { id: 'o12', text: 'undefined', isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'm1-2', title: 'Функции',
        steps: [
          {
            id: 's1-3', title: 'Объявление и вызов',
            items: [
              {
                id: 'c1-l3', type: 'lesson', title: 'Функции в JavaScript',
                content: `# Функции в JavaScript

Функция — многоразовый блок кода, выполняющий определённую задачу.

## Объявление функции
\`\`\`js
function greet(name) {
  return "Привет, " + name + "!";
}
console.log(greet("Мир")); // "Привет, Мир!"
\`\`\`

## Стрелочная функция (ES6)
\`\`\`js
const greet = (name) => "Привет, " + name + "!";
// Или с несколькими строками:
const add = (a, b) => {
  return a + b;
};
\`\`\`

## Параметры по умолчанию
\`\`\`js
function greet(name = "гость") {
  return "Привет, " + name;
}
greet();       // "Привет, гость"
greet("Иван"); // "Привет, Иван"
\`\`\``,
              },
              {
                id: 'c1-t3', type: 'test', title: 'Тест: функции',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q4', question: 'Как называется синтаксис "() => {}" ?',
                    options: [
                      { id: 'o13', text: 'Анонимная функция', isCorrect: false },
                      { id: 'o14', text: 'Стрелочная функция', isCorrect: true  },
                      { id: 'o15', text: 'Лямбда-функция',    isCorrect: false },
                      { id: 'o16', text: 'Генератор',          isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: '2',
    title: 'React для начинающих',
    description: 'Компоненты, хуки, роутинг. Практический курс — строим реальный портал обучения.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'employee',
    createdAt: '2024-02-10',
    lessonsCount: 5,
    modules: [
      {
        id: 'm2-1', title: 'Основы компонентов',
        steps: [
          {
            id: 's2-1', title: 'Компоненты и JSX',
            items: [
              {
                id: 'c2-l1', type: 'lesson', title: 'Что такое React-компонент',
                content: `# React-компоненты

Компонент — это функция, возвращающая JSX (расширение синтаксиса JS, похожее на HTML).

## Функциональный компонент
\`\`\`jsx
function Button({ label, onClick }) {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
}
\`\`\`

## Правила компонентов
1. Имя компонента начинается с **заглавной** буквы
2. Возвращает **один** корневой элемент (или Fragment \`<></>\`)
3. Пропсы — объект только для чтения (не мутируйте!)

## JSX — это не HTML
- Атрибуты в camelCase: \`onClick\`, \`className\`, \`htmlFor\`
- Самозакрывающиеся теги обязательны: \`<br />\`, \`<input />\`
- Выражения JS оборачиваются в \`{}\``,
              },
              {
                id: 'c2-t1', type: 'test', title: 'Тест: компоненты',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q5', question: 'С чего должно начинаться имя React-компонента?',
                    options: [
                      { id: 'o17', text: 'Со строчной буквы',    isCorrect: false },
                      { id: 'o18', text: 'С заглавной буквы',    isCorrect: true  },
                      { id: 'o19', text: 'С символа $',          isCorrect: false },
                      { id: 'o20', text: 'С ключевого слова use', isCorrect: false },
                    ],
                  },
                  {
                    id: 'q6', question: 'Какой атрибут используется вместо class в JSX?',
                    options: [
                      { id: 'o21', text: 'class',     isCorrect: false },
                      { id: 'o22', text: 'classList', isCorrect: false },
                      { id: 'o23', text: 'className', isCorrect: true  },
                      { id: 'o24', text: 'cssClass',  isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 's2-2', title: 'Хуки состояния',
            items: [
              {
                id: 'c2-l2', type: 'lesson', title: 'useState и useEffect',
                content: `# Основные хуки React

## useState — локальное состояние
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Нажато: {count}
    </button>
  );
}
\`\`\`
\`useState\` возвращает пару: **текущее значение** и **функцию-сеттер**.

## useEffect — побочные эффекты
\`\`\`jsx
import { useEffect } from 'react';

useEffect(() => {
  document.title = "Новый заголовок";
}, []); // [] = запустить один раз при монтировании
\`\`\`

### Зависимости useEffect
- \`[]\` → один раз при монтировании
- \`[value]\` → при изменении \`value\`
- без второго аргумента → при каждом рендере`,
              },
              {
                id: 'c2-t2', type: 'test', title: 'Тест: хуки',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q7', question: 'Что возвращает useState?',
                    options: [
                      { id: 'o25', text: 'Только текущее значение',       isCorrect: false },
                      { id: 'o26', text: 'Пару [значение, сеттер]',       isCorrect: true  },
                      { id: 'o27', text: 'Только функцию-сеттер',         isCorrect: false },
                      { id: 'o28', text: 'Объект { value, setValue }',    isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'm2-2', title: 'Роутинг',
        steps: [
          {
            id: 's2-3', title: 'React Router',
            items: [
              {
                id: 'c2-l3', type: 'lesson', title: 'Навигация в React',
                content: `# React Router v6

React Router — стандартная библиотека маршрутизации.

## Базовая настройка
\`\`\`jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/courses"  element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

## Навигация
\`\`\`jsx
import { Link, useNavigate } from 'react-router-dom';

// Декларативная навигация:
<Link to="/courses">Все курсы</Link>

// Программная навигация:
const navigate = useNavigate();
navigate('/dashboard');
\`\`\`

## Параметры маршрута
\`\`\`jsx
import { useParams } from 'react-router-dom';
const { id } = useParams(); // /courses/42 → id === "42"
\`\`\``,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: '3',
    title: 'Git и командная разработка',
    description: 'Ветки, мёрж, конфликты, pull requests. Как продуктивно работать в команде.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'all',
    createdAt: '2024-03-05',
    lessonsCount: 4,
    modules: [
      {
        id: 'm3-1', title: 'Основы Git',
        steps: [
          {
            id: 's3-1', title: 'Первые шаги',
            items: [
              {
                id: 'c3-l1', type: 'lesson', title: 'Инициализация и первый коммит',
                content: `# Git: система контроля версий

Git отслеживает изменения в файлах и позволяет совместно работать над кодом.

## Начало работы
\`\`\`bash
git init              # Инициализировать репозиторий
git status            # Посмотреть состояние файлов
git add .             # Добавить все файлы в индекс
git commit -m "init"  # Создать коммит
\`\`\`

## Три состояния файла в Git
1. **Рабочая директория** — файлы с изменениями
2. **Индекс (Staging area)** — файлы подготовлены к коммиту (\`git add\`)
3. **Репозиторий** — сохранённые коммиты (\`git commit\`)

## Полезные команды
\`\`\`bash
git log --oneline     # История коммитов
git diff              # Что изменилось
git restore file.txt  # Отменить изменения в файле
\`\`\``,
              },
              {
                id: 'c3-t1', type: 'test', title: 'Тест: основы Git',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q8', question: 'Какая команда добавляет файлы в индекс (staging area)?',
                    options: [
                      { id: 'o29', text: 'git commit', isCorrect: false },
                      { id: 'o30', text: 'git push',   isCorrect: false },
                      { id: 'o31', text: 'git add',    isCorrect: true  },
                      { id: 'o32', text: 'git init',   isCorrect: false },
                    ],
                  },
                  {
                    id: 'q9', question: 'Что делает команда git status?',
                    options: [
                      { id: 'o33', text: 'Создаёт коммит',                   isCorrect: false },
                      { id: 'o34', text: 'Показывает состояние файлов',       isCorrect: true  },
                      { id: 'o35', text: 'Отправляет изменения на сервер',    isCorrect: false },
                      { id: 'o36', text: 'Инициализирует репозиторий',        isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 's3-2', title: 'Ветки',
            items: [
              {
                id: 'c3-l2', type: 'lesson', title: 'Ветки и слияние',
                content: `# Ветки в Git

Ветка — параллельная линия разработки. В команде каждая задача делается в отдельной ветке.

## Работа с ветками
\`\`\`bash
git branch                  # Список веток
git checkout -b feature/auth # Создать и переключиться
git checkout main            # Вернуться в main
git merge feature/auth       # Слить ветку в текущую
git branch -d feature/auth   # Удалить ветку
\`\`\`

## Конфликты
Конфликт возникает, когда два человека изменили одно место в файле.
Git помечает конфликт так:
\`\`\`
<<<<<<< HEAD
Ваши изменения
=======
Чужие изменения
>>>>>>> feature/auth
\`\`\`
Нужно вручную выбрать нужный вариант и сделать коммит.

## Pull Request
Pull Request (PR) — запрос на слияние ветки. Коллеги делают код-ревью перед мёржем.`,
              },
              {
                id: 'c3-t2', type: 'test', title: 'Тест: ветки',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q10', question: 'Какая команда создаёт и сразу переключается на новую ветку?',
                    options: [
                      { id: 'o37', text: 'git branch new',         isCorrect: false },
                      { id: 'o38', text: 'git checkout -b new',    isCorrect: true  },
                      { id: 'o39', text: 'git switch new',         isCorrect: false },
                      { id: 'o40', text: 'git create branch new',  isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: '4',
    title: 'Введение в продукт для клиентов',
    description: 'Обзор возможностей платформы. Как пользоваться порталом обучения и отслеживать прогресс.',
    authorId: 'user-admin',
    status: 'published',
    courseType: 'client',
    createdAt: '2024-04-01',
    lessonsCount: 3,
    modules: [
      {
        id: 'm4-1', title: 'Знакомство с GlobalLearn',
        steps: [
          {
            id: 's4-1', title: 'Навигация по платформе',
            items: [
              {
                id: 'c4-l1', type: 'lesson', title: 'Как устроен портал',
                content: `# Добро пожаловать в GlobalLearn!

GlobalLearn — корпоративная платформа для обучения. Здесь вы найдёте все курсы, назначенные вашей компанией.

## Основные разделы
- **Главная (Dashboard)** — текущий прогресс, продолжение обучения, статистика
- **Курсы** — каталог доступных вам курсов
- **Профиль** — настройки аккаунта и аватар

## Как начать курс
1. Перейдите в раздел **Курсы**
2. Выберите нужный курс
3. Нажмите **Записаться на курс**
4. Проходите уроки и тесты по порядку

## Прогресс
После прохождения каждого урока ваш прогресс обновляется автоматически. Следите за ним на главной странице.`,
              },
              {
                id: 'c4-t1', type: 'test', title: 'Тест: знание платформы',
                passingPercent: 50,
                questions: [
                  {
                    id: 'q11', question: 'Где можно посмотреть текущий прогресс по курсам?',
                    options: [
                      { id: 'o41', text: 'Только в разделе Профиль', isCorrect: false },
                      { id: 'o42', text: 'На главной странице (Dashboard)', isCorrect: true  },
                      { id: 'o43', text: 'Нет такой возможности',     isCorrect: false },
                      { id: 'o44', text: 'В настройках',              isCorrect: false },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 's4-2', title: 'Отслеживание прогресса',
            items: [
              {
                id: 'c4-l2', type: 'lesson', title: 'Как работает прогресс',
                content: `# Отслеживание прогресса

## Что считается прогрессом?
Ваш прогресс по курсу складывается из:
- **Пройденных уроков** — нажмите «Отметить пройденным» после прочтения
- **Пройденных тестов** — правильно ответьте на вопросы теста

## Статусы курса
- 🔵 **В процессе** — вы начали, но ещё не завершили
- 🟢 **Завершён** — все уроки и тесты пройдены, получен 100%

## Советы
- Не пропускайте тесты — они закрепляют материал
- Если не прошли тест с первого раза — перечитайте урок и попробуйте снова
- Все ваши результаты сохраняются автоматически`,
              },
            ],
          },
        ],
      },
    ],
  },
];

let mockEnrollments: Enrollment[] = [];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const courseApi = {
  async getCourses(): Promise<Course[]> {
    await delay(300);
    return mockCourses.filter(c => c.status === 'published');
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    await delay(200);
    return mockCourses.find(c => c.id === id);
  },

  async createCourse(dto: CreateCourseDto): Promise<Course> {
    await delay(400);
    const newCourse: Course = {
      ...dto,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockCourses = [...mockCourses, newCourse];
    return newCourse;
  },

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    await delay(200);
    return mockEnrollments.filter(e => e.userId === userId);
  },

  async enroll(courseId: string, userId: string): Promise<Enrollment> {
    await delay(300);
    const existing = mockEnrollments.find(e => e.courseId === courseId && e.userId === userId);
    if (existing) return existing;
    const enrollment: Enrollment = {
      courseId, userId,
      status: 'in_progress',
      progress: 0,
      completedItems: [],
    };
    mockEnrollments = [...mockEnrollments, enrollment];
    return enrollment;
  },

  async assignCourse(courseId: string, userId: string): Promise<Enrollment> {
    await delay(200);
    return this.enroll(courseId, userId);
  },

  /** Пометить элемент курса (урок или тест) как пройденный и пересчитать прогресс */
  async markItemComplete(courseId: string, userId: string, itemId: string): Promise<Enrollment> {
    await delay(150);
    const idx = mockEnrollments.findIndex(e => e.courseId === courseId && e.userId === userId);
    if (idx === -1) throw new Error('Enrollment not found');

    const enrollment = mockEnrollments[idx];
    if (enrollment.completedItems.includes(itemId)) return enrollment;

    const completedItems = [...enrollment.completedItems, itemId];
    const course = mockCourses.find(c => c.id === courseId);
    const progress = course ? calcProgress(course, completedItems) : enrollment.progress;
    const status = progress >= 100 ? 'completed' : 'in_progress';

    const updated: Enrollment = { ...enrollment, completedItems, progress, status };
    mockEnrollments = [
      ...mockEnrollments.slice(0, idx),
      updated,
      ...mockEnrollments.slice(idx + 1),
    ];
    return updated;
  },
};
