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
import { courseApi } from '../api/courseApi';
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
import { divisionApi, departmentApi } from '@entities/company/api/companyApi';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, isAdmin, type User } from '@entities/user/model/types';
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
  const { data: rawEnrollmentDtos = [], isLoading: enrollmentsLoading } = useMyEnrollmentDtosQuery(employeeId);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Local overrides for optimistic updates (cleared on query re-fetch)
  const [enrollmentOverrides, setEnrollmentOverrides] = useState<Enrollment[]>([]);

  const isLoading = coursesLoading || enrollmentsLoading;

  const serverEnrollments = useMemo(() => {
    const stepCountByCourse = new Map(
      rawCourses.map(c => [c.id, getAllItems(c).length]),
    );
    return rawEnrollmentDtos.map(dto =>
      mapEnrollmentDto(dto, stepCountByCourse.get(dto.courseId) ?? 0),
    );
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
      enrollments.find(e => e.courseId === courseId && e.userId === (employeeId ?? user.id)),
    [enrollments, employeeId, user.id],
  );

  // ── Course creation (real API) ────────────────────────────────

  const createCourse = async (
    dto: Omit<CreateCourseDto, 'authorId'>,
    coverFile?: File,
  ): Promise<Course> => {
    // 1. Create course
    const courseId = await courseWriteApi.create({
      name:        dto.title,
      description: dto.description,
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
            const lessonId = await lessonApi.create(item.title);
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
    return course;
  };

  // ── Enrollment write (real API) ───────────────────────────────

  const enroll = async (courseId: string) => {
    const eid = employeeId ?? user.id;
    await courseWriteApi.enrollEmployee(courseId, eid);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(eid) });
  };

  const requestEnrollment = async (courseId: string) => {
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(employeeId ?? '') });
  };

  const assignCourse = async (courseId: string, userId: string): Promise<void> => {
    await courseWriteApi.enrollEmployee(courseId, userId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(employeeId ?? '') });
  };

  // ── Step completion (real API) ────────────────────────────────

  const markItemComplete = async (courseId: string, itemId: string): Promise<Enrollment> => {
    const prevEnrollment = getEnrollment(courseId);
    const enrollmentId = prevEnrollment?.id;

    if (!enrollmentId) {
      // Fallback to mock if no real enrollment ID (shouldn't happen in normal flow)
      return courseApi.markItemComplete(courseId, user.id, itemId);
    }

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

    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(employeeId ?? '') });
    return updated;
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
        try {
          const emp = await employeeApi.getById(app.employeeId);
          fullname = emp.fullname;
        } catch { /* fallback to id */ }
        return {
          id:          app.id,
          courseId:    app.courseId,
          userId:      app.employeeId,
          userName:    fullname,
          userEmail:   '',
          requestedAt: app.createdAt,
        };
      }),
    );
  };

  const approveEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    const apps = await courseWriteApi.getApplications(courseId);
    const app  = apps.find(a => a.employeeId === userId);
    if (!app) return;
    await courseWriteApi.approveApplication(courseId, app.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(userId) });
  };

  const rejectEnrollmentRequest = async (courseId: string, userId: string): Promise<void> => {
    const apps = await courseWriteApi.getApplications(courseId);
    const app  = apps.find(a => a.employeeId === userId);
    if (!app) return;
    await courseWriteApi.rejectApplication(courseId, app.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(userId) });
  };

  const getCourseEnrollments = async (courseId: string): Promise<Enrollment[]> =>
    courseApi.getCourseEnrollments(courseId);

  const approveCourse = async (courseId: string): Promise<void> => {
    await courseApi.approveCourse(courseId);
  };

  const rejectCourse = async (courseId: string): Promise<void> => {
    await courseApi.rejectCourse(courseId);
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

    // Enrich with division + department names
    const [divsResult, deptsResult] = await Promise.all([
      divisionApi.list({ page: 1, limit: 200 }),
      departmentApi.list({ page: 1, limit: 200 }),
    ]);
    const divMap  = new Map(divsResult.data.map(d => [d.id, d]));
    const deptMap = new Map(deptsResult.data.map(d => [d.id, d]));

    // dept_head: filter to own department only
    const userDeptId = user.employee?.department.id;
    const filtered = role === 'department_head'
      ? empDtos.filter(e => divMap.get(e.divisionId)?.departmentId === userDeptId)
      : empDtos;

    return filtered.map(e => {
      const div  = divMap.get(e.divisionId);
      const dept = div ? deptMap.get(div.departmentId) : undefined;
      return {
        userId:     e.id,
        fullname:   e.fullname,
        division:   { id: e.divisionId,        name: div?.name  ?? e.divisionId },
        department: { id: div?.departmentId ?? '', name: dept?.name ?? '' },
        role:       { name: '' },
      };
    });
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
