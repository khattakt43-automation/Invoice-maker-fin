import React, { useState } from 'react';
import { RetainerPlan } from '../types';
import { X, Sparkles, CheckCircle2, Calendar, Mail, Building, Phone } from 'lucide-react';
import { apiFetch } from "./lib/api";

interface BookDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RetainerPlan | null;
}

export const BookDiscoveryModal: React.FC<BookDiscoveryModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  if (!isOpen || !plan) return null;

  const [companyName, setCompanyName] = useState('Tech Solutions Sdn Bhd');
  const [contactEmail, setContactEmail] = useState('aminah@techsolutions.my');
  const [phone, setPhone] = useState('+60 12-345 6789');
  const [preferredTime, setPreferredTime] = useState('Next Available (Today 3:00 PM)');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          companyName,
          contactEmail,
          phone,
          preferredTime,
          notes,
        }),
      });
      setIsSubmitted(true);
    } catch (err) {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b1c30]">{plan.name}</h3>
              <p className="text-xs text-[#545f73] font-mono">
                {plan.priceFormatted === 'Custom' ? 'Custom Quote' : `From RM ${plan.priceFormatted}${plan.period}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#545f73] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-[#006a46] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#0b1c30]">Request Confirmed!</h4>
            <p className="text-sm text-[#545f73] max-w-sm mx-auto">
              Our Senior Billing Strategist will contact <strong>{contactEmail}</strong> to review your business scope and schedule your discovery walkthrough.
            </p>
            <button
              onClick={onClose}
              className="bg-[#006a46] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00855a] transition-all shadow-sm mt-4"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-[#f5fff6] p-3 rounded-xl border border-[#00855a]/20 text-xs text-[#005235]">
              Includes dedicated tenant migration, custom branded invoicing templates, and SLA concierge support.
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#545f73]" /> Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#545f73]" /> Work Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#545f73]" /> Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#545f73]" /> Preferred Discovery Session
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              >
                <option>Next Available (Today 3:00 PM)</option>
                <option>Tomorrow Morning (10:00 AM)</option>
                <option>Tomorrow Afternoon (2:30 PM)</option>
                <option>This Week Thursday (11:00 AM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                Specific Invoicing or ERP Requirements (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Monthly volume of ~300 SST invoices, integrating with SAP/AutoCount."
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none resize-none"
              ></textarea>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#bdcac0]/40 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#545f73] hover:text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#006a46] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                {isSubmitting ? 'Submitting...' : plan.ctaText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
