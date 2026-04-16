import type { Course, Enrollment, CreateCourseDto, EmployeeForAssignment, Module } from '../model/types';

// ================================================================
// API СЛОЙ — интерфейс к бэкенду
// ================================================================
// Сейчас: возвращает мок-данные с симуляцией задержки.
// Когда появится бэкенд — меняешь реализацию функций, НЕ их сигнатуры.

// ---- Мок-модули ----
const MOCK_MODULES: Record<string, Module[]> = {
  '1': [
    {
      id: 'm1-1',
      title: 'Введение в JavaScript',
      steps: [
        {
          id: 's1-1-1',
          title: 'Переменные и типы данных',
          items: [{
            id: 'i1-1-1-1', type: 'lesson', title: 'Переменные и типы данных',
            content: `## Переменные

В JavaScript есть три способа объявить переменную:

\`\`\`js
var x = 1;   // устаревший способ, избегайте
let y = 2;   // блочная область видимости
const z = 3; // константа, нельзя переопределить
\`\`\`

### Типы данных

JavaScript — динамически типизированный язык. Основные типы:

| Тип | Пример |
|-----|--------|
| \`string\` | \`"Привет"\` |
| \`number\` | \`42\`, \`3.14\` |
| \`boolean\` | \`true\`, \`false\` |
| \`null\` | \`null\` |
| \`undefined\` | \`undefined\` |
| \`object\` | \`{ name: "Иван" }\` |

### Проверка типа

Используйте оператор \`typeof\`:

\`\`\`js
typeof "hello"  // "string"
typeof 42       // "number"
typeof true     // "boolean"
typeof null     // "object" (историческая особенность JS)
\`\`\`

> **Совет:** Всегда используйте \`const\` по умолчанию, \`let\` — когда переменная должна меняться.`,
          }],
        },
        {
          id: 's1-1-2',
          title: 'Тест: переменные',
          items: [{
            id: 'i1-1-2-1', type: 'test', title: 'Тест: переменные',
            passingPercent: 60,
            questions: [
              {
                id: 'q1', question: 'Какое ключевое слово создаёт блочную константу?',
                options: [
                  { id: 'o1', text: 'var', isCorrect: false },
                  { id: 'o2', text: 'let', isCorrect: false },
                  { id: 'o3', text: 'const', isCorrect: true },
                  { id: 'o4', text: 'static', isCorrect: false },
                ],
              },
              {
                id: 'q2', question: 'Что вернёт typeof null?',
                options: [
                  { id: 'o5', text: '"null"', isCorrect: false },
                  { id: 'o6', text: '"object"', isCorrect: true },
                  { id: 'o7', text: '"undefined"', isCorrect: false },
                  { id: 'o8', text: '"boolean"', isCorrect: false },
                ],
              },
            ],
          }],
        },
        {
          id: 's1-1-3',
          title: 'Функции',
          items: [{
            id: 'i1-1-3-1', type: 'lesson', title: 'Функции',
            content: `## Функции в JavaScript

### Объявление функции

\`\`\`js
function greet(name) {
  return "Привет, " + name + "!";
}
\`\`\`

### Функциональное выражение

\`\`\`js
const greet = function(name) {
  return \`Привет, \${name}!\`;
};
\`\`\`

### Стрелочные функции (ES6+)

\`\`\`js
const greet = (name) => \`Привет, \${name}!\`;

// Без скобок, если один параметр:
const double = n => n * 2;

// Без return, если одно выражение:
const add = (a, b) => a + b;
\`\`\`

### Параметры по умолчанию

\`\`\`js
function greet(name = "Мир") {
  return \`Привет, \${name}!\`;
}
greet();        // "Привет, Мир!"
greet("Иван"); // "Привет, Иван!"
\`\`\`

### Замыкания

Функция "помнит" переменные из окружающей области видимости:

\`\`\`js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
\`\`\``,
          }],
        },
        {
          id: 's1-1-4',
          title: 'Тест: функции',
          items: [{
            id: 'i1-1-4-1', type: 'test', title: 'Тест: функции',
            passingPercent: 60,
            questions: [
              {
                id: 'q3', question: 'Как записать стрелочную функцию с одним параметром и одним выражением?',
                options: [
                  { id: 'o9',  text: 'const f = (x) => { return x * 2; }', isCorrect: false },
                  { id: 'o10', text: 'const f = x => x * 2', isCorrect: true },
                  { id: 'o11', text: 'function f(x) => x * 2', isCorrect: false },
                  { id: 'o12', text: 'const f = x -> x * 2', isCorrect: false },
                ],
              },
              {
                id: 'q4', question: 'Что такое замыкание?',
                options: [
                  { id: 'o13', text: 'Функция, которая вызывает себя', isCorrect: false },
                  { id: 'o14', text: 'Функция с доступом к переменным из внешней области видимости', isCorrect: true },
                  { id: 'o15', text: 'Функция без параметров', isCorrect: false },
                  { id: 'o16', text: 'Анонимная функция', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      id: 'm1-2',
      title: 'Объекты и массивы',
      steps: [
        {
          id: 's1-2-1',
          title: 'Объекты',
          items: [{
            id: 'i1-2-1-1', type: 'lesson', title: 'Объекты',
            content: `## Объекты

Объект — набор пар ключ-значение:

\`\`\`js
const user = {
  name: "Иван",
  age: 30,
  isAdmin: false,
};

// Доступ к свойствам
console.log(user.name);       // "Иван"
console.log(user["age"]);     // 30

// Изменение и добавление
user.age = 31;
user.email = "ivan@mail.ru";
\`\`\`

### Деструктуризация

\`\`\`js
const { name, age } = user;
// Переименование:
const { name: userName } = user;
// Значение по умолчанию:
const { role = "employee" } = user;
\`\`\`

### Spread-оператор

\`\`\`js
const updated = { ...user, age: 32 };
const merged  = { ...obj1, ...obj2 };
\`\`\`

### Методы объекта

\`\`\`js
const calc = {
  value: 0,
  add(n) { this.value += n; return this; },
  result() { return this.value; },
};
calc.add(5).add(3).result(); // 8
\`\`\``,
          }],
        },
        {
          id: 's1-2-2',
          title: 'Массивы и методы',
          items: [{
            id: 'i1-2-2-1', type: 'lesson', title: 'Массивы и методы',
            content: `## Массивы

\`\`\`js
const fruits = ["яблоко", "банан", "апельсин"];
fruits.length; // 3
fruits[0];     // "яблоко"
\`\`\`

### Основные методы

| Метод | Описание |
|-------|----------|
| \`push(x)\` | Добавить в конец |
| \`pop()\` | Удалить из конца |
| \`shift()\` | Удалить из начала |
| \`unshift(x)\` | Добавить в начало |
| \`slice(a,b)\` | Вырезать подмассив |
| \`splice(i,n)\` | Удалить n элементов с позиции i |

### Функциональные методы

\`\`\`js
const nums = [1, 2, 3, 4, 5];

nums.map(n => n * 2);          // [2, 4, 6, 8, 10]
nums.filter(n => n % 2 === 0); // [2, 4]
nums.reduce((acc, n) => acc + n, 0); // 15
nums.find(n => n > 3);         // 4
nums.some(n => n > 4);         // true
nums.every(n => n > 0);        // true
\`\`\`

> **Золотое правило:** \`map\`, \`filter\`, \`reduce\` не изменяют исходный массив.`,
          }],
        },
        {
          id: 's1-2-3',
          title: 'Деструктуризация и spread',
          items: [{
            id: 'i1-2-3-1', type: 'lesson', title: 'Деструктуризация и spread',
            content: `## Деструктуризация массивов

\`\`\`js
const [first, second, ...rest] = [1, 2, 3, 4, 5];
first;  // 1
second; // 2
rest;   // [3, 4, 5]

// Пропуск элементов:
const [,, third] = [1, 2, 3];
third; // 3
\`\`\`

## Spread-оператор

\`\`\`js
const a = [1, 2];
const b = [3, 4];
const merged = [...a, ...b];  // [1, 2, 3, 4]

// Копия массива:
const copy = [...a];

// Передача массива как аргументов:
Math.max(...[1, 5, 3]); // 5
\`\`\`

## Rest-параметры в функциях

\`\`\`js
function sum(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4); // 10
\`\`\``,
          }],
        },
        {
          id: 's1-2-4',
          title: 'Тест: объекты и массивы',
          items: [{
            id: 'i1-2-4-1', type: 'test', title: 'Тест: объекты и массивы',
            passingPercent: 60,
            questions: [
              {
                id: 'q5', question: 'Какой метод массива создаёт новый массив с преобразованными элементами?',
                options: [
                  { id: 'o17', text: 'filter', isCorrect: false },
                  { id: 'o18', text: 'map', isCorrect: true },
                  { id: 'o19', text: 'reduce', isCorrect: false },
                  { id: 'o20', text: 'forEach', isCorrect: false },
                ],
              },
              {
                id: 'q6', question: 'Что делает spread-оператор (...) применительно к объекту?',
                options: [
                  { id: 'o21', text: 'Удаляет все свойства объекта', isCorrect: false },
                  { id: 'o22', text: 'Создаёт поверхностную копию свойств объекта', isCorrect: true },
                  { id: 'o23', text: 'Замораживает объект (делает неизменяемым)', isCorrect: false },
                  { id: 'o24', text: 'Конвертирует объект в массив', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      id: 'm1-3',
      title: 'Асинхронность',
      steps: [
        {
          id: 's1-3-1',
          title: 'Callbacks и Event Loop',
          items: [{
            id: 'i1-3-1-1', type: 'lesson', title: 'Callbacks и Event Loop',
            content: `## Event Loop

JavaScript — однопоточный язык. Асинхронный код выполняется через **Event Loop**:

1. Синхронный код выполняется сразу
2. Асинхронные операции (таймеры, запросы) уходят в очередь
3. Event Loop берёт задачи из очереди, когда стек пуст

## Callbacks

Функция, передаваемая как аргумент для вызова позже:

\`\`\`js
setTimeout(() => {
  console.log("Выполнится через 1 секунду");
}, 1000);

console.log("Выполнится сразу");
// Порядок: "Выполнится сразу" → "Выполнится через 1 секунду"
\`\`\`

### Callback hell — проблема вложенности

\`\`\`js
getUserData(id, (user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      // Три уровня вложенности — сложно читать и поддерживать
    });
  });
});
\`\`\`

> Для решения этой проблемы появились **Promise**.`,
          }],
        },
        {
          id: 's1-3-2',
          title: 'Промисы',
          items: [{
            id: 'i1-3-2-1', type: 'lesson', title: 'Промисы (Promise)',
            content: `## Promise

Promise — объект, представляющий результат асинхронной операции. Имеет три состояния: **pending**, **fulfilled**, **rejected**.

\`\`\`js
const promise = new Promise((resolve, reject) => {
  // Асинхронная операция
  if (успех) resolve(данные);
  else reject(ошибка);
});

promise
  .then(данные => console.log(данные))
  .catch(ошибка => console.error(ошибка))
  .finally(() => console.log("В любом случае"));
\`\`\`

### Цепочки промисов

\`\`\`js
fetch("/api/user")
  .then(res => res.json())
  .then(user => fetch(\`/api/orders/\${user.id}\`))
  .then(res => res.json())
  .then(orders => console.log(orders))
  .catch(err => console.error(err));
\`\`\`

### Promise.all — параллельное выполнение

\`\`\`js
const [users, orders] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/orders").then(r => r.json()),
]);
\`\`\``,
          }],
        },
        {
          id: 's1-3-3',
          title: 'Async/Await',
          items: [{
            id: 'i1-3-3-1', type: 'lesson', title: 'Async/Await',
            content: `## Async/Await

Синтаксический сахар над Promise — код выглядит как синхронный:

\`\`\`js
async function loadUser(id) {
  try {
    const res  = await fetch(\`/api/users/\${id}\`);
    const user = await res.json();
    return user;
  } catch (error) {
    console.error("Ошибка:", error);
    throw error;
  }
}
\`\`\`

### Правила

- \`await\` можно использовать только внутри \`async\`-функции
- \`async\`-функция **всегда** возвращает Promise
- \`await\` разворачивает Promise и возвращает его значение
- Ошибки ловятся через \`try/catch\`

### Параллельное выполнение

\`\`\`js
// ❌ Последовательно (медленно):
const a = await fetchA();
const b = await fetchB();

// ✅ Параллельно (быстро):
const [a, b] = await Promise.all([fetchA(), fetchB()]);
\`\`\``,
          }],
        },
        {
          id: 's1-3-4',
          title: 'Итоговый тест',
          items: [{
            id: 'i1-3-4-1', type: 'test', title: 'Итоговый тест по асинхронности',
            passingPercent: 60,
            questions: [
              {
                id: 'q7', question: 'Что такое Event Loop?',
                options: [
                  { id: 'o25', text: 'Встроенный цикл for в JavaScript', isCorrect: false },
                  { id: 'o26', text: 'Механизм обработки асинхронных задач из очереди', isCorrect: true },
                  { id: 'o27', text: 'Способ обхода массива', isCorrect: false },
                  { id: 'o28', text: 'Системный поток выполнения', isCorrect: false },
                ],
              },
              {
                id: 'q8', question: 'Что делает Promise.all()?',
                options: [
                  { id: 'o29', text: 'Выполняет промисы последовательно', isCorrect: false },
                  { id: 'o30', text: 'Возвращает первый завершившийся промис', isCorrect: false },
                  { id: 'o31', text: 'Ждёт завершения всех промисов параллельно', isCorrect: true },
                  { id: 'o32', text: 'Игнорирует ошибки в промисах', isCorrect: false },
                ],
              },
              {
                id: 'q9', question: 'Какой синтаксис корректен для обработки ошибок с async/await?',
                options: [
                  { id: 'o33', text: 'await fn().catch(e => ...)', isCorrect: false },
                  { id: 'o34', text: 'try { await fn() } catch(e) { ... }', isCorrect: true },
                  { id: 'o35', text: 'async fn().error(e => ...)', isCorrect: false },
                  { id: 'o36', text: 'await.catch fn()', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
  ],

  '2': [
    {
      id: 'm2-1',
      title: 'Основы React',
      steps: [
        {
          id: 's2-1-1',
          title: 'Компоненты и JSX',
          items: [{
            id: 'i2-1-1-1', type: 'lesson', title: 'Компоненты и JSX',
            content: `## Компоненты

React-приложение — дерево компонентов. Компонент — функция, возвращающая JSX:

\`\`\`jsx
function Button({ label, onClick }) {
  return (
    <button onClick={onClick} className="btn">
      {label}
    </button>
  );
}
\`\`\`

## JSX

JSX — синтаксическое расширение JS, похожее на HTML:

\`\`\`jsx
// Правила JSX:
// 1. Один корневой элемент (или <>...</>)
// 2. className вместо class
// 3. Закрывать самозакрывающиеся теги: <br />
// 4. Выражения в фигурных скобках: {2 + 2}

const element = (
  <>
    <h1>Привет, {name}!</h1>
    <p style={{ color: "red" }}>Текст</p>
    <img src={url} alt="Картинка" />
  </>
);
\`\`\`

## Props

Props — неизменяемые данные, передаваемые от родителя к потомку:

\`\`\`jsx
<UserCard name="Иван" age={30} isAdmin />
// isAdmin без значения === isAdmin={true}
\`\`\``,
          }],
        },
        {
          id: 's2-1-2',
          title: 'State и useState',
          items: [{
            id: 'i2-1-2-1', type: 'lesson', title: 'State и хук useState',
            content: `## useState

Хук для локального состояния компонента:

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(prev => prev - 1)}>-1</button>
    </div>
  );
}
\`\`\`

### Правила

- Вызывайте хуки **только на верхнем уровне** (не внутри if/loop)
- Вызывайте хуки **только внутри React-компонентов**
- Вызов \`setX()\` **перерисовывает** компонент

### Объектный стейт

\`\`\`jsx
const [form, setForm] = useState({ name: "", email: "" });

// Обновление: создаём новый объект со spread
const handleChange = (field, value) => {
  setForm(prev => ({ ...prev, [field]: value }));
};
\`\`\``,
          }],
        },
        {
          id: 's2-1-3',
          title: 'Тест: компоненты и state',
          items: [{
            id: 'i2-1-3-1', type: 'test', title: 'Тест: компоненты и state',
            passingPercent: 60,
            questions: [
              {
                id: 'q10', question: 'Что должна возвращать функция-компонент React?',
                options: [
                  { id: 'o37', text: 'Строку или null', isCorrect: false },
                  { id: 'o38', text: 'JSX (или null)', isCorrect: true },
                  { id: 'o39', text: 'HTML-объект', isCorrect: false },
                  { id: 'o40', text: 'Обязательно один div', isCorrect: false },
                ],
              },
              {
                id: 'q11', question: 'Как правильно обновить объект в useState?',
                options: [
                  { id: 'o41', text: 'state.field = value; setState(state)', isCorrect: false },
                  { id: 'o42', text: 'setState(prev => ({ ...prev, field: value }))', isCorrect: true },
                  { id: 'o43', text: 'Object.assign(state, { field: value })', isCorrect: false },
                  { id: 'o44', text: 'setState.field = value', isCorrect: false },
                ],
              },
            ],
          }],
        },
        {
          id: 's2-1-4',
          title: 'Условный рендеринг и списки',
          items: [{
            id: 'i2-1-4-1', type: 'lesson', title: 'Условный рендеринг и списки',
            content: `## Условный рендеринг

\`\`\`jsx
// Оператор &&
{isLoggedIn && <Dashboard />}

// Тернарный оператор
{isAdmin ? <AdminPanel /> : <UserPanel />}

// Ранний return
function Component({ user }) {
  if (!user) return <Spinner />;
  return <Profile user={user} />;
}
\`\`\`

## Списки

\`\`\`jsx
const users = [
  { id: 1, name: "Иван" },
  { id: 2, name: "Мария" },
];

function UserList() {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

> **Важно:** Атрибут \`key\` обязателен при рендеринге списков. Используйте уникальный ID, не индекс массива.`,
          }],
        },
      ],
    },
    {
      id: 'm2-2',
      title: 'Хуки и роутинг',
      steps: [
        {
          id: 's2-2-1',
          title: 'useEffect',
          items: [{
            id: 'i2-2-1-1', type: 'lesson', title: 'Хук useEffect',
            content: `## useEffect

Выполняет побочные эффекты: запросы, подписки, таймеры.

\`\`\`jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Эффект выполняется после рендера
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser);

    // Функция очистки (cleanup)
    return () => {
      // Вызывается при размонтировании или до следующего эффекта
    };
  }, [userId]); // Зависимости: эффект запускается при изменении userId

  if (!user) return <p>Загрузка...</p>;
  return <div>{user.name}</div>;
}
\`\`\`

### Варианты массива зависимостей

| Зависимости | Когда запускается |
|-------------|-------------------|
| \`[]\` | Только при монтировании |
| \`[a, b]\` | При монтировании и изменении a или b |
| *(нет)*  | После каждого рендера |`,
          }],
        },
        {
          id: 's2-2-2',
          title: 'Context API',
          items: [{
            id: 'i2-2-2-1', type: 'lesson', title: 'Context API',
            content: `## Контекст

Context позволяет передавать данные через дерево компонентов без явного пробрасывания props:

\`\`\`jsx
import { createContext, useContext, useState } from 'react';

// 1. Создаём контекст
const ThemeContext = createContext('light');

// 2. Провайдер оборачивает дерево
function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <MainContent />
    </ThemeContext.Provider>
  );
}

// 3. Потребитель читает через хук
function Button() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Тема: {theme}
    </button>
  );
}
\`\`\`

> Context подходит для глобальных данных: авторизация, тема, язык. Для сложной логики используйте Redux или Zustand.`,
          }],
        },
        {
          id: 's2-2-3',
          title: 'React Router',
          items: [{
            id: 'i2-2-3-1', type: 'lesson', title: 'React Router',
            content: `## React Router v7

\`\`\`jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/courses">Курсы</Link>
      </nav>
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/courses"   element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

### Параметры и навигация

\`\`\`jsx
// Читать параметры URL:
const { id } = useParams<{ id: string }>();

// Программная навигация:
const navigate = useNavigate();
navigate('/courses');
navigate(-1); // назад
navigate('/login', { replace: true }); // без записи в историю
\`\`\``,
          }],
        },
        {
          id: 's2-2-4',
          title: 'Итоговый тест',
          items: [{
            id: 'i2-2-4-1', type: 'test', title: 'Итоговый тест по React',
            passingPercent: 60,
            questions: [
              {
                id: 'q12', question: 'Что означает пустой массив зависимостей [] в useEffect?',
                options: [
                  { id: 'o45', text: 'Эффект не запускается никогда', isCorrect: false },
                  { id: 'o46', text: 'Эффект запускается только при монтировании', isCorrect: true },
                  { id: 'o47', text: 'Эффект запускается при каждом рендере', isCorrect: false },
                  { id: 'o48', text: 'Эффект запускается при размонтировании', isCorrect: false },
                ],
              },
              {
                id: 'q13', question: 'Для чего используется Context API?',
                options: [
                  { id: 'o49', text: 'Для стилизации компонентов', isCorrect: false },
                  { id: 'o50', text: 'Для передачи данных без явного пробрасывания props', isCorrect: true },
                  { id: 'o51', text: 'Для асинхронных запросов', isCorrect: false },
                  { id: 'o52', text: 'Для работы с роутером', isCorrect: false },
                ],
              },
              {
                id: 'q14', question: 'Как прочитать параметр :id из URL /courses/42?',
                options: [
                  { id: 'o53', text: 'window.location.params.id', isCorrect: false },
                  { id: 'o54', text: 'useParams().id', isCorrect: true },
                  { id: 'o55', text: 'useSearchParams("id")', isCorrect: false },
                  { id: 'o56', text: 'props.match.id', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
  ],

  '3': [
    {
      id: 'm3-1',
      title: 'Основы Git',
      steps: [
        {
          id: 's3-1-1',
          title: 'Инициализация и коммиты',
          items: [{
            id: 'i3-1-1-1', type: 'lesson', title: 'Инициализация и коммиты',
            content: `## Git — система контроля версий

Git отслеживает изменения в файлах и позволяет откатываться к любому состоянию.

### Настройка

\`\`\`bash
git config --global user.name  "Иван Иванов"
git config --global user.email "ivan@mail.ru"
\`\`\`

### Инициализация репозитория

\`\`\`bash
git init          # Создать новый репозиторий
git clone <url>   # Клонировать существующий
\`\`\`

### Рабочий процесс

\`\`\`bash
git status                  # Состояние файлов
git add file.txt            # Добавить файл в индекс
git add .                   # Добавить все изменения
git commit -m "feat: добавить кнопку"  # Создать коммит
git log --oneline           # История коммитов
\`\`\`

### Три состояния файла

1. **Untracked/Modified** — изменение в рабочей директории
2. **Staged** — добавлен в индекс через \`git add\`
3. **Committed** — сохранён в истории

> **Совет:** Пишите коммиты в повелительном наклонении: "Add login page", а не "Added" или "Adding".`,
          }],
        },
        {
          id: 's3-1-2',
          title: 'Ветки',
          items: [{
            id: 'i3-1-2-1', type: 'lesson', title: 'Ветки в Git',
            content: `## Ветки (Branches)

Ветка — независимая линия разработки. Позволяет работать над фичами параллельно.

\`\`\`bash
git branch                    # Список веток
git branch feature/login      # Создать ветку
git checkout feature/login    # Переключиться
git checkout -b feature/auth  # Создать и переключиться

# Современный синтаксис:
git switch feature/login      # Переключиться
git switch -c feature/auth    # Создать и переключиться
\`\`\`

### Слияние веток

\`\`\`bash
git checkout main
git merge feature/login       # Слить feature/login в main
\`\`\`

### Удаление

\`\`\`bash
git branch -d feature/login   # Удалить (безопасно)
git branch -D feature/login   # Удалить принудительно
\`\`\`

### Naming conventions

- \`main\` / \`master\` — основная ветка
- \`feature/<name>\` — новая функциональность
- \`fix/<name>\` — исправление бага
- \`hotfix/<name>\` — срочное исправление в проде`,
          }],
        },
        {
          id: 's3-1-3',
          title: 'Тест: основы Git',
          items: [{
            id: 'i3-1-3-1', type: 'test', title: 'Тест: основы Git',
            passingPercent: 60,
            questions: [
              {
                id: 'q15', question: 'Что делает команда git add?',
                options: [
                  { id: 'o57', text: 'Создаёт коммит', isCorrect: false },
                  { id: 'o58', text: 'Добавляет изменения в staging area (индекс)', isCorrect: true },
                  { id: 'o59', text: 'Создаёт новую ветку', isCorrect: false },
                  { id: 'o60', text: 'Отправляет код на сервер', isCorrect: false },
                ],
              },
              {
                id: 'q16', question: 'Какая команда создаёт ветку И сразу переключается на неё?',
                options: [
                  { id: 'o61', text: 'git branch new-feature', isCorrect: false },
                  { id: 'o62', text: 'git checkout -b new-feature', isCorrect: true },
                  { id: 'o63', text: 'git merge new-feature', isCorrect: false },
                  { id: 'o64', text: 'git init new-feature', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      id: 'm3-2',
      title: 'Командная работа',
      steps: [
        {
          id: 's3-2-1',
          title: 'Merge и Rebase',
          items: [{
            id: 'i3-2-1-1', type: 'lesson', title: 'Merge и Rebase',
            content: `## Merge

Соединяет историю двух веток, создавая merge-коммит:

\`\`\`bash
git checkout main
git merge feature/auth
# Создаёт коммит: "Merge branch 'feature/auth'"
\`\`\`

История выглядит так:
\`\`\`
A---B---C---M  (main)
         \\  /
          D---E  (feature)
\`\`\`

## Rebase

Переносит коммиты поверх другой ветки, переписывая историю:

\`\`\`bash
git checkout feature/auth
git rebase main
# Коммиты D, E "перемещаются" поверх C
\`\`\`

История выглядит так:
\`\`\`
A---B---C---D'---E'  (feature, после rebase)
\`\`\`

## Когда что использовать?

| Ситуация | Рекомендация |
|----------|-------------|
| Публичная ветка | \`merge\` — не переписывает историю |
| Локальная ветка | \`rebase\` — чистая линейная история |
| Pull Request | \`merge\` или \`squash merge\` |

> **Золотое правило:** Никогда не делайте rebase публичных веток (main, develop).`,
          }],
        },
        {
          id: 's3-2-2',
          title: 'Pull Requests и Code Review',
          items: [{
            id: 'i3-2-2-1', type: 'lesson', title: 'Pull Requests и Code Review',
            content: `## Pull Request (PR)

PR — запрос на слияние вашей ветки в основную. Основа командной работы.

### Процесс

\`\`\`bash
# 1. Создать ветку
git checkout -b feature/add-auth

# 2. Сделать изменения и коммиты
git add .
git commit -m "feat: add JWT authentication"

# 3. Отправить на сервер
git push origin feature/add-auth

# 4. Создать PR через GitHub/GitLab UI
\`\`\`

## Code Review

### Что проверять?

- **Корректность** — решает ли код задачу?
- **Читаемость** — легко ли понять?
- **Тесты** — покрыты ли изменения?
- **Безопасность** — нет ли уязвимостей?
- **Производительность** — нет ли очевидных проблем?

### Как давать обратную связь

\`\`\`
✅ "Можно использовать Array.from() вместо [...x] — чуть нагляднее"
❌ "Это плохой код"

✅ "Здесь нужно добавить обработку ошибок — если запрос упадёт, UI зависнет"
❌ "Почему нет обработки ошибок??"
\`\`\`

### Конфигурация репозитория

- Требуйте минимум 1-2 апрува перед слиянием
- Включите CI: линтер, тесты, сборка
- Используйте branch protection rules`,
          }],
        },
        {
          id: 's3-2-3',
          title: 'Итоговый тест',
          items: [{
            id: 'i3-2-3-1', type: 'test', title: 'Итоговый тест по Git',
            passingPercent: 60,
            questions: [
              {
                id: 'q17', question: 'В чём главное отличие rebase от merge?',
                options: [
                  { id: 'o65', text: 'Rebase медленнее merge', isCorrect: false },
                  { id: 'o66', text: 'Rebase переписывает историю коммитов, merge — нет', isCorrect: true },
                  { id: 'o67', text: 'Merge работает только с локальными ветками', isCorrect: false },
                  { id: 'o68', text: 'Rebase создаёт merge-коммит', isCorrect: false },
                ],
              },
              {
                id: 'q18', question: 'Что такое Pull Request?',
                options: [
                  { id: 'o69', text: 'Команда для загрузки изменений с сервера', isCorrect: false },
                  { id: 'o70', text: 'Запрос на слияние вашей ветки в основную с проверкой кода', isCorrect: true },
                  { id: 'o71', text: 'Способ скачать репозиторий', isCorrect: false },
                  { id: 'o72', text: 'Автоматическое тестирование кода', isCorrect: false },
                ],
              },
              {
                id: 'q19', question: 'Почему нельзя делать rebase публичных веток (main)?',
                options: [
                  { id: 'o73', text: 'Git технически не позволяет это', isCorrect: false },
                  { id: 'o74', text: 'Это перезаписывает историю, что сломает репозитории других разработчиков', isCorrect: true },
                  { id: 'o75', text: 'Rebase слишком медленный для больших веток', isCorrect: false },
                  { id: 'o76', text: 'Публичные ветки не поддерживают rebase', isCorrect: false },
                ],
              },
            ],
          }],
        },
      ],
    },
  ],
};

// ---- Мок-данные ----
let mockCourses: Course[] = [
  { id: '1', title: 'Основы JavaScript',           description: 'Переменные, функции, объекты, асинхронность. Обязательный базовый курс для всех разработчиков компании.', authorId: 'user-admin', status: 'published', createdAt: '2024-01-15', lessonsCount: 12 },
  { id: '2', title: 'React для начинающих',         description: 'Компоненты, хуки, роутинг. Практический курс — строим реальный портал обучения.',                        authorId: 'user-admin', status: 'published', createdAt: '2024-02-10', lessonsCount: 8  },
  { id: '3', title: 'Git и командная разработка',   description: 'Ветки, мёрж, конфликты, pull requests. Как продуктивно работать в команде.',                             authorId: 'user-admin', status: 'published', createdAt: '2024-03-05', lessonsCount: 6  },
];

let mockEnrollments: Enrollment[] = [];

const MOCK_EMPLOYEES: EmployeeForAssignment[] = [
  { userId: 'user-admin',  fullname: 'Алексей Петров',   email: 'admin@test.com',   role: { id: 'role-admin',    name: 'admin' },          department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-head',   fullname: 'Дмитрий Козлов',   email: 'head@test.com',    role: { id: 'role-depthead', name: 'departmentHead' }, department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-emp-1',  fullname: 'Анна Серова',       email: 'anna@corp.ru',     role: { id: 'r2', name: 'developer' },                department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-emp-2',  fullname: 'Иван Соколов',      email: 'ivan@corp.ru',     role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-1', name: 'IT отдел' } },
  { userId: 'user-senior', fullname: 'Наталья Орлова',    email: 'senior@test.com',  role: { id: 'role-senior',   name: 'seniorManager' },  department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-3',  fullname: 'Мария Иванова',     email: 'user@test.com',    role: { id: 'r3', name: 'employee' },                 department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-4',  fullname: 'Сергей Волков',     email: 'serg@corp.ru',     role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-2', name: 'Продажи' } },
  { userId: 'user-emp-5',  fullname: 'Елена Попова',      email: 'elena@corp.ru',    role: { id: 'r4', name: 'manager' },                  department: { id: 'dept-3', name: 'HR' } },
  { userId: 'user-emp-6',  fullname: 'Ольга Смирнова',    email: 'olga@corp.ru',     role: { id: 'r5', name: 'accountant' },               department: { id: 'dept-4', name: 'Финансы' } },
];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Считает общее количество шагов в модулях
function countSteps(modules: Module[]): number {
  return modules.reduce((sum, m) => sum + m.steps.length, 0);
}

export const courseApi = {
  async getCourses(): Promise<Course[]> {
    await delay(300);
    return mockCourses.filter(c => c.status === 'published');
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    await delay(200);
    return mockCourses.find(c => c.id === id);
  },

  // Возвращает курс с полным содержимым модулей
  async getCourseWithModules(id: string): Promise<Course | undefined> {
    await delay(250);
    const course = mockCourses.find(c => c.id === id);
    if (!course) return undefined;
    const modules = MOCK_MODULES[id] ?? course.modules ?? [];
    return { ...course, modules };
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
    const enrollment: Enrollment = { courseId, userId, status: 'in_progress', progress: 0, completedStepIds: [] };
    mockEnrollments = [...mockEnrollments, enrollment];
    return enrollment;
  },

  async assignCourse(courseId: string, targetUserId: string): Promise<Enrollment> {
    await delay(300);
    return courseApi.enroll(courseId, targetUserId);
  },

  // Отметить шаг пройденным
  async completeStep(courseId: string, userId: string, stepId: string): Promise<Enrollment> {
    await delay(150);
    const idx = mockEnrollments.findIndex(e => e.courseId === courseId && e.userId === userId);
    if (idx === -1) throw new Error('Enrollment not found');

    const current = mockEnrollments[idx];
    if (current.completedStepIds.includes(stepId)) return current;

    const newIds = [...current.completedStepIds, stepId];

    // Узнаём общее кол-во шагов из модулей (если есть)
    const course = mockCourses.find(c => c.id === courseId);
    const modules = MOCK_MODULES[courseId] ?? course?.modules ?? [];
    const total = modules.length > 0 ? countSteps(modules) : (course?.lessonsCount ?? 1);

    const newProgress = Math.min(Math.round((newIds.length / total) * 100), 100);
    const newStatus = newProgress >= 100 ? 'completed' : 'in_progress';

    const updated: Enrollment = { ...current, completedStepIds: newIds, progress: newProgress, status: newStatus };
    mockEnrollments = mockEnrollments.map((e, i) => (i === idx ? updated : e));
    return updated;
  },

  async getAssignableEmployees(opts: { userRole: string; departmentId: string; excludeUserId: string }): Promise<EmployeeForAssignment[]> {
    await delay(200);
    const { userRole, departmentId, excludeUserId } = opts;
    let list = MOCK_EMPLOYEES.filter(e => e.userId !== excludeUserId);
    if (userRole === 'admin')          return list;
    if (userRole === 'departmentHead') return list.filter(e => e.department.id === departmentId);
    if (userRole === 'seniorManager')  return list.filter(e => e.department.id === departmentId && e.role.name === 'manager');
    return [];
  },
};
