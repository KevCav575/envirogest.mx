import { useEffect } from 'react';
import { Outlet, useParams, Navigate, useLocation } from 'react-router-dom';
import { TopNav, type NavItem } from '@/components/TopNav';
import { UpgradeCard } from '@/components/UpgradeCard';
import { useAppStore } from '@/store/useAppStore';
import { today, uid } from '@/lib/utils';

export default function WorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, currentUser, setActiveProject, updateProject } = useAppStore();

  // Aislamiento por empresa: la sesión solo puede abrir su propio espacio
  const isOwn = !!currentUser && projectId === currentUser.proyecto_id;
  const proj  = isOwn ? data.proyectos.find(p => p.id === projectId) : undefined;

  // Cada sección nueva arranca desde arriba
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    if (projectId) setActiveProject(projectId);
    return () => { /* keep activeProjectId for nested routes */ };
  }, [projectId, setActiveProject]);

  // Auto-generate deadline alerts
  useEffect(() => {
    if (!proj) return;
    const todayD   = new Date(today());
    const newAlerts: typeof proj.alertas = [];
    proj.tramites.forEach(t => {
      if (!t.fecha_limite || t.estado === 'cumplido') return;
      const diff = Math.round((new Date(t.fecha_limite).getTime() - todayD.getTime()) / 864e5);
      [7, 3, 1].forEach(d => {
        if (diff === d) {
          const key = `auto_${t._id}_${d}`;
          if (!proj.alertas.some(a => a.id === key)) {
            newAlerts.push({ id: key, tipo: 'vencimiento', mensaje: `"${t.nombre}" vence en ${d} día${d === 1 ? '' : 's'} (${t.fecha_limite}).`, fecha: today(), leido: false, tramite_id: t._id });
          }
        }
      });
      if (diff < 0 && diff > -3) {
        const key = `auto_venc_${t._id}`;
        if (!proj.alertas.some(a => a.id === key)) {
          newAlerts.push({ id: key, tipo: 'vencimiento', mensaje: `ALERTA: "${t.nombre}" venció el ${t.fecha_limite}.`, fecha: today(), leido: false, tramite_id: t._id });
        }
      }
    });
    if (newAlerts.length) updateProject({ alertas: [...proj.alertas, ...newAlerts] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isOwn) return <Navigate to={`/proyecto/${currentUser.proyecto_id}/dashboard`} replace />;
  if (!proj) return (
    <div className="flex items-center justify-center h-screen text-stone-500">
      No encontramos el espacio de trabajo de esta cuenta.
    </div>
  );

  const unreadCount = (proj.alertas ?? []).filter(a => !a.leido).length;

  const base = `/proyecto/${proj.id}`;
  const links: NavItem[] = [
    { label: 'Inicio',      icon: 'home',  to: `${base}/dashboard` },
    { label: 'ISO 14001',   icon: 'doc',   to: `${base}/iso14001` },
    { label: 'Diagnóstico', icon: 'bars',  to: `${base}/diagnostico` },
    { label: 'Trámites',    icon: 'list',  to: `${base}/tramites` },
    { label: 'Alertas',     icon: 'bell',  to: `${base}/alertas`, badge: unreadCount },
  ];
  const menuLinks: NavItem[] = [
    { label: 'Agenda y cronograma', icon: 'calendar', to: `${base}/cronograma` },
    { label: 'Configuración',       icon: 'settings', to: `${base}/configuracion` },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav
        home={`${base}/dashboard`}
        links={links}
        menuLinks={menuLinks}
        calendarTo={`${base}/cronograma`}
        settingsTo={`${base}/configuracion`}
      />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-1 lg:px-4 pb-12">
        <Outlet />
      </main>
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-6">
        <UpgradeCard />
      </div>
    </div>
  );
}
