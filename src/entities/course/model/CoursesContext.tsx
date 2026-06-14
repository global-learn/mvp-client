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
import { useCoursesQuery, useMyEnrollmentDtosQuery, useMyCertificatesQuery } from '../api/hooks';
import type { BulkEnrollResponse } from '@shared/api/schemas';
import { employeeApi } from '@entities/user/api/employeeApi';
import { divisionApi } from '@entities/company/api/companyApi';
import { useUser } from '@entities/user/model/UserContext';
import { canCreateCourse, type User } from '@entities/user/model/types';
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

  const isAuthor = course.authorId === user.id || course.authorId === user.employee?.id;

  // Archived: visible only to admin or course author
  if (course.status === 'archived') {
    return r === 'admin' || isAuthor;
  }

  if (isAuthor) return true;
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
  /** Массовое назначение курса через bulk-эндпоинт; возвращает сводку */
  assignCourseBulk: (courseId: string, employeeIds: string[]) => Promise<BulkEnrollResponse>;
  getCourseEnrollments: (courseId: string) => Promise<Enrollment[]>;
  /** coverFile — обложка курса (если передана — загружается через POST /files) */
  createCourse: (dto: Omit<CreateCourseDto, 'authorId'>, coverFile?: File) => Promise<Course>;
  updateCourse: (courseId: string, dto: {
    name?: string;
    description?: string;
    scope?: 'ALL' | 'DEPARTMENT' | 'DIVISION';
    departmentId?: string | null;
    divisionId?: string | null;
  }, coverFile?: File) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  archiveCourse: (courseId: string) => Promise<void>;
  unarchiveCourse: (courseId: string) => Promise<void>;
  submitCourse: (courseId: string) => Promise<void>;
  approveCourse: (courseId: string) => Promise<void>;
  rejectCourse: (courseId: string, note?: string) => Promise<void>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  markItemComplete: (courseId: string, itemId: string) => Promise<Enrollment>;
  getCourseWithModules: (courseId: string) => Promise<Course | null>;
  completeStep: (courseId: string, stepId: string) => Promise<void>;
  /** Отметить шаг начатым (best-effort, без тостов) */
  startStep: (courseId: string, stepId: string) => Promise<void>;
  /** Отменить запись на курс */
  cancelEnrollment: (courseId: string) => Promise<void>;
  getAssignableEmployees: () => Promise<EmployeeForAssignment[]>;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const employeeId = user.employee?.id;

  const { data: rawCourses = [], isLoading: coursesLoading } = useCoursesQuery(canCreateCourse(user));
  const { data: rawEnrollmentDtos = [], isLoading: enrollmentsLoading } = useMyEnrollmentDtosQuery();
  const { data: rawCertificates = [] } = useMyCertificatesQuery();

  const certificates: Certificate[] = rawCertificates;
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

  // ── Course creation (real API, atomic via POST /courses/full) ───

  const createCourse = async (
    dto: Omit<CreateCourseDto, 'authorId'>,
    coverFile?: File,
  ): Promise<Course> => {
    try {
      type ItemResult =
        | { type: 'LESSON'; name: string; lessonId: string }
        | { type: 'TEST'; name: string; testId: string; questions: TestContent['questions']; passingPercent: number };

      // 1. Pre-create all lessons and test-defs in parallel (before course exists)
      const items = (dto.modules ?? []).flatMap(mod =>
        mod.steps.flatMap(step => step.items),
      );

      const results: ItemResult[] = await Promise.all(
        items.map(async item => {
          if (item.type === 'lesson') {
            const lessonId = await lessonApi.create(item.title, item.content);
            return { type: 'LESSON' as const, name: item.title, lessonId };
          } else {
            const testItem = item as TestContent;
            const testId = await testDefApi.create(testItem.title, testItem.passingPercent);
            return { type: 'TEST' as const, name: testItem.title, testId, questions: testItem.questions, passingPercent: testItem.passingPercent };
          }
        }),
      );

      // 2. Upload cover
      let coverId: string | undefined;
      if (coverFile) {
        const { id } = await fileApi.upload(coverFile);
        coverId = id;
      }

      // 3. Build modules structure and create course atomically
      const scope: 'ALL' | 'DEPARTMENT' | 'DIVISION' =
        dto.targetDivisionId   ? 'DIVISION'
        : dto.targetDepartmentId ? 'DEPARTMENT'
        : 'ALL';

      const iter = results[Symbol.iterator]();
      const modules = (dto.modules ?? []).map(mod => ({
        name: mod.title,
        steps: mod.steps.flatMap(step =>
          step.items.map(() => {
            const r = iter.next().value as ItemResult;
            return {
              name: r.name,
              type: r.type,
              ...(r.type === 'LESSON' ? { lessonId: r.lessonId } : { testId: r.testId }),
            };
          }),
        ),
      }));

      const courseId = await courseWriteApi.createFull({
        name:         dto.title,
        description:  dto.description,
        scope,
        departmentId: dto.targetDepartmentId ?? undefined,
        divisionId:   dto.targetDivisionId   ?? undefined,
        coverId,
        modules,
      });

      // 4. Create questions and link to test-defs (requires courseId)
      const testResults = results.filter((r): r is Extract<ItemResult, { type: 'TEST' }> => r.type === 'TEST');
      await Promise.all(
        testResults.map(async ({ testId, questions }) => {
          for (const q of questions) {
            const questionId = await questionApi.create(courseId, {
              question: q.question,
              answers:  q.options.map(o => ({ answer: o.text, isCorrect: o.isCorrect })),
            });
            await testDefApi.addQuestion(testId, questionId);
          }
        }),
      );

      // 5. Fetch and return created course
      const course = await courseRealApi.getById(courseId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success('Курс создан');
      return course;
    } catch (err) {
      toast.apiError(err, 'Не удалось создать курс');
      throw err;
    }
  };

  // ── Course deletion / archive ─────────────────────────────────

  const updateCourse = async (
    courseId: string,
    dto: {
      name?: string;
      description?: string;
      scope?: 'ALL' | 'DEPARTMENT' | 'DIVISION';
      departmentId?: string | null;
      divisionId?: string | null;
    },
    coverFile?: File,
  ): Promise<void> => {
    try {
      const oldCoverId = courses.find(c => c.id === courseId)?.coverId;
      let coverId: string | null | undefined;
      if (coverFile) {
        const { id } = await fileApi.upload(coverFile);
        coverId = id;
      }
      await courseWriteApi.update(courseId, { ...dto, ...(coverId !== undefined ? { coverId } : {}) });
      // Заменили обложку — старый файл осиротел, чистим его (best-effort)
      if (coverId && oldCoverId && oldCoverId !== coverId) {
        void fileApi.delete(oldCoverId).catch(() => {});
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) }),
      ]);
      toast.success('Курс обновлён');
    } catch (err) {
      toast.apiError(err, 'Не удалось сохранить изменения');
      throw err;
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    try {
      await courseWriteApi.delete(courseId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success('Курс удалён');
    } catch (err) {
      toast.apiError(err, 'Не удалось удалить курс');
      throw err;
    }
  };

  const archiveCourse = async (courseId: string): Promise<void> => {
    try {
      await courseWriteApi.archive(courseId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) }),
      ]);
      toast.success('Курс перенесён в архив');
    } catch (err) {
      toast.apiError(err, 'Не удалось архивировать курс');
      throw err;
    }
  };

  const unarchiveCourse = async (courseId: string): Promise<void> => {
    try {
      await courseWriteApi.unarchive(courseId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) }),
      ]);
      toast.success('Курс восстановлен из архива');
    } catch (err) {
      toast.apiError(err, 'Не удалось восстановить курс');
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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') }),
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.myApplications() }),
    ]);
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

  const assignCourseBulk = async (courseId: string, employeeIds: string[]): Promise<BulkEnrollResponse> => {
    try {
      const res = await courseWriteApi.enrollBulk(courseId, employeeIds);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') });
      const parts = [`записано: ${res.enrolled.length}`];
      if (res.alreadyEnrolled.length) parts.push(`уже были: ${res.alreadyEnrolled.length}`);
      if (res.failed.length) parts.push(`ошибок: ${res.failed.length}`);
      const summary = `Назначение — ${parts.join(', ')}`;
      if (res.failed.length) toast.error(summary);
      else toast.success(summary);
      return res;
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
    const totalSteps = getAllItems(courses.find(c => c.id === courseId) ?? { modules: [] } as unknown as Course).length;
    const updated = mapEnrollmentDto(updatedDto, totalSteps);

    setEnrollmentOverrides(prev => [
      ...prev.filter(e => e.courseId !== courseId),
      updated,
    ]);

    const invalidations = [
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') }),
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) }),
    ];
    if (updated.status === 'completed' && prevEnrollment?.status !== 'completed') {
      invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.certificates.mine() }));
    }
    await Promise.all(invalidations);
    return updated;
    } catch (err) {
      toast.apiError(err, 'Не удалось сохранить прогресс');
      throw err;
    }
  };

  const completeStep = async (courseId: string, stepId: string): Promise<void> => {
    await markItemComplete(courseId, stepId);
  };

  // Отметить шаг начатым — best-effort: ставит startedAt в step_progress.
  // Молча игнорируем ошибки (напр. 409 при прыжке вперёд / отсутствии записи).
  const startStep = async (courseId: string, stepId: string): Promise<void> => {
    const enrollmentId = getEnrollment(courseId)?.id;
    if (!enrollmentId) return;
    try {
      await enrollmentWriteApi.startStep(enrollmentId, stepId);
    } catch { /* best-effort */ }
  };

  const cancelEnrollment = async (courseId: string): Promise<void> => {
    const enrollmentId = getEnrollment(courseId)?.id;
    if (!enrollmentId) {
      toast.error('Нет активной записи на курс');
      return;
    }
    try {
      await enrollmentWriteApi.cancel(enrollmentId);
      // Optimistic: помечаем запись отменённой (бэк маппит CANCELLED → 'rejected')
      setEnrollmentOverrides(prev => [
        ...prev.filter(e => e.courseId !== courseId),
        { id: enrollmentId, courseId, userId: employeeId ?? user.id, status: 'rejected', progress: 0, completedItems: [], enrolledAt: new Date().toISOString() },
      ]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments('me') });
      toast.success('Запись на курс отменена');
    } catch (err) {
      toast.apiError(err, 'Не удалось отменить запись');
      throw err;
    }
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

  const refreshCourse = (courseId: string) => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) }),
  ]);

  const submitCourse = async (courseId: string): Promise<void> => {
    try {
      await courseWriteApi.submitForReview(courseId);
      await refreshCourse(courseId);
      toast.success('Курс отправлен на проверку');
    } catch (err) {
      toast.apiError(err, 'Не удалось отправить курс на проверку');
      throw err;
    }
  };

  const approveCourse = async (courseId: string): Promise<void> => {
    try {
      await courseWriteApi.publish(courseId);
      await refreshCourse(courseId);
      toast.success('Курс опубликован');
    } catch (err) {
      toast.apiError(err, 'Не удалось опубликовать курс');
      throw err;
    }
  };

  const rejectCourse = async (courseId: string, note?: string): Promise<void> => {
    try {
      await courseWriteApi.reject(courseId, note);
      await refreshCourse(courseId);
      toast.success('Курс отклонён');
    } catch (err) {
      toast.apiError(err, 'Не удалось отклонить курс');
      throw err;
    }
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
        assignCourseBulk,
        getCourseEnrollments,
        createCourse,
        updateCourse,
        deleteCourse,
        archiveCourse,
        unarchiveCourse,
        submitCourse,
        approveCourse,
        rejectCourse,
        getEnrollment,
        markItemComplete,
        getCourseWithModules,
        completeStep,
        startStep,
        cancelEnrollment,
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
