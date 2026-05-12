import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore }            from '@/store/useAppStore';
import type { UserRole }          from '@/types';
import type { ReactNode }         from 'react';

interface AuthGuardProps {
  children:      ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { currentUser, sessionLoading } = useAppStore();
  const location = useLocation();

  // Wait for GET /auth/me to complete before deciding where to send the user
  if (sessionLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0fdf4', gap: 16,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          style={{ animation: 'spin 1s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="#d1fae5" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#16a34a" strokeWidth="3"
            strokeLinecap="round" />
        </svg>
        <p style={{ color: '#16a34a', fontSize: 13, fontWeight: 600,
          letterSpacing: '.5px' }}>Verificando sesión…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    if (currentUser.rol === 'admin')     return <Navigate to="/admin"     replace />;
    if (currentUser.rol === 'consultor') return <Navigate to="/consultor" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
