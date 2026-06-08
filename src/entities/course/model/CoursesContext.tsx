import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib/query/queryKeys';
import type { Course, Enrollment, Certificate, CreateCourseDto, EnrollmentRequest, EmployeeForAssignment } from './types';
import { getAllItems } from './types';
import {
  courseRealApi,
  courseWriteApi,
  fileApi,
  lessonApi,
  testDefApi,
  questionApi,
  enrollmentWriteApi,
  mapEnrollmentDto,
} from '../api/courseRealApi';
import { useCoursesQuery, useMyEnrollmentDtosQuery } from '../api/hooks';
import { employeeApi } from '@entities/user/api/employeeApi';
import { divisionApi } from '@entities/company/api/companyApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, isAdmin, type User } from '@entities/user/model/types';
import { toast } from '@shared/lib/toast';
import type { TestContent } from './types';

// ── Видимость курса для конкретного пользователя ─────────────────
function isCourseVisibleToUser(
  course: Course,
  user: User,
  enrollments: Enrollment[],
): boolean {
  const isEnrolled = enrollments.some(e => e.courseId === course.id);

  const emp = user.employee;
  if (!emp) return false;
  const r = emp.role.name;

  if (course.authorId === user.id) return true;
  if (course.status !== 'published') return false;
  if (r === 'admin') return true;
  if (!course.targetDepartmentId && !course.targetDivisionId) return true;
  if (isEnrolled) return true;

  if (course.targetDepartmentId && !course.targetDivisionId) {
    return course.targetDepartmentId === emp.department.id;
  }

  if (course.targetDivisionId) {
    if (r === 'department_head') {
      return course.targetDepartmentId === emp.department.id;
    }
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
  requestEnrollment: (courseId: string) => Promise<void>;
  getCourseRequests: (courseId: string) => Promise<EnrollmentRequest[]>;
  approveEnrollmentRequest: (courseId: string, userId: string) => Promise<void>;
  rejectEnrollmentRequest: (courseId: string, userId: string) => Promise<void>;
  assignCourse: (courseId: string, userId: string) => Promise<void>;
  getCourseEnrollments: (courseId: string) => Promise<Enrollment[]>;
  /** coverFile — обложка курса (если передана — загружается через POST /files) */
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>, coverFile?: File) => Promise<Course>;
  approveCourse: (courseId: string) => Promise<void>;
  rejectCourse: (courseId: string) => Promise<void>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  markItemComplete: (courseId: string, itemId: string) => Promise<Enrollment>;
  getCourseWithModules: (courseId: string) => Promise<Course | null>;
  completeStep: (courseId: string, stepId: string) => Promise<void>;
  getAssignableEmployees: () => Promise<EmployeeForAssignment[]>;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const employeeId = user.employee?.id;

  const { data: rawCourses = [], isLoading: coursesLoading } = useCoursesQuery();
  const { data: rawEnrollmentDtos = [], isLoading: enrollmentsLoading } = useMyEnrollmentDtosQuery();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Local overrides for optimistic updates (cleared on query re-fetch)
  const [enrollmentOverrides, setEnrollmentOverrides] = useState<Enrollment[]>([]);

  const isLoading = coursesLoading || enrollmentsLoading;

  const serverEnrollments = useMemo(() => {
    const stepCountByCourse = new Map(rawCourses.map(c => [c.id, getAllItems(c).length]));
    const courseById        = new Map(rawCourses.map(c => [c.id, c]));
    return rawEnrollmentDtos.map(dto => {
      const course         = courseById.get(dto.courseId);
      const progressOverride = course?.embeddedEnrollment?.progress;
      return mapEnrollmentDto(dto, stepCountByCourse.get(dto.courseId) ?? 0, progressOverride);
    });
  }, [rawCourses, rawEnrollmentDtos]);

  const enrollments = useMemo(() => {
    const overrideCourseIds = new Set(enrollmentOverrides.map(e => e.courseId));
    return [
      ...serverEnrollments.filter(e => !overrideCourseIds.has(e.courseId)),
      ...enrollmentOverrides,
    ];
  }, [serverEnrollments, enrollmentOverrides]);

  const courses = useMemo(
    () => rawCourses.filter(c => isCourseVisibleToUser(c, user, enrollments)),
    [rawCourses, enrollments, user],
  );

  const getEnrollment = useCallback(
    (courseId: string): Enrollment | undefined =>
      enrollments.find(e => e.courseId === courseId),
    [enrollments],
  );

  // ── Course creation (real API) ────────────────────────────────

  const createCourse = async (
    dto: Omit<CreateCourseDto, 'authorId'>,
    coverFile?: File,
  ): Promise<Course> => {
    try {
    // 1. Create course
    const scope: 'ALL' | 'DEPARTMENT' | 'DIVISION' =
      dto.targetDivisionId   ? 'DIVISION'
      : dto.targetDepartmentId ? 'DEPARTMENT'
      : 'ALL';
    const courseId = await courseWriteApi.create({
      name:         dto.title,
      description:  dto.description,
      scope,
      departmentId: dto.targetDepartmentId ?? undefined,
      divisionId:   dto.targetDivisionId   ?? undefined,
    });

    // 2. Upload cover if provided, then patch course
    if (coverFile) {
      const { id: coverId } = await fileApi.upload(coverFile);
      await courseWriteApi.update(courseId, { coverId });
    }

    // 3. Create modules → steps → lessons / tests
    for (const mod of dto.modules ?? []) {
      const moduleId = await courseWriteApi.addModule(courseId, mod.title);

      // Frontend: Step.items[] — each item maps to one backend Step
      for (const step of mod.steps) {
        for (const item of step.items) {
          if (item.type === 'lesson') {
            const lessonId = await lessonApi.create(item.title, item.content);
            await courseWriteApi.addStep(courseId, moduleId, {
              name:     item.title,
              type:     'LESSON',
              lessonId,
            });
          } else {
            // test
            const testItem = item as TestContent;
            const testId = await testDefApi.create(testItem.title);

            for (const q of testItem.questions) {
              const questionId = await questionApi.create(courseId, {
                question: q.question,
                answers:  q.options.map(o => ({ answer: o.text, isCorrect: o.isCorrect })),
              });
              await testDefApi.addQuestion(testId, questionId);
            }

            await courseWriteApi.addStep(courseId, moduleId, {
              name:   testItem.title,
              type:   'TEST',
              testId,
            });
          }
        }
      }
    }

    // 4. Fetch created course and refresh query cache
    const course = await courseRealApi.getById(courseId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    toast.success('Курс создан');
    return course;
    } catch (err) {
      toast.apiError(err, 'Не удалось создать курс');
      throw err;
    }
  };

  // ── Enrollment write (real API) ───────────────────────────────

  const enroll = async (courseId: string) => {
    try {
      const eid = employeeId ?? user.id;
      const enrollmentId = await courseWriteApi.enrollEmployee(courseId, eid);
      // Set optimistic enrollment immediately so the player can open before the refetch completes
      setEnrollmentOverrides(prev => [
        ...prev.filter(e => e.courseId !== courseId),
        { id: enrollmentId, courseId, userId: eid, status: 'in_progress', progress: 0, completedItems: [], enrolledAt: new Date().toISOString() },
      ]);
      toast.success('Вы записаны на курс');
      // Refetch in background; clear optimistic once server data is available
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') }).then(() => {
        setEnrollmentOverrides(prev => prev.filter(e => e.courseId !== courseId));
      });
    } catch (err) {
      toast.apiError(err, 'Не удалось записаться на курс');
      throw err;
    }
  };

  const requestEnrollment = async (courseId: string) => {
    try {
    await courseWriteApi.applyForCourse(courseId);
    // Optimistic: show pending_approval until next enrollment refresh
    const optimistic: Enrollment = {
      courseId,
      userId:         employeeId ?? user.id,
      status:         'pending_approval',
      progress:       0,
      completedItems: [],
      enrolledAt:     new Date().toISOString(),
    };
    setEnrollmentOverrides(prev => [
      ...prev.filter(e => e.courseId !== courseId),
      optimistic,
    ]);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') });
    toast.success('Заявка отправлена — ожидайте одобрения');
    } catch (err) {
      toast.apiError(err, 'Не удалось отправить заявку');
      throw err;
    }
  };

  const assignCourse = async (courseId: string, userId: string): Promise<void> => {
    try {
      await courseWriteApi.enrollEmployee(courseId, userId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') });
      toast.success('Курс назначен сотруднику');
    } catch (err) {
      toast.apiError(err, 'Не удалось назначить курс');
      throw err;
    }
  };

  // ── Step completion (real API) ────────────────────────────────

  const markItemComplete = async (courseId: string, itemId: string): Promise<Enrollment> => {
    const prevEnrollment = getEnrollment(courseId);
    const enrollmentId = prevEnrollment?.id;

    if (!enrollmentId) {
      toast.error('Нет активной записи на курс');
      throw new Error('No active enrollment found for this course');
    }

    try {
    await enrollmentWriteApi.completeStep(enrollmentId, itemId);

    // Re-fetch to get server truth (updated progress + possible COMPLETED status)
    const updatedDto = await enrollmentWriteApi.getById(enrollmentId);
    const totalSteps = getAllItems(courses.find(c => c.id === courseId) ?? { modules: [] } as Course).length;
    const updated = mapEnrollmentDto(updatedDto, totalSteps);

    setEnrollmentOverrides(prev => [
      ...prev.filter(e => e.courseId !== courseId),
      updated,
    ]);

    if (updated.status === 'completed' && prevEnrollment?.status !== 'completed') {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const cert: Certificate = {
          id:          `cert-${courseId}-${user.id}`,
          userId:      user.id,
          courseId,
          courseTitle: course.title,
          userName:    displayName(user),
          issuedAt:    new Date().toISOString(),
        };
        setCertificates(prev => [...prev.filter(c => c.id !== cert.id), cert]);
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') });
    return updated;
    } catch (err) {
      toast.apiError(err, 'Не удалось сохранить прогресс');
      throw err;
    }
  };

  const completeStep = async (courseId: string, stepId: string): Promise<void> => {
    await markItemComplete(courseId, stepId);
  };

  // ── Course requests / approve / reject ───────────────────────

  const getCourseRequests = async (courseId: string): Promise<EnrollmentRequest[]> => {
    const apps = await courseWriteApi.getApplications(courseId);
    return Promise.all(
      apps.map(async app => {
        let fullname = app.employeeId;
        let email = '';
        try {
          const emp = await employeeApi.getById(app.employeeId);
          fullname = emp.fullname;
          email = emp.email;
        } catch { /* fallback to id */ }
        return {
          id:          app.id,
          courseId:    app.courseId,
          userId:      app.employeeId,
          userName:    fullname,
          userEmail:   email,
          requestedAt: app.createdAt,
        };
      }),
    );
  };

  const approveEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    try {
      const apps = await courseWriteApi.getApplications(courseId);
      const app  = apps.find(a => a.employeeId === userId);
      if (!app) return;
      await courseWriteApi.approveApplication(courseId, app.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(userId) });
      toast.success('Заявка одобрена');
    } catch (err) {
      toast.apiError(err, 'Не удалось одобрить заявку');
      throw err;
    }
  };

  const rejectEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    try {
      const apps = await courseWriteApi.getApplications(courseId);
      const app  = apps.find(a => a.employeeId === userId);
      if (!app) return;
      await courseWriteApi.rejectApplication(courseId, app.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(userId) });
      toast.success('Заявка отклонена');
    } catch (err) {
      toast.apiError(err, 'Не удалось отклонить заявку');
      throw err;
    }
  };

  const getCourseEnrollments = async (courseId: string): Promise<Enrollment[]> => {
    const dtos = await courseRealApi.getCourseEnrollmentDtos(courseId);
    const course = courses.find(c => c.id === courseId);
    const totalSteps = course ? getAllItems(course).length : 0;
    return dtos.map(dto => mapEnrollmentDto(dto, totalSteps));
  };

  const approveCourse = async (_courseId: string): Promise<void> => {
    // No dedicated endpoint for course status change yet — noop
  };

  const rejectCourse = async (_courseId: string): Promise<void> => {
    // No dedicated endpoint for course status change yet — noop
  };

  const getCourseWithModules = async (courseId: string): Promise<Course | null> => {
    const course = await courseRealApi.getById(courseId);
    return course ?? null;
  };

  const getAssignableEmployees = async (): Promise<EmployeeForAssignment[]> => {
    const role = user.employee?.role.name;

    // Fetch raw employee DTOs scoped by role
    let empDtos;
    if (role === 'senior_manager') {
      empDtos = await employeeApi.getSubordinates();
    } else {
      const divisionId = role === 'division_head' ? user.employee?.division.id : undefined;
      const result = await employeeApi.list({ page: 1, limit: 200, divisionId });
      empDtos = result.data;
    }

    // Fetch division names (department name already in EmployeeDto)
    const divsResult = await divisionApi.list({ page: 1, limit: 200 });
    const divMap = new Map(divsResult.data.map(d => [d.id, d]));

    // dept_head: filter to own department only
    const userDeptId = user.employee?.department.id;
    const filtered = role === 'department_head'
      ? empDtos.filter(e => e.department.id === userDeptId)
      : empDtos;

    return filtered.map(e => ({
      userId:     e.id,
      fullname:   e.fullname,
      email:      e.email,
      division:   { id: e.divisionId, name: divMap.get(e.divisionId)?.name ?? e.divisionId },
      department: { id: e.department.id, name: e.department.name },
      role:       { name: e.role.name },
    }));
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
