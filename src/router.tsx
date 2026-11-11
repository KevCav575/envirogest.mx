import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard, HomeRedirect } from '@/guards/AuthGuard';

import AuthPage             from '@/pages/auth/AuthPage';
import WorkspaceLayout      from '@/pages/workspace/WorkspaceLayout';
import DashboardPage        from '@/pages/workspace/DashboardPage';
import QuestionnairePage    from '@/pages/workspace/QuestionnairePage';
import TramitesPage         from '@/pages/workspace/TramitesPage';
import TramiteDetailPage    from '@/pages/workspace/TramiteDetailPage';
import CronogramaPage       from '@/pages/workspace/CronogramaPage';
import AlertasPage          from '@/pages/workspace/AlertasPage';
import ISO14001Page         from '@/pages/workspace/ISO14001Page';
import SettingsPage         from '@/pages/workspace/SettingsPage';

export const router = createBrowserRouter([
  { path: '/',      element: <HomeRedirect /> },
  { path: '/login', element: <AuthPage /> },
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
      { path: 'iso14001',             element: <ISO14001Page /> },
      { path: 'configuracion',        element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <HomeRedirect /> },
]);
