import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Course, Enrollment, CreateCourseDto } from './types';
import { courseApi } from '../api/courseApi';
import { useUser } from '@entities/user/model/UserContext';

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;
  enroll: (courseId: string) => Promise<void>;
  // Принимает всё из CreateCourseDto кроме authorId — его добавляет контекст сам
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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

  const getEnrollment = (courseId: string): Enrollment | undefined =>
    enrollments.find(e => e.courseId === courseId && e.userId === user.id);

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
  if (!context) throw new Error('useCourses должен вызываться внутри <CoursesProvider>');
  return context;
}
