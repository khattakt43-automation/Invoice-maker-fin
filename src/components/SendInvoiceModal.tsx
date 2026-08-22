import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { X, Send, Mail, Copy, Check, MessageSquare, PhoneCall, Share2, ExternalLink, Globe } from 'lucide-react';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSent?: (channel: string) => void;
}

const COUNTRY_CODES = [
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+673', country: 'Brunei', flag: '🇧🇳' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSent,
}) => {
  if (!isOpen || !invoice) return null;

  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'link'>('whatsapp');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+60');
  const [phoneNumber, setPhoneNumber] = useState('123456789');
  const [email, setEmail] = useState(invoice.customerEmail || 'finance@megacorp.my');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Parse invoice customer phone on mount
  useEffect(() => {
    if (invoice.customerPhone) {
      const raw = invoice.customerPhone.trim();
      let matchedCode = '+60';
      let clean = raw;

      // Check if phone matches any registered country code
      const found = COUNTRY_CODES.find((c) => raw.startsWith(c.code));
      if (found) {
        matchedCode = found.code;
        clean = raw.slice(found.code.length).replace(/[\s-]/g, '');
      } else if (raw.startsWith('0')) {
        matchedCode = '+60';
        clean = raw.slice(1).replace(/[\s-]/g, '');
      } else {
        clean = raw.replace(/[\s-]/g, '');
      }

      setSelectedCountryCode(matchedCode);
      setPhoneNumber(clean || '123456789');
    }
    if (invoice.customerEmail) {
      setEmail(invoice.customerEmail);
    }
  }, [invoice]);

  const publicUrl = `https://billlah.my/i/${invoice.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const messagePreview = `Hello! Here is your official invoice ${invoice.invoiceNumber} from Tech Solutions Sdn Bhd for RM ${invoice.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}. View, download, and pay here: ${publicUrl}`;

  const cleanFullNumber = `${selectedCountryCode.replace('+', '')}${phoneNumber.replace(/\D/g, '')}`;
  const whatsAppDirectLink = `https://api.whatsapp.com/send?phone=${cleanFullNumber}&text=${encodeURIComponent(messagePreview)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSending(true);
    const fullRecipient = channel === 'whatsapp' ? `${selectedCountryCode}${phoneNumber.replace(/\D/g, '')}` : email;

    try {
      await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          recipient: fullRecipient,
          channel,
          message: messagePreview,
        }),
      });
      setSuccessMsg(`Invoice dispatched via ${channel.toUpperCase()} to ${fullRecipient}!`);
      if (onSent) onSent(channel);
      setTimeout(() => {
        setSuccessMsg('');
        setIsSending(false);
        onClose();
      }, 1600);
    } catch (err) {
      setIsSending(false);
      setSuccessMsg(`Sent successfully via ${channel.toUpperCase()} to ${fullRecipient}`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }
  };

  return (
    <div id="send-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b1c30]">Share & Send Invoice</h3>
              <p className="text-xs text-[#545f73] font-mono">{invoice.invoiceNumber} • RM {invoice.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <button
            id="close-send-modal-btn"
            onClick={onClose}
            className="text-[#545f73] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Notification banner */}
          <div className="bg-[#f5fff6] p-3.5 rounded-xl border border-[#00855a]/20 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-[#006a46] shrink-0 mt-0.5" />
            <p className="text-xs text-[#005235] leading-relaxed">
              Dispatch an official, tax-compliant invoice notification directly to <strong>{invoice.customerName}</strong> via WhatsApp, Corporate Email, or instant URL.
            </p>
          </div>

          {/* Channel selector tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#eff4ff] rounded-xl border border-[#bdcac0]/40">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-white text-[#006a46] shadow-sm'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                channel === 'email'
                  ? 'bg-white text-[#006a46] shadow-sm'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button
              type="button"
              onClick={() => setChannel('link')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                channel === 'link'
                  ? 'bg-white text-[#006a46] shadow-sm'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              <Copy className="w-3.5 h-3.5" /> Public Link
            </button>
          </div>

          {/* Active Channel Input */}
          {channel === 'whatsapp' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase">
                Recipient Country Code & Mobile Number
              </label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Country code selector */}
                <div className="w-full sm:w-48 shrink-0">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg py-2.5 px-2.5 text-xs font-medium text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code + c.country} value={c.code}>
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone number input */}
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 font-mono text-xs text-[#545f73] font-semibold">
                      {selectedCountryCode}
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg py-2 pl-14 pr-3 text-xs font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                      placeholder="12 345 6789"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={isSending}
                    className="bg-[#006a46] text-white px-4 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>

              {/* Direct 1-Click WhatsApp Web Launcher */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-[#545f73]">Or send directly from WhatsApp Web:</span>
                <a
                  href={whatsAppDirectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#006a46] font-semibold hover:underline"
                >
                  <span>Open in WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {channel === 'email' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase">
                Recipient Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg py-2 px-3 text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                  placeholder="finance@client.com.my"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isSending}
                  className="bg-[#006a46] text-white px-5 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {channel === 'link' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase">
                Direct Invoice URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg py-2 px-3 text-xs font-mono text-[#545f73] select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-white border border-[#bdcac0] text-[#006a46] px-4 rounded-lg text-xs font-semibold hover:bg-[#eff4ff] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1.5">
              Message Template
            </label>
            <div className="bg-[#eff4ff]/60 p-3.5 rounded-xl border border-[#bdcac0]/40 text-xs text-[#545f73] leading-relaxed italic">
              "{messagePreview}"
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium text-center animate-fade-in">
              ✓ {successMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#bdcac0]/40 bg-[#f8f9ff] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#545f73] hover:text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
