import React from 'react';
import { History as HistoryIcon, CheckCircle2 } from 'lucide-react';

interface ChangesViewProps {
  onBack?: () => void;
}

const CHANGES: { date: string; title: string; items: string[] }[] = [
  {
    date: '2026-08-23',
    title: '12-Point Invoice System Update',
    items: [
      'Paper Size: A4 / A5 / Letter / Legal now drive sheet dimensions + label, in preview and print.',
      'Print/PDF fidelity: clone-to-print-host so output matches the on-screen preview exactly.',
      'Currency: removed hardcoded RM; all money uses fmt() with selected currency (MYR/USD/SGD/EUR).',
      'Invoice Maker Templates moved to Admin area, marked Draft, publishing disabled (coming soon).',
      'Invoice Header & Document Title: per-invoice title + show/hide toggle on Create Invoice.',
      'Delete Customer + Delete Invoice buttons with confirmation modals + server DELETE routes.',
      'Mobile burger menu: off-canvas sidebar drawer + TopAppBar burger toggle.',
      'Tenant Admin profile: editable name/email/phone + profile picture upload.',
      'Help & Support: phone +923333212222, email Khattakt41@gmail.com, WhatsApp +923333212222, email form + WhatsApp button.',
      'Notes & Payment Terms alignment: Left / Center / Right, reflected in preview + print.',
      'Changes Made So Far tracking document + this view.',
      'QR Code component: data + size + Left/Center/Right alignment in preview/print/PDF.',
      'Re-applied SST dynamic label + Bank Account Title field fixes.',
    ],
  },
  {
    date: 'Earlier',
    title: 'Foundation',
    items: [
      'Vercel invoice template swapped into ~/Invoice-Maker serving on :3000.',
      'Invoice Maker server runs as node dist/server.cjs (real API + frontend).',
      'Olivia Textile site deployed via nginx + SSL on port 3003 (https://oliviatextile.my).',
    ],
  },
];

export const ChangesView: React.FC<ChangesViewProps> = ({ onBack }) => {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00855a]/10 text-[#006a46] flex items-center justify-center">
          <HistoryIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30]">Changes Made So Far</h2>
          <p className="text-sm text-[#545f73]">Running record of every change, fix, and feature.</p>
        </div>
      </div>

      {CHANGES.map((group) => (
        <div key={group.title} className="bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#bdcac0]/40 pb-2">
            <h3 className="text-lg font-bold text-[#006a46]">{group.title}</h3>
            <span className="text-[11px] font-mono text-[#545f73]">{group.date}</span>
          </div>
          <ul className="space-y-2">
            {group.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#0b1c30]">
                <CheckCircle2 className="w-4 h-4 text-[#006a46] shrink-0 mt-0.5" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {onBack && (
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#006a46] hover:underline"
        >
          ← Back
        </button>
      )}
    </div>
  );
};
