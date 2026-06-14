import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage }        from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage }      from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage }     from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage }     from '@pages/course-create/ui/CourseCreatePage';
import { ProfilePage }          from '@pages/profile/ui/ProfilePage';
import { CompanyPage }          from '@pages/company/ui/CompanyPage';
import { ControlPage }          from '@pages/control/ui/ControlPage';
import { OnboardingPage }           from '@pages/onboarding/ui/OnboardingPage';
import { OnboardingManagePage }     from '@pages/onboarding-manage/ui/OnboardingManagePage';
import { TeamPage }                 from '@pages/team/ui/TeamPage';
import { LoginPage }                    from '@pages/login/ui/LoginPage';
import { CompleteRegistrationPage }    from '@pages/complete-registration/ui/CompleteRegistrationPage';
import { ForgotPasswordPage }          from '@pages/forgot-password/ui/ForgotPasswordPage';
import { ResetPasswordPage }           from '@pages/reset-password/ui/ResetPasswordPage';
import { LandingPage }                 from '@pages/landing/ui/LandingPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Публичные маршруты (без AppLayout и авторизации) */}
      <Route path="/"                        element={<LandingPage />} />
      <Route path="/login"                   element={<LoginPage />} />
      <Route path="/complete-registration"   element={<CompleteRegistrationPage />} />
      <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
      <Route path="/reset-password"          element={<ResetPasswordPage />} />

      {/* Защищённые маршруты */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/courses"           element={<CoursesListPage />} />
          <Route path="/courses/create"    element={<CourseCreatePage />} />
          <Route path="/courses/:id"       element={<CourseDetailPage />} />
          <Route path="/profile"           element={<ProfilePage />} />
          <Route path="/company"           element={<CompanyPage />} />
          <Route path="/control"           element={<ControlPage />} />
          <Route path="/onboarding"               element={<OnboardingPage />} />
          <Route path="/onboarding/manage"        element={<OnboardingManagePage />} />
          <Route path="/team"                     element={<TeamPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
