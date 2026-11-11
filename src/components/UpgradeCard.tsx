import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';

const KEY = 'envirogest.upgradeCard.hidden';

function readHidden() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** Hojas decorativas de las esquinas (dibujadas a mano, sin imágenes). */
function Leaves({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <path d="M8 58 C10 38 22 26 40 22 C34 36 24 48 8 58 Z" fill="#3F7A3A" />
      <path d="M8 58 C20 46 30 36 40 22" stroke="#2B5A29" strokeWidth="1.2" fill="none" />
      <path d="M2 44 C2 30 10 20 22 16 C20 28 14 38 2 44 Z" fill="#5E9B4C" />
      <path d="M20 60 C26 48 38 42 52 42 C44 52 34 58 20 60 Z" fill="#4E8A41" />
    </svg>
  );
}

/** Tarjeta flotante "Mejora tu plan" (esquina inferior derecha). */
export function UpgradeCard() {
  const [hidden, setHidden] = useState(readHidden);
  const [open, setOpen] = useState(false);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento */ }
  };

  return (
    <>
      {/* En pantallas muy anchas flota en la esquina; en las demás queda al final de la página para no tapar contenido. */}
      <aside className="relative ml-auto hidden md:block w-[216px] h-[107px] overflow-hidden rounded-sm bg-sand min-[1720px]:fixed min-[1720px]:bottom-6 min-[1720px]:right-6 min-[1720px]:z-20">
        <Leaves className="absolute -left-2 -bottom-3 w-14 h-14" />
        <Leaves className="absolute -right-3 -top-4 w-12 h-12 rotate-180" />
        <button onClick={dismiss} aria-label="Ocultar"
          className="absolute top-1.5 left-1.5 p-0.5 rounded text-stone-400 hover:text-stone-700">
          <Icon n="x" s={12} />
        </button>
        <div className="relative flex h-full flex-col items-center justify-center gap-2">
          <p className="text-[13px] text-ink">Mejora tu plan</p>
          <button onClick={() => setOpen(true)}
            className="rounded-sm bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700">
            Mejorar ahora
          </button>
        </div>
      </aside>

      <Modal open={open} onClose={() => setOpen(false)} title="Mejora tu plan" width="max-w-md">
        <p className="text-sm text-stone-600 leading-relaxed">
          Los planes de pago todavía no están disponibles.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed mt-3">
          Cuando se habiliten podrás activarlos tú mismo desde Configuración, sin intermediarios.
        </p>
        <div className="flex justify-end mt-6">
          <button onClick={() => setOpen(false)} className="h-10 px-4 rounded-md bg-green-600 text-sm font-semibold text-white hover:bg-green-700">
            Entendido
          </button>
        </div>
      </Modal>
    </>
  );
}
