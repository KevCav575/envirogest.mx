import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Btn } from '@/components/ui/Btn';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/SelectField';
import { Modal } from '@/components/ui/Modal';
import { GIROS } from '@/constants/giros';
import { useAppStore } from '@/store/useAppStore';
import { fmtDate, today } from '@/lib/utils';

/** Fila de configuración: título y explicación a la izquierda, controles a la derecha. */
function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 border-b border-stone-200 py-8">
      <div>
        <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-stone-500 leading-relaxed">{hint}</p>
      </div>
      <div className="max-w-[520px]">{children}</div>
    </section>
  );
}

function Feedback({ error, ok }: { error: string; ok: string }) {
  if (!error && !ok) return null;
  return (
    <p role={error ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2 text-[13px] ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
      {error || ok}
    </p>
  );
}

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data, currentUser, updateAccount, updateProject, changePassword, resetWorkspace, deleteAccount } = useAppStore();
  const proj = data.proyectos.find(p => p.id === projectId);

  // ── Empresa y cuenta ──
  const [acc, setAcc] = useState({
    empresa: currentUser?.empresa ?? '',
    giro:    currentUser?.giro ?? '',
    nombre:  currentUser?.nombre ?? '',
    email:   currentUser?.email ?? '',
  });
  const [accMsg, setAccMsg] = useState({ error: '', ok: '' });
  const [giroChanged, setGiroChanged] = useState(false);

  // ── Contraseña ──
  const [pwd, setPwd] = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwdMsg, setPwdMsg] = useState({ error: '', ok: '' });

  // ── Zona delicada ──
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delPwd, setDelPwd] = useState('');
  const [delErr, setDelErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!proj || !currentUser) return null;

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const prevGiro = currentUser.giro ?? '';
    const error = await updateAccount(acc);
    setBusy(false);
    if (error) { setAccMsg({ error, ok: '' }); return; }
    if (acc.giro !== prevGiro) {
      // Si aún no hay diagnóstico, el nuevo giro queda preseleccionado
      if (!proj.cuestionario.respondido) {
        updateProject({ cuestionario: { ...proj.cuestionario, respuestas: { ...proj.cuestionario.respuestas, giro: acc.giro } } });
      } else {
        setGiroChanged(true);
      }
    }
    setAccMsg({ error: '', ok: 'Cambios guardados.' });
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.nueva !== pwd.confirmar) { setPwdMsg({ error: 'Las contraseñas nuevas no coinciden.', ok: '' }); return; }
    setBusy(true);
    const error = await changePassword(pwd.actual, pwd.nueva);
    setBusy(false);
    if (error) { setPwdMsg({ error, ok: '' }); return; }
    setPwd({ actual: '', nueva: '', confirmar: '' });
    setPwdMsg({ error: '', ok: 'Contraseña actualizada.' });
  };

  const downloadBackup = () => {
    const { id, nombre, empresa, email, giro } = currentUser;
    const payload = { exportado: new Date().toISOString(), cuenta: { id, nombre, empresa, email, giro }, espacio: proj };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `envirogest-${empresa.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doReset = () => {
    resetWorkspace();
    setConfirmReset(false);
    navigate(`/proyecto/${projectId}/diagnostico`);
  };

  const doDelete = async () => {
    setBusy(true);
    const error = await deleteAccount(delPwd);
    setBusy(false);
    if (error) { setDelErr(error); return; }
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 lg:px-6 pt-12 fade-in">
      <div className="pb-5 border-b border-stone-200">
        <h1 className="font-display text-[22px] font-medium text-green-600">Configuración</h1>
        <p className="text-sm text-stone-500">
          {currentUser.empresa} · cuenta propietaria desde {fmtDate(proj.creado)}
        </p>
      </div>

      <Section title="Empresa y cuenta" hint="Datos de tu empresa y de la persona que administra la cuenta. El giro define qué trámites te aplican.">
        <form onSubmit={saveAccount} className="space-y-4">
          <Input label="Nombre de la empresa" value={acc.empresa} onChange={v => setAcc(a => ({ ...a, empresa: v }))} required />
          <SelectField label="Giro industrial" value={acc.giro} onChange={v => setAcc(a => ({ ...a, giro: v }))}
            options={GIROS.map(g => ({ value: g.id, label: g.label }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tu nombre" value={acc.nombre} onChange={v => setAcc(a => ({ ...a, nombre: v }))} required />
            <Input label="Correo" type="email" value={acc.email} onChange={v => setAcc(a => ({ ...a, email: v }))} required />
          </div>
          <Feedback {...accMsg} />
          {giroChanged && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              Cambiaste el giro. <Link to={`/proyecto/${projectId}/diagnostico`} className="font-semibold underline">Repite el diagnóstico</Link> para
              actualizar tu lista de trámites.
            </p>
          )}
          <Btn type="submit" disabled={busy}>Guardar cambios</Btn>
        </form>
      </Section>

      <Section title="Contraseña" hint="Usa al menos 6 caracteres. Solo tú tienes acceso a esta cuenta.">
        <form onSubmit={savePassword} className="space-y-4">
          <Input label="Contraseña actual" type="password" value={pwd.actual} onChange={v => setPwd(p => ({ ...p, actual: v }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nueva contraseña" type="password" value={pwd.nueva} onChange={v => setPwd(p => ({ ...p, nueva: v }))} />
            <Input label="Confirmar" type="password" value={pwd.confirmar} onChange={v => setPwd(p => ({ ...p, confirmar: v }))} />
          </div>
          <Feedback {...pwdMsg} />
          <Btn type="submit" variant="secondary" disabled={busy || !pwd.actual || !pwd.nueva}>Cambiar contraseña</Btn>
        </form>
      </Section>

      <Section title="Tus datos" hint="Descarga un respaldo con el diagnóstico, los trámites, las fechas, la agenda y el avance de ISO 14001.">
        <Btn variant="secondary" onClick={downloadBackup}>Descargar respaldo (.json)</Btn>
      </Section>

      <section className="py-8">
        <h2 className="font-display text-[17px] font-semibold text-red-700">Zona delicada</h2>
        <div className="mt-4 divide-y divide-stone-200 rounded-lg border border-red-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Reiniciar el espacio de trabajo</p>
              <p className="text-[13px] text-stone-500">Borra diagnóstico, trámites, alertas, agenda y avance de ISO. Tu cuenta se conserva.</p>
            </div>
            <Btn variant="secondary" onClick={() => setConfirmReset(true)}>Reiniciar</Btn>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Eliminar la cuenta de la empresa</p>
              <p className="text-[13px] text-stone-500">Borra la cuenta y todos sus datos. No se puede deshacer.</p>
            </div>
            <Btn variant="danger" onClick={() => { setDelPwd(''); setDelErr(''); setConfirmDelete(true); }}>Eliminar cuenta</Btn>
          </div>
        </div>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reiniciar espacio de trabajo" width="max-w-md">
        <p className="text-sm text-stone-600">
          Se borrarán el diagnóstico, los {proj.tramites.length} trámites, las alertas, la agenda y el avance de ISO 14001.
          Te recomendamos descargar un respaldo antes.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setConfirmReset(false)}>Cancelar</Btn>
          <Btn variant="danger" onClick={doReset}>Reiniciar</Btn>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar cuenta" width="max-w-md">
        <p className="text-sm text-stone-600 mb-4">
          Escribe tu contraseña para eliminar <span className="font-semibold text-ink">{currentUser.empresa}</span> y todos sus datos.
        </p>
        <Input label="Contraseña" type="password" value={delPwd} onChange={setDelPwd} />
        {delErr && <p role="alert" className="mt-3 text-[13px] text-red-700">{delErr}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Btn>
          <Btn variant="danger" onClick={doDelete} disabled={!delPwd || busy}>Eliminar definitivamente</Btn>
        </div>
      </Modal>
    </div>
  );
}
