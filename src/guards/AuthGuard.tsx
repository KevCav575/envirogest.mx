import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore }            from '@/store/useAppStore';
import type { ReactNode }         from 'react';

/**
 * Exige una sesión activa. El aislamiento entre empresas (cada cuenta solo
 * entra a su propio espacio) lo aplica WorkspaceLayout.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, sessionLoading } = useAppStore();
  const location = useLocation();

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-stone-500">Cargando…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** Envía a la persona a su espacio de trabajo, o al login si no hay sesión. */
export function HomeRedirect() {
  const { currentUser, sessionLoading } = useAppStore();
  if (sessionLoading) return null;
  return currentUser
    ? <Navigate to={`/proyecto/${currentUser.proyecto_id}/dashboard`} replace />
    : <Navigate to="/login" replace />;
}
