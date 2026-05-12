import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/guards/AuthGuard';

// Pages — lazy-loaded for code splitting
import AuthPage             from '@/pages/auth/AuthPage';
import AdminHomePage        from '@/pages/admin/AdminHomePage';
import ConsultantHomePage   from '@/pages/consultant/ConsultantHomePage';
import WorkspaceLayout      from '@/pages/workspace/WorkspaceLayout';
import DashboardPage        from '@/pages/workspace/DashboardPage';
import QuestionnairePage    from '@/pages/workspace/QuestionnairePage';
import TramitesPage         from '@/pages/workspace/TramitesPage';
import TramiteDetailPage    from '@/pages/workspace/TramiteDetailPage';
import CronogramaPage       from '@/pages/workspace/CronogramaPage';
import AlertasPage          from '@/pages/workspace/AlertasPage';
import ConsultorPanelPage   from '@/pages/workspace/ConsultorPanelPage';
import ISO14001Page         from '@/pages/workspace/ISO14001Page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/admin',
    element: (
      <AuthGuard allowedRoles={['admin']}>
        <AdminHomePage />
      </AuthGuard>
    ),
  },
  {
    path: '/consultor',
    element: (
      <AuthGuard allowedRoles={['consultor']}>
        <ConsultantHomePage />
      </AuthGuard>
    ),
  },
  {
    path: '/proyecto/:projectId',
    element: (
      <AuthGuard>
        <WorkspaceLayout />
      </AuthGuard>
    ),
    children: [
      { index: true,                  element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',            element: <DashboardPage /> },
      { path: 'diagnostico',          element: <QuestionnairePage /> },
      { path: 'tramites',             element: <TramitesPage /> },
      { path: 'tramites/:tramiteId',  element: <TramiteDetailPage /> },
      { path: 'cronograma',           element: <CronogramaPage /> },
      { path: 'alertas',              element: <AlertasPage /> },
      { path: 'consultor-panel',      element: <ConsultorPanelPage /> },
      { path: 'iso14001',             element: <ISO14001Page /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
