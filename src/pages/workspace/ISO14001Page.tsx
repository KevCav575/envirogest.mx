import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Btn } from '@/components/ui/Btn';
import { Card } from '@/components/ui/Card';
import { ISO_DATA } from '@/constants/iso14001';
import { useAppStore } from '@/store/useAppStore';

export default function ISO14001Page() {
  const { projectId }           = useParams<{ projectId: string }>();
  const { data, updateProject } = useAppStore();

  const proj = data.proyectos.find(p => p.id === projectId);
  const secs = proj?.iso14001?.secciones ?? {};

  const [openSec, setOpenSec] = useState('4');

  const toggle = (sid: string, iid: string) => {
    const s = secs[sid] ?? {};
    updateProject({ iso14001: { ...proj?.iso14001, secciones: { ...secs, [sid]: { ...s, [iid]: !s[iid] } } } });
  };

  const secPct = (sid: string) => {
    const items = ISO_DATA[sid].items;
    const s     = secs[sid] ?? {};
    return items.length ? Math.round(items.filter(i => s[i.id]).length / items.length * 100) : 0;
  };

  const totalItems = Object.values(ISO_DATA).flatMap(s => s.items).length;
  const totalDone  = Object.entries(secs).reduce(
    (a, [sid, s]) => a + (ISO_DATA[sid]?.items ?? []).filter(i => s[i.id]).length, 0,
  );
  const totalPct = totalItems ? Math.round(totalDone / totalItems * 100) : 0;

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ISO 14001:2015</h1>
          <p className="text-sm text-gray-500">Checklist SGA · Ciclo PHVA (Caps. 4–10)</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-800">{totalPct}%</p>
          <p className="text-xs text-gray-500">{totalDone}/{totalItems} requisitos</p>
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-green-700 transition-all" style={{ width: `${totalPct}%` }} />
      </div>

      {/* Section selector */}
      <div className="grid grid-cols-7 gap-2 mb-5">
        {Object.entries(ISO_DATA).map(([sid]) => {
          const p = secPct(sid);
          return (
            <button key={sid} onClick={() => setOpenSec(sid)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${openSec === sid ? 'border-green-700 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
              <p className="text-lg font-bold" style={{ color: p === 100 ? '#10B981' : p > 50 ? '#3B82F6' : p > 0 ? '#F59E0B' : '#9CA3AF' }}>{p}%</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Cap. {sid}</p>
            </button>
          );
        })}
      </div>

      {/* Active section */}
      {Object.entries(ISO_DATA).map(([sid, sec]) => openSec !== sid ? null : (
        <Card key={sid} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Cap. {sid}</span>
              <h3 className="font-semibold text-gray-800 mt-1">{sec.nombre}</h3>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-800">{secPct(sid)}%</p>
              <div className="w-16 h-1.5 rounded-full bg-gray-100 mt-1 ml-auto overflow-hidden">
                <div className="h-full rounded-full bg-green-700" style={{ width: `${secPct(sid)}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {sec.items.map(item => {
              const checked = !!((secs[sid] ?? {})[item.id]);
              return (
                <label key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${checked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'}`}>
                  <div onClick={() => toggle(sid, item.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${checked ? 'bg-green-700 border-green-700' : 'border-gray-300'}`}>
                    {checked && <Icon n="check" s={11} c="white" />}
                  </div>
                  <span className={`text-sm leading-relaxed ${checked ? 'text-green-900' : 'text-gray-700'}`} onClick={() => toggle(sid, item.id)}>
                    {item.texto}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {Number(sid) > 4 && (
              <Btn variant="secondary" size="sm" onClick={() => setOpenSec(String(Number(sid) - 1))}>
                <Icon n="cl" s={13} />Anterior
              </Btn>
            )}
            {Number(sid) < 10 && (
              <Btn size="sm" onClick={() => setOpenSec(String(Number(sid) + 1))}>
                Siguiente<Icon n="cr" s={13} />
              </Btn>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
