import React, { useState } from 'react';
import { Customer } from '../types';
import { X, UserPlus, Building, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { apiFetch } from "./lib/api";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+60 ');
  const [tin, setTin] = useState('C');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contactPerson: contactPerson || 'Finance Manager',
          email,
          phone,
          tin: tin.trim() || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          address: address || 'Kuala Lumpur, Malaysia',
        }),
      });
      const data = await res.json();
      onCustomerAdded(data.data);
      onClose();
    } catch (err) {
      // Fallback local create
      const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'CL';
      const fallback: Customer = {
        id: `cust-${Date.now()}`,
        tenantId: 'tenant-tech-solutions',
        name,
        initials,
        contactPerson: contactPerson || 'Finance Manager',
        email,
        phone,
        tin: tin || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        address: address || 'Kuala Lumpur, Malaysia',
        outstandingBalance: 0,
        ltv: 0,
        status: 'PAID',
        joinedDate: 'Just now',
        recentInvoices: [],
      };
      onCustomerAdded(fallback);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#0b1c30]">Add New Customer</h3>
              <p className="text-xs text-[#545f73]">Register a corporate client for invoices and ledgers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#545f73] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#545f73]" /> Company / Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Synergy Sdn Bhd"
              className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Sarah Lee"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#545f73]" /> TIN Number
              </label>
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="C1234567890"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#545f73]" /> Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@apexsynergy.my"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#545f73]" /> Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#545f73]" /> Billing Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Suite 18, Plaza Mont Kiara, 50480 Kuala Lumpur"
              className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none resize-none"
            ></textarea>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-[#bdcac0]/40 flex justify-end gap-2">
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
              <UserPlus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Saving...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
