import { api } from '@shared/api/axios';
import { CoursesOverviewItemDtoSchema, paginatedSchema } from '@shared/api/schemas';
import { employeeApi } from '@entities/user/api/employeeApi';
import { divisionApi } from '@entities/company/api/companyApi';
import { courseRealApi } from './courseRealApi';
import { getAllItems } from '../model/types';
import type { AdminEnrollmentRecord } from '../model/controlTypes';
import type { EnrollmentStatus, CourseType } from '../model/types';

function mapEnrollmentStatus(s: string): EnrollmentStatus {
  if (s === 'COMPLETED') return 'completed';
  if (s === 'IN_PROGRESS') return 'in_progress';
  return 'not_enrolled';
}

export const controlApi = {
  async getEmployeeEnrollments(): Promise<AdminEnrollmentRecord[]> {
    // 1. Courses overview → courseIds that have enrollments
    const { data: overviewRaw } = await api.get('/courses/analytics', { params: { page: 1, limit: 200 } });
    const activeCourses = paginatedSchema(CoursesOverviewItemDtoSchema).parse(overviewRaw).data
      .filter(c => c.totalEnrollments > 0);

    if (activeCourses.length === 0) return [];

    // 2. Parallel: employees, divisions, course details + enrollments
    const [empsResult, divsResult, ...courseResults] = await Promise.all([
      employeeApi.list({ page: 1, limit: 500 }),
      divisionApi.list({ page: 1, limit: 200 }),
      ...activeCourses.map(async c => {
        const [course, enrollments] = await Promise.all([
          courseRealApi.getById(c.courseId),
          courseRealApi.getCourseEnrollmentDtos(c.courseId),
        ]);
        return { course, enrollments };
      }),
    ]);

    const empMap = new Map(empsResult.data.map(e => [e.id, e]));
    const divMap = new Map(divsResult.data.map(d => [d.id, d.name]));

    const records: AdminEnrollmentRecord[] = [];
    for (const { course, enrollments } of courseResults) {
      const totalSteps = getAllItems(course).length;
      for (const enr of enrollments) {
        const emp = empMap.get(enr.employeeId);
        const completedSteps = enr.progress.filter(p => p.completedAt).length;
        const progress =
          enr.status === 'COMPLETED' ? 100
          : totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100)
          : 0;

        records.push({
          userId:      enr.employeeId,
          userName:    emp?.fullname ?? enr.employeeId,
          userEmail:   emp?.email ?? '',
          department:  emp?.department.name ?? '',
          division:    emp ? (divMap.get(emp.divisionId) ?? emp.divisionId) : '',
          courseId:    course.id,
          courseTitle: course.title,
          courseType:  course.courseType as CourseType,
          status:      mapEnrollmentStatus(enr.status),
          progress,
          assignedAt:  enr.startedAt,
        });
      }
    }
    return records;
  },
};
