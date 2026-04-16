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

  // Записаться на курс (текущий пользователь)
  enroll: (courseId: string) => Promise<void>;
  // Создать новый курс
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  // Получить enrollment текущего пользователя по courseId
  getEnrollment: (courseId: string) => Enrollment | undefined;

  // Назначить курс другому сотруднику
  assignCourse: (courseId: string, targetUserId: string) => Promise<void>;
  // Отметить урок пройденным (для текущего пользователя)
  completeLesson: (courseId: string, totalLessons: number) => Promise<void>;
  // Получить список сотрудников, которым текущий пользователь может назначить курс
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

  const assignCourse = async (courseId: string, targetUserId: string): Promise<void> => {
    // Назначение создаёт enrollment от имени targetUser — не влияет на enrollments текущего пользователя
    await courseApi.assignCourse(courseId, targetUserId);
  };

  const completeLesson = async (courseId: string, totalLessons: number): Promise<void> => {
    const updated = await courseApi.completeLesson(courseId, user.id, totalLessons);
    setEnrollments(prev =>
      prev.map(e => (e.courseId === courseId && e.userId === user.id ? updated : e)),
    );
  };

  const getAssignableEmployees = (): Promise<EmployeeForAssignment[]> => {
    const role = user.employee?.role.name ?? '';
    const departmentId = user.employee?.department.id ?? '';
    return courseApi.getAssignableEmployees({ userRole: role, departmentId, excludeUserId: user.id });
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        enrollments,
        isLoading,
        enroll,
        createCourse,
        getEnrollment,
        assignCourse,
        completeLesson,
        getAssignableEmployees,
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
