# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

```
1. Главная идея FSD
FSD — это способ организовать папки так, чтобы было понятно куда класть новый код и откуда его брать. Главное правило одно:

app → pages → widgets → features → entities → shared
Верхний слой может импортировать из нижних. Нижний — никогда из верхних.

Это не просто правило ради правила. Без него через месяц получается каша: Button импортирует UserContext, UserContext импортирует CourseCard, CourseCard импортирует Button — круговые зависимости, и непонятно что от чего зависит.

2. Что делает каждый слой
shared — фундамент
Код который не знает ни о пользователях, ни о курсах. Только инфраструктура.

У тебя там shared/api/axios.ts — один настроенный экземпляр axios. Всё приложение использует его, а не создаёт своё подключение где попало.

Добавлять сюда: общие хуки (useDebounce, useLocalStorage), UI-компоненты без бизнес-логики (Button, Input, Modal), утилиты (formatDate).

entities — бизнес-объекты
Здесь живут данные и их отображение. Без действий пользователя — только "что это такое".

У тебя два entity:

entities/user — кто такой пользователь, какие у него роли. UserContext.tsx хранит текущего пользователя и отдаёт его через useUser().

entities/course — что такое курс и запись на него:

model/types.ts — TypeScript типы. Вот где хранить типы — рядом с тем entity к которому они относятся, в папке model/
api/courseApi.ts — функции запросов к серверу
model/CoursesContext.tsx — список курсов в памяти
ui/CourseCard.tsx — как карточка курса выглядит
Добавлять сюда: новые типы (Lesson, Category), новые entity-компоненты (LessonCard).

features — действия пользователя
Здесь живёт то что пользователь делает. Каждая feature — это одно действие.

У тебя:

enroll-course/EnrollButton — записаться на курс
create-course/CreateCourseButton — перейти к созданию
Почему не в entity? CourseCard показывает курс. EnrollButton меняет состояние — это разные задачи. Если завтра уберёшь возможность записываться, удалишь только feature, карточка не сломается.

Добавлять сюда: complete-lesson, search-courses, edit-course.

widgets — крупные блоки страниц
Widget — это кусок страницы который сам знает как получить данные (через контекст) и сам решает что рендерить.

У тебя:

CourseList — сам берёт курсы из контекста, рендерит список карточек
CourseForm — форма создания, сама отправляет данные
Отличие от entity-компонента: CourseCard получает курс через props — "тупой" компонент. CourseList сам идёт в контекст — "умный" блок.

Добавлять сюда: Sidebar, Header, CourseProgressWidget.

pages — просто компоновка
Страница — тончайший слой. Только собирает виджеты и фичи вместе. Никакой логики.

Посмотри CoursesListPage — там буквально шапка + <CourseList /> + <CreateCourseButton />. Всё.

Правило: если в page появляется useState или useEffect — скорее всего это должно быть в widget или feature.

app — старт приложения
app/providers/index.tsx — все провайдеры в одном месте. app/router/index.tsx — все URL в одном месте.

3. Как работает React Context в проекте
Открой UserContext.tsx — там три шага с комментариями. Суть в том что UserProvider оборачивает всё приложение в app/providers/index.tsx, и теперь любой компонент может вызвать useUser() и получить текущего пользователя — без пробрасывания через props.

CoursesContext работает так же, но ещё загружает данные через useEffect при старте.

Порядок провайдеров важен:

<UserProvider>           // сначала user
  <CoursesProvider>      // потом courses — потому что внутри вызывает useUser()
    {children}
  </CoursesProvider>
</UserProvider>
4. Как подключить бэкенд когда будет готов
Идёшь только в один файл — entities/course/api/courseApi.ts.

Там каждая функция выглядит так:

async getCourses(): Promise<Course[]> {
  await delay(300);
  // Реальный API: return (await api.get<Course[]>('/courses')).data;
  return mockCourses.filter(c => c.status === 'published');
}
Когда бэкенд готов — удаляешь мок-данные, раскомментируешь строку с api.get. Контекст, виджеты, страницы — не трогаешь вообще.

5. Как добавлять новое
Новая страница (например, профиль):

entities/user/ui/UserProfile.tsx — компонент профиля
pages/profile/ui/ProfilePage.tsx — страница
app/router/index.tsx — добавить маршрут /profile
Новая фича (например, поиск курсов):

features/search-courses/ui/SearchInput.tsx — поле поиска
Добавить в CoursesContext фильтрацию или отдельный стейт
Вставить <SearchInput /> в CoursesListPage
Новое entity (например, уроки):

entities/lesson/model/types.ts — тип Lesson
entities/lesson/api/lessonApi.ts — запросы
entities/lesson/ui/LessonCard.tsx — отображение
6. Где хранить типы — ответ
Что	Где
Тип бизнес-объекта (Course, User)	entities/<name>/model/types.ts
Тип пропсов компонента	прямо в файле компонента, interface Props
Общие утилитарные типы	shared/lib/types.ts
Тип ответа API	рядом с API функцией или в model/types.ts
Никаких глобальных types/ папок — каждый тип живёт рядом с тем кодом которому принадлежит.
```
