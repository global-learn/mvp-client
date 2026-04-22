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
import { displayName, isAdmin } from '@entities/user/model/types';

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  isLoading: boolean;
  enroll: (courseId: string) => Promise<void>;
  assignCourse: (courseId: string, userId: string) => Promise<void>;
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  approveCourse: (courseId: string) => Promise<void>;
  rejectCourse: (courseId: string) => Promise<void>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  // Возвращает обновлённый Enrollment — компонент проверяет status === 'completed'
  markItemComplete: (courseId: string, itemId: string) => Promise<Enrollment>;
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

    // Фильтрация по роли:
    //   admin видит все (published + pending)
    //   остальные видят только published + свои pending/draft
    const filtered = isAdmin(user)
      ? coursesData
      : coursesData.filter(
          c => c.status === 'published' || c.authorId === user.id,
        );

    setCourses(filtered);
    setEnrollments(enrollmentsData);
    setIsLoading(false);
  }, [user]);

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
  };

  const approveCourse = async (courseId: string): Promise<void> => {
    const updated = await courseApi.approveCourse(courseId);
    setCourses(prev => prev.map(c => (c.id === courseId ? updated : c)));
  };

  const rejectCourse = async (courseId: string): Promise<void> => {
    const updated = await courseApi.rejectCourse(courseId);
    // После отклонения убираем из списка (если текущий пользователь — admin и не автор)
    if (!isAdmin(user) || updated.authorId !== user.id) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } else {
      setCourses(prev => prev.map(c => (c.id === courseId ? updated : c)));
    }
  };

  const getEnrollment = (courseId: string): Enrollment | undefined =>
    enrollments.find(e => e.courseId === courseId && e.userId === user.id);

  const markItemComplete = async (courseId: string, itemId: string): Promise<Enrollment> => {
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

    return updated;
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        enrollments,
        certificates,
        isLoading,
        enroll,
        assignCourse,
        createCourse,
        approveCourse,
        rejectCourse,
        getEnrollment,
        markItemComplete,
      }}
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
