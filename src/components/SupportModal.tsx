import React from 'react';
import { X, HelpCircle, Phone, Mail, FileCheck, ExternalLink, ShieldCheck } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b1c30]">BillLah! Support & Compliance</h3>
              <p className="text-xs text-[#545f73]">Malaysian Corporate Invoicing Concierge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#545f73] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-[#545f73]">
          <div className="p-4 bg-[#f5fff6] rounded-xl border border-[#00855a]/20 text-[#005235] space-y-1">
            <p className="font-bold text-sm text-[#006a46]">LHDN e-Invoicing Compliance Helpdesk</p>
            <p className="leading-relaxed">
              Our certified tax engineers assist Malaysian business entities with SST-02 schedules, XML transmission schemas, and API webhook integrations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40">
              <Phone className="w-5 h-5 text-[#006a46] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">Priority Phone Support (Malaysia)</span>
                <span className="font-mono text-[#545f73]">+60 3-7890 1200 (Mon-Fri 9:00 AM - 6:00 PM MYT)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40">
              <Mail className="w-5 h-5 text-[#006a46] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">Enterprise SLA Email</span>
                <span className="font-mono text-[#545f73]">concierge@billlah.my</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40">
              <ShieldCheck className="w-5 h-5 text-[#00855a] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">Dedicated Tenant Migration</span>
                <span>Assistance moving records from AutoCount, SQL Account, QuickBooks, or SAP.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#bdcac0]/40 bg-[#f8f9ff] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#006a46] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#00855a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
