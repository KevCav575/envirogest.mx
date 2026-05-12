import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { giroColor, giroLabel } from '@/constants/giros';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  to: string;
  consultorOnly?: boolean;
}

interface SidebarProps {
  projectId: string;
  clientUser: User;
  isConsultor: boolean;
  isAdmin: boolean;
  alertaCount: number;
}

export function Sidebar({ projectId, clientUser, isConsultor, isAdmin, alertaCount }: SidebarProps) {
  const navigate    = useNavigate();
  const { logout }  = useAppStore();
  const { currentUser } = useAppStore();

  const base = `/proyecto/${projectId}`;

  const NAV: NavItem[] = [
    { id: 'dashboard',      label: 'Dashboard',       icon: 'home',      to: `${base}/dashboard` },
    { id: 'cuestionario',   label: 'Diagnóstico',      icon: 'clipboard', to: `${base}/diagnostico` },
    { id: 'tramites',       label: 'Trámites',         icon: 'list',      to: `${base}/tramites` },
    { id: 'cronograma',     label: 'Cronograma',       icon: 'calendar',  to: `${base}/cronograma` },
    { id: 'alertas',        label: 'Alertas',          icon: 'bell',      to: `${base}/alertas` },
    { id: 'consultor',      label: 'Panel Consultor',  icon: 'send',      to: `${base}/consultor-panel`, consultorOnly: true },
    { id: 'iso14001',       label: 'ISO 14001',        icon: 'shield',    to: `${base}/iso14001` },
  ];

  const handleBack = () => {
    if (isAdmin)      navigate('/admin');
    else if (isConsultor) navigate('/consultor');
    else              navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0" style={{ background: '#166634' }}>

      {isConsultor ? (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-green-700"
        >
          <Icon n="cl" s={14} c="rgba(255,255,255,0.7)" />
          <span className="text-green-200 text-xs">
            {isAdmin ? 'Volver al panel admin' : 'Volver a clientes'}
          </span>
        </button>
      ) : (
        <div className="px-4 py-3 border-b border-green-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon n="leaf" s={16} c="white" />
          </div>
          <div>
            <p className="text-white font-bold text-xs">EnviroGest MX</p>
            <p className="text-green-300 text-[10px]">BIOIMPACT</p>
          </div>
        </div>
      )}

      <div className="px-4 py-2.5 bg-green-900/40 border-b border-green-700">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: giroColor(clientUser.giro ?? '') }}
          >
            {clientUser.empresa.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs truncate">{clientUser.empresa}</p>
            <p className="text-green-300 text-[10px] truncate">{giroLabel(clientUser.giro ?? '')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {NAV.map(item => {
          if (item.consultorOnly && !isConsultor) return null;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon n={item.icon} s={16} c={isActive ? 'white' : 'rgba(255,255,255,0.65)'} />
                    {item.id === 'alertas' && alertaCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">
                        {alertaCount > 9 ? '9+' : alertaCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-green-100'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-green-700">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon n="user" s={13} c="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{currentUser?.nombre ?? clientUser.nombre}</p>
            <p className="text-green-300 text-[10px] truncate">{currentUser?.email ?? clientUser.email}</p>
          </div>
          <button onClick={handleLogout} className="p-1 hover:bg-white/10 rounded-lg">
            <Icon n="logout" s={13} c="rgba(255,255,255,0.6)" />
          </button>
        </div>
      </div>
    </div>
  );
}
