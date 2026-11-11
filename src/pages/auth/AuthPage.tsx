import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate }         from 'react-router-dom';
import { Icon }                from '@/components/ui/Icon';
import { GIROS }               from '@/constants/giros';
import { useAppStore }         from '@/store/useAppStore';
import type { User }           from '@/types';

type Mode = 'login' | 'register';

/* ── Campos con el estilo del mockup (fondo gris azulado, icono a la derecha) ── */

const fieldCls =
  'h-14 w-full rounded-md bg-field pl-5 pr-12 text-[15px] tracking-[0.06em] text-ink placeholder:text-stone-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-green-600/60';

function TextField({ value, onChange, placeholder, type = 'text', autoComplete }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} aria-label={placeholder} autoComplete={autoComplete} className={fieldCls} />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={`Borrar ${placeholder}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-ink">
          <Icon n="xCircle" s={18} w={1.4} />
        </button>
      )}
    </div>
  );
}

function PasswordField({ value, onChange, placeholder, autoComplete }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} aria-label={placeholder} autoComplete={autoComplete}
        className={`${fieldCls} ${show ? '' : 'tracking-[0.3em]'}`} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-ink">
        <Icon n={show ? 'eye' : 'eyeOff'} s={18} w={1.4} />
      </button>
    </div>
  );
}

/* ── Logos de proveedores ── */

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
  </svg>
);
const AppleLogo = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="#000" d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"/>
  </svg>
);
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07"/>
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, currentUser, sessionLoading } = useAppStore();

  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [pwd, setPwd]           = useState('');
  const [pwd2, setPwd2]         = useState('');
  const [nombre, setNombre]     = useState('');
  const [apellido, setApellido] = useState('');
  const [empresa, setEmpresa]   = useState('');
  const [giro, setGiro]         = useState('');
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const [loading, setLoading]   = useState(false);

  // Si ya hay sesión válida, entra directo a su espacio de trabajo
  useEffect(() => {
    if (!sessionLoading && currentUser) goToWorkspace(currentUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, sessionLoading]);

  function goToWorkspace(u: User) {
    navigate(`/proyecto/${u.proyecto_id}/dashboard`, { replace: true });
  }

  const switchMode = (m: Mode) => { setMode(m); setError(''); setNotice(''); };

  const handleLogin = async () => {
    if (!email || !pwd) { setError('Escribe tu correo y tu contraseña.'); return; }
    setLoading(true); setError(''); setNotice('');
    const u = await login(email, pwd);
    setLoading(false);
    if (!u) { setError('El correo o la contraseña no coinciden.'); return; }
    goToWorkspace(u);
  };

  const handleRegister = async () => {
    const fullName = `${nombre.trim()} ${apellido.trim()}`.trim();
    if (!nombre || !apellido || !empresa || !giro || !email || !pwd) { setError('Completa todos los campos.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Revisa el formato del correo.'); return; }
    if (pwd.length < 6) { setError('La contraseña necesita al menos 6 caracteres.'); return; }
    if (pwd !== pwd2)   { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true); setError(''); setNotice('');
    try {
      const user = await register({ nombre: fullName, empresa, giro, email, pwd });
      if (!user) { setError('Ya existe una cuenta con ese correo, o el servidor no responde.'); return; }
      goToWorkspace(user);
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Algo falló al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin(); else handleRegister();
  };

  const social = (name: string) => {
    setError('');
    setNotice(`El acceso con ${name} todavía no está disponible. Usa tu correo por ahora.`);
  };

  if (sessionLoading) return null;

  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => switchMode(m)}
      className={`font-display text-[22px] pb-1 border-b-2 transition-colors ${
        mode === m ? 'text-green-600 font-semibold border-green-600' : (m === 'register' ? 'text-green-600 font-semibold border-transparent' : 'text-ink border-transparent')
      }`}>
      {label}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Manchas verdes del fondo */}
      <div className="hero-blob pointer-events-none absolute -left-40 top-24 h-[760px] w-[900px]" />

      {/* Barra superior */}
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-6 lg:px-[90px] pt-10 lg:pt-[100px]">
        <nav className="hidden md:flex items-center gap-14 font-display text-[22px] font-medium tracking-[0.04em] text-ink">
          <a href="#inicio" className="hover:text-green-700">Inicio</a>
          <a href="#nosotros" className="hover:text-green-700">Nosotros</a>
          <a href="#blog" className="hover:text-green-700">Blog</a>
          <a href="#contacto" className="hover:text-green-700">Contacto</a>
        </nav>
        <span className="md:hidden font-display text-lg font-bold tracking-[0.14em]">ENVIROGEST</span>
        <div className="flex items-center gap-8 lg:gap-12">
          <span className="hidden sm:flex items-center gap-1 font-display text-[20px] text-ink tracking-[0.04em]">
            Español <Icon n="cd" s={14} cls="text-stone-400" />
          </span>
          {tab('login', 'Login')}
          {tab('register', 'Registro')}
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[340px_1fr_420px] items-center gap-8 px-6 lg:px-[90px] pb-16 pt-8 lg:pt-6">
        {/* Titular */}
        <section className="hidden lg:block xl:-mt-6">
          <h1 className="font-display text-[56px] xl:text-[60px] font-bold leading-[1.22] text-ink">
            Gestión<br />Ambiental<br />Inteligente
          </h1>
          <p className="mt-10 text-[22px] leading-snug text-ink">
            {mode === 'login' ? (
              <>Si no tienes una cuenta te<br />puedes{' '}
                <button type="button" onClick={() => switchMode('register')} className="font-semibold text-teal-600 hover:underline">registrar aquí.</button>
              </>
            ) : (
              <>¿Ya tienes una cuenta?<br />
                <button type="button" onClick={() => switchMode('login')} className="font-semibold text-teal-600 hover:underline">Inicia sesión aquí.</button>
              </>
            )}
          </p>
        </section>

        {/* Ilustración */}
        <div className="hidden xl:flex justify-center">
          <img src="/hero-planta.png" alt="Persona sosteniendo un brote de planta"
            className="w-[150%] max-w-[860px] -mx-[25%] -mt-10 select-none" draggable={false} />
        </div>

        {/* Formulario */}
        <section className="w-full max-w-[420px] justify-self-center lg:justify-self-end">
          <p className="font-display text-[48px] sm:text-[60px] font-bold leading-none tracking-tight text-ink mb-10">
            ENVIROGEST
          </p>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <>
                <TextField value={nombre} onChange={setNombre} placeholder="Nombre" autoComplete="given-name" />
                <TextField value={apellido} onChange={setApellido} placeholder="Apellido" autoComplete="family-name" />
                <TextField value={empresa} onChange={setEmpresa} placeholder="Empresa" autoComplete="organization" />
                <div className="relative">
                  <select value={giro} onChange={e => setGiro(e.target.value)} aria-label="Giro industrial"
                    className={`${fieldCls} appearance-none ${giro ? '' : 'text-stone-500'}`}>
                    <option value="">Giro industrial</option>
                    {GIROS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                  <Icon n="cd" s={16} cls="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-500" />
                </div>
              </>
            )}

            <TextField value={email} onChange={setEmail} placeholder="email" type="email" autoComplete="email" />

            {mode === 'register' && <p className="pt-1 text-[14px] text-stone-600">Defina una contraseña</p>}
            <PasswordField value={pwd} onChange={setPwd} placeholder="Contraseña"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && (
              <PasswordField value={pwd2} onChange={setPwd2} placeholder="Confirmar contraseña" autoComplete="new-password" />
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button"
                  onClick={() => { setError(''); setNotice('La recuperación de contraseña por correo todavía no está disponible.'); }}
                  className="text-[13px] italic tracking-[0.06em] text-stone-700 hover:text-ink">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {(error || notice) && (
              <p role={error ? 'alert' : 'status'}
                className={`rounded-md px-4 py-3 text-[13px] ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
                {error || notice}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="mt-2 h-14 w-full rounded-md bg-green-600 font-display text-[17px] font-semibold tracking-[0.06em] text-white shadow-[0_10px_24px_-10px_rgba(101,154,73,.7)] hover:bg-green-700 disabled:opacity-60">
              {mode === 'login'
                ? (loading ? 'Entrando…' : 'Iniciar Sesión')
                : (loading ? 'Creando cuenta…' : 'Registrarse')}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 text-[13px] italic tracking-[0.06em] text-stone-500">
            <span className="h-px flex-1 bg-stone-200" />
            O puedes {mode === 'login' ? 'entrar' : 'registrarte'} con:
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <button type="button" onClick={() => social('Google')} aria-label="Continuar con Google"
              className="flex h-[60px] items-center justify-center rounded-md border border-stone-200 bg-stone-100 hover:bg-stone-200/70"><GoogleLogo /></button>
            <button type="button" onClick={() => social('Apple')} aria-label="Continuar con Apple"
              className="flex h-[60px] items-center justify-center rounded-md bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,.25)] hover:bg-stone-50"><AppleLogo /></button>
            <button type="button" onClick={() => social('Facebook')} aria-label="Continuar con Facebook"
              className="flex h-[60px] items-center justify-center rounded-md border border-stone-200 bg-stone-100 hover:bg-stone-200/70"><FacebookLogo /></button>
          </div>

          <p className="mt-8 text-center text-[14px] text-stone-600 lg:hidden">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-teal-600">{mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</button>
          </p>
        </section>
      </main>
    </div>
  );
}
