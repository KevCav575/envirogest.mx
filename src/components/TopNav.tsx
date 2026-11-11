import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';

export interface NavItem {
  label: string;
  icon: string;
  to: string;
  badge?: number;
}

interface TopNavProps {
  /** Destino del logotipo. */
  home: string;
  /** Enlaces centrales (se ocultan en pantallas chicas y pasan al menú). */
  links: NavItem[];
  /** Enlaces extra que solo viven en el menú de hamburguesa. */
  menuLinks?: NavItem[];
  /** Destino del icono de calendario. Si no se pasa, el icono no aparece. */
  calendarTo?: string;
  /** Página de configuración de la empresa (icono de engrane y menú de usuario). */
  settingsTo?: string;
}

const AVATAR_BG = ['#F3BE2A', '#93D66B', '#7DBEFF', '#F28B6C', '#B9A4F4'];

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const bg = AVATAR_BG[(name.charCodeAt(0) || 0) % AVATAR_BG.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-display font-semibold text-ink flex-shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey  = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

function Dropdown({ open, align, children }: { open: boolean; align: 'left' | 'right'; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} z-40 w-64 rounded-xl border border-stone-200 bg-white py-2 shadow-lg`}>
      {children}
    </div>
  );
}

const menuRow = 'flex w-full items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50';

export function TopNav({ home, links, menuLinks = [], calendarTo, settingsTo }: TopNavProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useClickOutside(menuOpen, () => setMenuOpen(false));
  const userRef = useClickOutside(userOpen, () => setUserOpen(false));

  const handleLogout = async () => {
    setUserOpen(false);
    await logout();
    navigate('/login');
  };

  const name = currentUser?.nombre ?? '';
  const subtitle = currentUser?.empresa ?? '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="mx-auto flex h-[72px] sm:h-[88px] max-w-[1440px] items-center gap-3 sm:gap-6 px-4 sm:px-5 lg:px-8">
        {/* Izquierda: marca + menú + calendario */}
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
          <Link to={home} className="font-display text-[17px] sm:text-[19px] font-bold tracking-[0.14em] text-ink">
            ENVIROGEST
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Abrir menú" aria-expanded={menuOpen}
                className="p-1.5 rounded-md text-ink hover:bg-stone-100"
              >
                <Icon n="menu" s={20} w={1.5} />
              </button>
              <Dropdown open={menuOpen} align="left">
                {[...links, ...menuLinks].map(l => (
                  <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `${menuRow} ${isActive ? 'text-green-700 font-medium' : ''}`}>
                    <Icon n={l.icon} s={16} />
                    <span className="flex-1">{l.label}</span>
                    {!!l.badge && <span className="text-xs font-semibold text-red-600">{l.badge}</span>}
                  </NavLink>
                ))}
              </Dropdown>
            </div>
            {calendarTo && (
              <NavLink to={calendarTo} aria-label="Agenda"
                className={({ isActive }) => `p-1.5 rounded-md hover:bg-stone-100 ${isActive ? 'text-green-700 bg-green-50' : 'text-green-600'}`}>
                <Icon n="calendar" s={19} w={1.6} />
              </NavLink>
            )}
          </div>
        </div>

        {/* Centro: navegación principal */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-7">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 py-2 text-[16px] transition-colors ${isActive ? 'text-green-600 font-semibold' : 'text-ink hover:text-green-700'}`}>
              {({ isActive }) => (
                <>
                  <Icon n={l.icon} s={16} w={1.6} />
                  {l.label}
                  {!!l.badge && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[18px] text-white text-center">
                      {l.badge > 9 ? '9+' : l.badge}
                    </span>
                  )}
                  {isActive && <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-green-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 lg:hidden" />

        {/* Derecha: usuario */}
        <div ref={userRef} className="relative flex items-center gap-3">
          {settingsTo && (
            <NavLink to={settingsTo} aria-label="Configuración"
              className={({ isActive }) => `hidden sm:inline-flex p-1.5 rounded-md hover:bg-stone-100 ${isActive ? 'text-green-700 bg-green-50' : 'text-ink'}`}>
              <Icon n="settings" s={17} w={1.6} />
            </NavLink>
          )}
          <button onClick={() => setUserOpen(o => !o)} aria-expanded={userOpen}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-stone-50">
            <span className="sm:hidden"><Avatar name={name || '?'} size={38} /></span>
            <span className="hidden sm:inline-flex"><Avatar name={name || '?'} size={52} /></span>
            <span className="hidden md:block text-left leading-tight">
              <span className="block font-display text-[17px] font-semibold text-ink">{name.split(' ')[0]}</span>
              <span className="block text-[11px] text-stone-500 max-w-[140px] truncate">{subtitle}</span>
            </span>
            <Icon n="cd" s={18} cls="hidden sm:block text-ink ml-2" />
          </button>
          <Dropdown open={userOpen} align="right">
            <div className="px-4 pb-2 mb-1 border-b border-stone-100">
              <p className="text-sm font-semibold text-ink truncate">{name}</p>
              <p className="text-xs text-stone-500 truncate">{currentUser?.email}</p>
            </div>
            {settingsTo && (
              <Link to={settingsTo} onClick={() => setUserOpen(false)} className={menuRow}><Icon n="settings" s={16} />Configuración de la empresa</Link>
            )}
            <button onClick={handleLogout} className={`${menuRow} text-red-600`}>
              <Icon n="logout" s={16} />Cerrar sesión
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
