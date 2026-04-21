import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Course, Enrollment, Certificate, CreateCourseDto } from './types';
import { courseApi } from '../api/courseApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName } from '@entities/user/model/types';

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  isLoading: boolean;
  enroll: (courseId: string) => Promise<void>;
  // Назначение курса другому пользователю
  assignCourse: (courseId: string, userId: string) => Promise<void>;
  // Принимает всё из CreateCourseDto кроме authorId — его добавляет контекст сам
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  // Пометить элемент курса (урок/тест) как пройденный, обновляет progress и status
  markItemComplete: (courseId: string, itemId: string) => Promise<void>;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [coursesData, enrollmentsData] = await Promise.all([
      courseApi.getCourses(),
      courseApi.getEnrollments(user.id),
    ]);
    setCourses(coursesData);
    setEnrollments(enrollmentsData);
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enroll = async (courseId: string) => {
    const enrollment = await courseApi.enroll(courseId, user.id);
    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === user.id)),
      enrollment,
    ]);
  };

  const createCourse = async (dto: Omit<CreateCourseDto, 'authorId'>): Promise<Course> => {
    const course = await courseApi.createCourse({ ...dto, authorId: user.id });
    setCourses(prev => [...prev, course]);
    return course;
  };

  const assignCourse = async (courseId: string, userId: string): Promise<void> => {
    await courseApi.assignCourse(courseId, userId);
    // enrollment у другого пользователя — не обновляем локальный стейт текущего юзера
  };

  const getEnrollment = (courseId: string): Enrollment | undefined =>
    enrollments.find(e => e.courseId === courseId && e.userId === user.id);

  const markItemComplete = async (courseId: string, itemId: string): Promise<void> => {
    const prevEnrollment = getEnrollment(courseId);
    const updated = await courseApi.markItemComplete(courseId, user.id, itemId);

    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === user.id)),
      updated,
    ]);

    // Автоматически выдаём сертификат при 100% завершении
    if (updated.status === 'completed' && prevEnrollment?.status !== 'completed') {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const cert: Certificate = {
          id: `cert-${courseId}-${user.id}`,
          userId: user.id,
          courseId,
          courseTitle: course.title,
          userName: displayName(user),
          issuedAt: new Date().toISOString(),
        };
        setCertificates(prev => [
          ...prev.filter(c => c.id !== cert.id),
          cert,
        ]);
      }
    }
  };

  return (
    <CoursesContext.Provider
      value={{ courses, enrollments, certificates, isLoading, enroll, assignCourse, createCourse, getEnrollment, markItemComplete }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) throw new Error('useCourses должен вызываться внутри <CoursesProvider>');
  return context;
}
