import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { FullPageLoader } from './components/ui/Feedback';
import { GuestRoute, ProtectedRoute } from './features/auth/routes';
import AppShell from './features/layout/AppShell';
import NotFoundPage from './features/layout/NotFoundPage';
import ProjectLayout from './features/layout/ProjectLayout';

const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'));
const BacklogPage = lazy(() => import('./features/backlog/BacklogPage'));
const OverviewPage = lazy(() => import('./features/overview/OverviewPage'));
const TodayPage = lazy(() => import('./features/today/TodayPage'));
const FocusPage = lazy(() => import('./features/focus/FocusPage'));
const CalendarPage = lazy(() => import('./features/calendar/CalendarPage'));
const ActivityPage = lazy(() => import('./features/activity/ActivityPage'));
const SprintReportPage = lazy(() => import('./features/sprints/SprintReportPage'));
const BoardPage = lazy(() => import('./features/board/BoardPage'));
const SprintsPage = lazy(() => import('./features/sprints/SprintsPage'));
const SprintDetailPage = lazy(() => import('./features/sprints/SprintDetailPage'));

/** Route table (plan §3.2: router.tsx). */
export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectLayout />}>
              <Route index element={<Navigate to="backlog" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="backlog" element={<BacklogPage />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="sprints" element={<SprintsPage />} />
              <Route path="sprints/:sprintId" element={<SprintDetailPage />} />
              <Route path="sprints/:sprintId/report" element={<SprintReportPage />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="focus" element={<FocusPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
