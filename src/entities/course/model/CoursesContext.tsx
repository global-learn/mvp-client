import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Course, Enrollment } from './types';
import { courseApi } from '../api/courseApi';
import { useUser } from '@entities/user/model/UserContext';

// ================================================================
// ЗАЧЕМ КОНТЕКСТ ДЛЯ КУРСОВ?
// ================================================================
// Данные нужны на разных страницах:
//   /courses     — список курсов + статус записи каждого
//   /courses/:id — детальная страница + прогресс пользователя
//
// БЕЗ контекста: при переходе между страницами данные грузятся заново каждый раз.
// С контекстом: грузится один раз при старте, потом только локальные обновления.

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;
  enroll: (courseId: string) => Promise<void>;
  createCourse: (dto: {
    title: string;
    description: string;
    lessonsCount: number;
  }) => Promise<Course>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  // ВАЖНО: CoursesProvider вызывает useUser() внутри себя.
  // Значит в дереве провайдеров UserProvider ДОЛЖЕН оборачивать CoursesProvider.
  const { user } = useUser();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useCallback мемоизирует функцию — не пересоздаёт её при каждом рендере.
  // [user.id] — зависимость: если сменился пользователь, создаём новую функцию.
  const loadData = useCallback(async () => {
    setIsLoading(true);
    // Promise.all — оба запроса параллельно, не последовательно
    const [coursesData, enrollmentsData] = await Promise.all([
      courseApi.getCourses(),
      courseApi.getEnrollments(user.id),
    ]);
    setCourses(coursesData);
    setEnrollments(enrollmentsData);
    setIsLoading(false);
  }, [user.id]);

  // useEffect запускается после монтирования и при смене loadData (= смене пользователя).
  // void: useEffect колбэк не должен возвращать Promise, void его отбрасывает.
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enroll = async (courseId: string) => {
    const enrollment = await courseApi.enroll(courseId, user.id);
    // Обновляем стейт локально — не перезагружаем весь список с сервера
    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === user.id)),
      enrollment,
    ]);
  };

  const createCourse = async (dto: {
    title: string;
    description: string;
    lessonsCount: number;
  }): Promise<Course> => {
    const course = await courseApi.createCourse({
      ...dto,
      authorId: user.id, // контекст знает кто создаёт — не нужно передавать снаружи
      status: 'published',
    });
    setCourses(prev => [...prev, course]);
    return course;
  };

  const getEnrollment = (courseId: string): Enrollment | undefined => {
    return enrollments.find(e => e.courseId === courseId && e.userId === user.id);
  };

  return (
    <CoursesContext.Provider
      value={{ courses, enrollments, isLoading, enroll, createCourse, getEnrollment }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses должен вызываться внутри <CoursesProvider>');
  }
  return context;
}
