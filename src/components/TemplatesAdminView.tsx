import React from 'react';
import { Layers, FileText, Eye, Lock } from 'lucide-react';

interface TemplatesAdminViewProps {
  onNavigateToTab?: (tab: string) => void;
}

// Built-in invoice templates available in the system. Kept here as a simple
// registry. Marked DRAFT — publishing from this section is intentionally
// disabled until a future update enables it.
const TEMPLATES = [
  {
    id: 'official',
    name: 'BillIt Invoice (Official)',
    description: 'Malaysian SST-compliant tax invoice with company header, itemised table, and remittance block.',
    status: 'Draft',
  },
];

export const TemplatesAdminView: React.FC<TemplatesAdminViewProps> = () => {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00855a]/10 text-[#006a46] flex items-center justify-center">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30]">Invoice Maker Templates</h2>
          <p className="text-sm text-[#545f73]">Admin area · Draft templates (publishing disabled for now)</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
        <Lock className="w-4 h-4" />
        <span>These templates are in <strong>Draft</strong>. Publishing is disabled — it will be enabled in a future update.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006a46]" />
                <h3 className="font-bold text-[#0b1c30]">{t.name}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                {t.status}
              </span>
            </div>
            <p className="text-xs text-[#545f73] leading-relaxed">{t.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f8f9ff] text-[#545f73] border border-[#bdcac0] cursor-not-allowed opacity-60"
                title="Publishing disabled"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006a46] text-white opacity-50 cursor-not-allowed"
                title="Publishing disabled"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
