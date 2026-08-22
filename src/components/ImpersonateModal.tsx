import React, { useState, useEffect } from 'react';
import { Search, X, LogIn, Building2, Shield, Check } from 'lucide-react';
import { Tenant } from '../types';

interface ImpersonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
}

export const ImpersonateModal: React.FC<ImpersonateModalProps> = ({
  isOpen,
  onClose,
  tenants,
  onSelectTenant,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle modal
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.code.toLowerCase().includes(query.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#213145]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col">
        {/* Search header */}
        <div className="p-4 border-b border-[#bdcac0]/40 flex items-center gap-3 bg-[#f8f9ff]">
          <Search className="w-5 h-5 text-[#006a46]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenant by company name, TEN-ID, or admin email..."
            className="w-full bg-transparent text-sm font-medium text-[#0b1c30] outline-none"
          />
          <button
            onClick={onClose}
            className="text-[#545f73] hover:text-[#0b1c30] p-1 rounded-lg hover:bg-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#bdcac0]/30 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#545f73]">
              No matching tenant found for "{query}".
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTenant(t);
                  onClose();
                }}
                className="p-3 rounded-xl hover:bg-[#eff4ff] flex items-center justify-between cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold text-xs font-mono group-hover:bg-[#00855a] group-hover:text-white transition-colors">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0b1c30]">{t.name}</h4>
                    <p className="text-xs text-[#545f73]">
                      {t.code} • {t.adminEmail} • {t.plan}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      t.accessEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {t.accessEnabled ? 'Active' : 'Suspended'}
                  </span>
                  <button className="p-1.5 rounded-lg bg-[#006a46] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#eff4ff]/60 border-t border-[#bdcac0]/40 text-center text-[11px] text-[#545f73]">
          Impersonation triggers full tenant portal session isolation.
        </div>
      </div>
    </div>
  );
};
