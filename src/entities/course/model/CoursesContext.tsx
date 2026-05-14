import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Course, Enrollment, Certificate, CreateCourseDto, EnrollmentRequest, EmployeeForAssignment } from './types';
import { courseApi } from '../api/courseApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, isAdmin, type User } from '@entities/user/model/types';

// ── Видимость курса для конкретного пользователя ─────────────────
function isCourseVisibleToUser(
  course: Course,
  user: User,
  enrollments: Enrollment[],
): boolean {
  const isEnrolled = enrollments.some(e => e.courseId === course.id);

  // CLIENT: видит только курсы, на которые его записали
  if (user.type === 'CLIENT') {
    return course.status === 'published' && isEnrolled;
  }

  const emp = user.employee;
  if (!emp) return false;
  const r = emp.role.name;

  // Свои авторские (даже pending/draft) — всегда видны
  if (course.authorId === user.id) return true;

  // Остальные видят только published
  if (course.status !== 'published') return false;

  // Admin: видит всё
  if (r === 'admin') return true;

  // Клиентские курсы: только отдел сервиса
  if (course.courseType === 'client') {
    return emp.division.isService === true;
  }

  // Employee/all курсы далее:

  // Общий курс без таргетирования — видят все сотрудники
  if (!course.targetDepartmentId && !course.targetDivisionId) return true;

  // Если курс лично назначен (enrollment создан через assignCourse) — показываем
  if (isEnrolled) return true;

  // Курс таргетирован на департамент (без конкретного отдела)
  if (course.targetDepartmentId && !course.targetDivisionId) {
    return course.targetDepartmentId === emp.department.id;
  }

  // Курс таргетирован на отдел (может также иметь targetDepartmentId)
  if (course.targetDivisionId) {
    if (r === 'department_head') {
      // Руководитель департамента видит курсы своего департамента
      return course.targetDepartmentId === emp.department.id;
    }
    // Руководитель отдела / старший менеджер видят свой отдел
    return course.targetDivisionId === emp.division.id;
  }

  return false;
}

interface CoursesContextValue {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  isLoading: boolean;
  enroll: (courseId: string) => Promise<void>;
  /** Подать заявку на прохождение — создаёт enrollment со статусом pending_approval */
  requestEnrollment: (courseId: string) => Promise<void>;
  /** Получить заявки на прохождение для конкретного курса (для canControl-пользователей) */
  getCourseRequests: (courseId: string) => Promise<EnrollmentRequest[]>;
  /** Одобрить заявку — меняет статус на in_progress */
  approveEnrollmentRequest: (courseId: string, userId: string) => Promise<void>;
  /** Отклонить заявку */
  rejectEnrollmentRequest: (courseId: string, userId: string) => Promise<void>;
  assignCourse: (courseId: string, userId: string) => Promise<void>;
  getCourseEnrollments: (courseId: string) => Promise<Enrollment[]>;
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>) => Promise<Course>;
  approveCourse: (courseId: string) => Promise<void>;
  rejectCourse: (courseId: string) => Promise<void>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  // Возвращает обновлённый Enrollment — компонент проверяет status === 'completed'
  markItemComplete: (courseId: string, itemId: string) => Promise<Enrollment>;
  /** Загрузить курс со всеми модулями (для плеера) */
  getCourseWithModules: (courseId: string) => Promise<Course | null>;
  /** Отметить шаг пройденным (плеер использует step.id как ключ) */
  completeStep: (courseId: string, stepId: string) => Promise<void>;
  /** Список сотрудников для назначения курса */
  getAssignableEmployees: () => Promise<EmployeeForAssignment[]>;
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

    // Фильтрация по роли — каждый видит только то, что ему разрешено
    const filtered = coursesData.filter(c =>
      isCourseVisibleToUser(c, user, enrollmentsData),
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

  const requestEnrollment = async (courseId: string) => {
    const enrollment = await courseApi.requestEnrollment(
      courseId,
      user.id,
      displayName(user),
      user.email,
    );
    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === user.id)),
      enrollment,
    ]);
  };

  const getCourseRequests = async (courseId: string): Promise<EnrollmentRequest[]> => {
    return courseApi.getEnrollmentRequestsByCourse(courseId);
  };

  const approveEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    const updated = await courseApi.approveEnrollmentRequest(courseId, userId);
    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === userId)),
      updated,
    ]);
  };

  const rejectEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    const updated = await courseApi.rejectEnrollmentRequest(courseId, userId);
    setEnrollments(prev => [
      ...prev.filter(e => !(e.courseId === courseId && e.userId === userId)),
      updated,
    ]);
  };

  const createCourse = async (dto: Omit<CreateCourseDto, 'authorId'>): Promise<Course> => {
    const course = await courseApi.createCourse({ ...dto, authorId: user.id });
    setCourses(prev => [...prev, course]);
    return course;
  };

  const assignCourse = async (courseId: string, userId: string): Promise<void> => {
    await courseApi.assignCourse(courseId, userId, user.id);
  };

  const getCourseEnrollments = async (courseId: string): Promise<Enrollment[]> => {
    return courseApi.getCourseEnrollments(courseId);
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

  const getCourseWithModules = async (courseId: string): Promise<Course | null> => {
    const found = await courseApi.getCourseById(courseId);
    return found ?? null;
  };

  const completeStep = async (courseId: string, stepId: string): Promise<void> => {
    await markItemComplete(courseId, stepId);
  };

  const getAssignableEmployees = async (): Promise<EmployeeForAssignment[]> => {
    return courseApi.getAssignableEmployees();
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        enrollments,
        certificates,
        isLoading,
        enroll,
        requestEnrollment,
        getCourseRequests,
        approveEnrollmentRequest,
        rejectEnrollmentRequest,
        assignCourse,
        getCourseEnrollments,
        createCourse,
        approveCourse,
        rejectCourse,
        getEnrollment,
        markItemComplete,
        getCourseWithModules,
        completeStep,
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
