import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@app/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage }        from '@pages/dashboard/ui/DashboardPage';
import { CoursesListPage }      from '@pages/courses-list/ui/CoursesListPage';
import { CourseDetailPage }     from '@pages/course-detail/ui/CourseDetailPage';
import { CourseCreatePage }     from '@pages/course-create/ui/CourseCreatePage';
import { ProfilePage }          from '@pages/profile/ui/ProfilePage';
import { ClientsPage }          from '@pages/clients/ui/ClientsPage';
import { CompanyPage }          from '@pages/company/ui/CompanyPage';
import { ControlPage }          from '@pages/control/ui/ControlPage';
import { ChatPage }             from '@pages/chat/ui/ChatPage';
import { OnboardingPage }           from '@pages/onboarding/ui/OnboardingPage';
import { OnboardingManagePage }     from '@pages/onboarding-manage/ui/OnboardingManagePage';
import { LoginPage }                    from '@pages/login/ui/LoginPage';
import { RegisterPage }                from '@pages/register/ui/RegisterPage';
import { VerifyEmailPage }             from '@pages/verify-email/ui/VerifyEmailPage';
import { CompleteRegistrationPage }    from '@pages/complete-registration/ui/CompleteRegistrationPage';
import { LandingPage }                 from '@pages/landing/ui/LandingPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Публичные маршруты (без AppLayout и авторизации) */}
      <Route path="/"                        element={<LandingPage />} />
      <Route path="/login"                   element={<LoginPage />} />
      <Route path="/register"                element={<RegisterPage />} />
      <Route path="/verify-email"            element={<VerifyEmailPage />} />
      <Route path="/complete-registration"   element={<CompleteRegistrationPage />} />

      {/* Защищённые маршруты */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/courses"           element={<CoursesListPage />} />
          <Route path="/courses/create"    element={<CourseCreatePage />} />
          <Route path="/courses/:id"       element={<CourseDetailPage />} />
          <Route path="/profile"           element={<ProfilePage />} />
          <Route path="/clients"           element={<ClientsPage />} />
          <Route path="/company"           element={<CompanyPage />} />
          <Route path="/control"           element={<ControlPage />} />
          <Route path="/chat"              element={<ChatPage />} />
          <Route path="/onboarding"               element={<OnboardingPage />} />
          <Route path="/onboarding/manage"        element={<OnboardingManagePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
