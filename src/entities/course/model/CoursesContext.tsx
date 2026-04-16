import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Course, Enrollment, CreateCourseDto, EmployeeForAssignment } from './types';
import { courseApi } from '../api/courseApi';
import { useUser } from '@entities/user/model/UserContext';

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;

  enroll: (courseId: string) => Promise<void>;
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  getEnrollment: (courseId: string) => Enrollment | undefined;

  assignCourse: (courseId: string, targetUserId: string) => Promise<void>;
  // Отметить шаг пройденным (для текущего пользователя)
  completeStep: (courseId: string, stepId: string) => Promise<void>;
  // Загрузить курс с полным содержимым модулей
  getCourseWithModules: (courseId: string) => Promise<Course | undefined>;
  getAssignableEmployees: () => Promise<EmployeeForAssignment[]>;
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

  useEffect(() => { void loadData(); }, [loadData]);

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

  const assignCourse = async (courseId: string, targetUserId: string): Promise<void> => {
    await courseApi.assignCourse(courseId, targetUserId);
  };

  const completeStep = async (courseId: string, stepId: string): Promise<void> => {
    const updated = await courseApi.completeStep(courseId, user.id, stepId);
    setEnrollments(prev =>
      prev.map(e => (e.courseId === courseId && e.userId === user.id ? updated : e)),
    );
  };

  const getCourseWithModules = (courseId: string): Promise<Course | undefined> =>
    courseApi.getCourseWithModules(courseId);

  const getAssignableEmployees = (): Promise<EmployeeForAssignment[]> =>
    courseApi.getAssignableEmployees({
      userRole: user.employee?.role.name ?? '',
      departmentId: user.employee?.department.id ?? '',
      excludeUserId: user.id,
    });

  return (
    <CoursesContext.Provider value={{
      courses, enrollments, isLoading,
      enroll, createCourse, getEnrollment,
      assignCourse, completeStep, getCourseWithModules, getAssignableEmployees,
    }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error('useCourses должен вызываться внутри <CoursesProvider>');
  return ctx;
}
