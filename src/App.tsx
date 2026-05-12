import { useEffect }      from 'react';
import { RouterProvider } from 'react-router-dom';
import { router }         from '@/router';
import { useAppStore }    from '@/store/useAppStore';

export default function App() {
  const initSession = useAppStore(s => s.initSession);

  /**
   * Single call on cold load: hits GET /api/auth/me to restore a valid JWT
   * session from the httpOnly cookie.  If the cookie is missing or expired
   * the user lands on /login.  AuthGuard shows a spinner while this is in
   * flight (sessionLoading === true).
   */
  useEffect(() => {
    initSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RouterProvider router={router} />;
  
}
