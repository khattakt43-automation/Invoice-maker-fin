import React, { useState } from 'react';
import { X, HelpCircle, Phone, Mail, MessageCircle, Send } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT = {
  phone: '+923333212222',
  email: 'Khattakt41@gmail.com',
  whatsapp: '+923333212222',
};

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const waLink = `https://wa.me/${SUPPORT.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hello, I need help with BillLah! Invoice Maker.'
  )}`;

  const mailto = `mailto:${SUPPORT.email}?subject=${encodeURIComponent(
    subject || 'BillLah! Support Request'
  )}&body=${encodeURIComponent(message || 'Hello, I need assistance with...')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b1c30]">Help & Support</h3>
              <p className="text-xs text-[#545f73]">We're here to help you</p>
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
        <div className="p-6 space-y-4 text-xs text-[#545f73] overflow-y-auto custom-scrollbar">
          {/* Contact cards */}
          <div className="space-y-3">
            <a
              href={`tel:${SUPPORT.phone}`}
              className="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40 hover:bg-[#eff4ff] transition-colors"
            >
              <Phone className="w-5 h-5 text-[#006a46] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">Phone</span>
                <span className="font-mono text-[#545f73]">{SUPPORT.phone}</span>
              </div>
            </a>

            <a
              href={`mailto:${SUPPORT.email}`}
              className="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40 hover:bg-[#eff4ff] transition-colors"
            >
              <Mail className="w-5 h-5 text-[#006a46] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">Email</span>
                <span className="font-mono text-[#545f73]">{SUPPORT.email}</span>
              </div>
            </a>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[#25D366]/10 rounded-xl border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-[#128C7E] shrink-0" />
              <div>
                <span className="font-bold text-[#0b1c30] block">WhatsApp</span>
                <span className="font-mono text-[#545f73]">{SUPPORT.whatsapp}</span>
              </div>
            </a>
          </div>

         

   {/* Send a message */}
          <div className="pt-2 space-y-2">
            <p className="font-bold text-[#0b1c30] text-sm">Send us a message</p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-xs text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              rows={3}
              className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-xs text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 resize-none"
            />
            <a
              href={mailto}
              className="flex items-center justify-center gap-2 w-full bg-[#006a46] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-all"
              onClick={() => setSent(true)}
            >
              <Send className="w-4 h-4" />
              <span>{sent ? 'Opening email...' : 'Send Email'}</span>
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-[#1ebe5d] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#bdcac0]/40 bg-[#f8f9ff] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#0b1c30] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#1a2d47]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
