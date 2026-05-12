import { useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useAppStore } from '@/store/useAppStore';
import { today, uid } from '@/lib/utils';

export default function WorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, currentUser, setActiveProject, updateProject } = useAppStore();

  const proj      = data.proyectos.find(p => p.id === projectId);
  const clientUser = proj ? data.usuarios.find(u => u.id === proj.cliente_id) : undefined;

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
  if (!proj || !clientUser) return (
    <div className="flex items-center justify-center h-screen text-gray-400">
      Proyecto no encontrado.
    </div>
  );

  const isConsultor = currentUser.rol === 'consultor' || currentUser.rol === 'admin';
  const isAdmin     = currentUser.rol === 'admin';
  const unreadCount = (proj.alertas ?? []).filter(a => !a.leido).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        projectId={proj.id}
        clientUser={clientUser}
        isConsultor={isConsultor}
        isAdmin={isAdmin}
        alertaCount={unreadCount}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
