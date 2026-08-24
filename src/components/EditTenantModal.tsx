import React, { useState, useRef } from 'react';
import { Tenant } from '../types';
import {
  X,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CreditCard,
  Building,
  FileText,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  Upload,
  Trash2
} from 'lucide-react';

interface EditTenantModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onTenantUpdated: (updatedTenant: Tenant) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onTenantUpdated,
}) => {
  if (!isOpen || !tenant) return null;

  const [formData, setFormData] = useState<Tenant>({
    ...tenant,
    username: tenant.username || tenant.adminEmail.split('@')[0] || 'tenantadmin',
    password: tenant.password || 'Password123!',
    logoHeight: tenant.logoHeight || 52,
    invoiceTitle: tenant.invoiceTitle || 'Tax Invoice',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'tax_bank' | 'branding'>('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sampleLogoPresets = [
    {
      name: 'Tech Blue',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Emerald Corporate',
      url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Retail Gold',
      url: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        logoUrl: result,
        customerLogoUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: undefined,
      customerLogoUrl: undefined,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: res }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const mrrValue =
      formData.plan === 'Enterprise'
        ? 4999
        : formData.plan === 'Pro'
        ? 49
        : 0;

    const finalUpdated: Tenant = {
      ...formData,
      mrr: mrrValue,
      initials: formData.initials || (formData.name ? formData.name.substring(0, 2).toUpperCase() : 'TN'),
    };

    try {
      const res = await fetch(`/api/tenants/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdated),
      });

      if (res.ok) {
        const data = await res.json();
        onTenantUpdated(data.data || finalUpdated);
      } else {
        onTenantUpdated(finalUpdated);
      }
    } catch (err) {
      onTenantUpdated(finalUpdated);
    } finally {
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-[#bdcac0]/70 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0b1c30] text-white p-5 px-6 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006a46] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {formData.initials || 'TN'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Edit Tenant Details</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 text-emerald-300 font-semibold">
                  {formData.code}
                </span>
              </div>
              <p className="text-xs text-[#bcc7de] mt-0.5">
                Update corporate details, authentication, SST tax profiles & branding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#bcc7de] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#bdcac0]/40 bg-[#eff4ff]/60 px-6 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#006a46] text-[#006a46] font-bold'
                : 'border-transparent text-[#545f73] hover:text-[#0b1c30]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>General & Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'auth'
                ? 'border-[#006a46] text-[#006a46] font-bold'
                : 'border-transparent text-[#545f73] hover:text-[#0b1c30]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Admin & Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tax_bank')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tax_bank'
                ? 'border-[#006a46] text-[#006a46] font-bold'
                : 'border-transparent text-[#545f73] hover:text-[#0b1c30]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>SST & Banking</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'branding'
                ? 'border-[#006a46] text-[#006a46] font-bold'
                : 'border-transparent text-[#545f73] hover:text-[#0b1c30]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Branding & Logo</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GENERAL & STATUS */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                  Corporate / Business Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tech Solutions Sdn Bhd"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-sm font-semibold text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Tenant Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#006a46] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Initials (Avatar)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.initials}
                    onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#0b1c30] outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  >
                    <option value="Basic">Basic (Free)</option>
                    <option value="Pro">Pro (RM 49/mo)</option>
                    <option value="Enterprise">Enterprise (RM 4,999/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Billing Status
                  </label>
                  <select
                    value={formData.billingStatus}
                    onChange={(e) => setFormData({ ...formData, billingStatus: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Access toggle banner */}
              <div className="p-3 bg-[#eff4ff] border border-[#bdcac0]/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#006a46]" />
                  <div>
                    <p className="font-bold text-xs text-[#0b1c30]">Tenant Workspace Access Enabled</p>
                    <p className="text-[11px] text-[#545f73]">Allow tenant administrators and staff to sign in</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accessEnabled: !formData.accessEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.accessEnabled ? 'bg-[#006a46]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.accessEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#545f73]" /> Corporate Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs text-[#0b1c30] outline-none focus:border-[#006a46] resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AUTH & ADMIN CREDENTIALS */}
          {activeTab === 'auth' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Admin Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="e.g. Aminah Bakar"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#545f73]" /> Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="aminah@techsolutions.my"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#545f73]" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+60 12-345 6789"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono text-[#0b1c30] outline-none focus:border-[#006a46]"
                />
              </div>

              {/* Sign-in credentials panel */}
              <div className="p-4 bg-[#eff4ff] border border-[#bdcac0]/70 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#006a46] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" /> Tenant Portal Sign-In Credentials
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-[#006a46] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Gen New Password
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3e4942] uppercase mb-1">
                      Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. techadmin"
                      className="w-full bg-white border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#006a46] outline-none focus:border-[#006a46]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#3e4942] uppercase mb-1">
                      Login Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password"
                        className="w-full bg-white border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#0b1c30] outline-none pr-8 focus:border-[#006a46]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#545f73]">
                  These credentials allow this tenant to log in at the Tenant Billing Portal.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SST & BANKING */}
          {activeTab === 'tax_bank' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    SST Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.sstId}
                    onChange={(e) => setFormData({ ...formData, sstId: e.target.value })}
                    placeholder="W10-1808-32000123"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    LHDN Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="C24098129010"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Bank Name
                  </label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  >
                    <option value="Maybank">Maybank (Malayan Banking Berhad)</option>
                    <option value="CIMB Bank">CIMB Bank Berhad</option>
                    <option value="Public Bank">Public Bank Berhad</option>
                    <option value="RHB Bank">RHB Bank Berhad</option>
                    <option value="Hong Leong Bank">Hong Leong Bank</option>
                    <option value="AmBank">AmBank Berhad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="5123-4567-8900"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-mono font-bold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                    Bank Account Title
                  </label>
                  <input
                    type="text"
                    value={formData.bankTitle}
                    onChange={(e) => setFormData({ ...formData, bankTitle: e.target.value })}
                    placeholder="Account holder name"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING & LOGO */}
          {activeTab === 'branding' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#006a46]" /> Invoice Document Header Title
                </label>
                <input
                  type="text"
                  value={formData.invoiceTitle || 'Tax Invoice'}
                  onChange={(e) => setFormData({ ...formData, invoiceTitle: e.target.value })}
                  placeholder="e.g. Tax Invoice, Commercial Invoice, Official Receipt"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs font-bold text-[#0b1c30] outline-none focus:border-[#006a46]"
                />
              </div>

              {/* Logo File Upload & Drag-and-Drop Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1.5 flex items-center justify-between">
                  <span>Upload Logo Image *</span>
                  <span className="text-[10px] text-[#545f73] font-mono">PNG, JPG, SVG, WebP (Max 5MB)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Preview Box */}
                  <div className="sm:col-span-4 bg-[#f8f9ff] border-2 border-dashed border-[#bdcac0] rounded-2xl p-3 flex flex-col items-center justify-center min-h-[110px] text-center">
                    {formData.logoUrl || formData.customerLogoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="p-1.5 bg-white rounded-lg border border-[#bdcac0]/60 shadow-xs flex items-center justify-center overflow-hidden"
                          style={{
                            height: `${Math.min(formData.logoHeight || 52, 60)}px`,
                            maxWidth: '120px',
                          }}
                        >
                          <img
                            src={formData.logoUrl || formData.customerLogoUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="text-[10px] font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-xl bg-[#00855a] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {formData.initials || 'TS'}
                        </div>
                        <span className="text-[10px] text-[#545f73]">No custom logo</span>
                      </div>
                    )}
                  </div>

                  {/* Dropzone / Upload button */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`sm:col-span-8 p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDragging
                        ? 'border-[#006a46] bg-[#00855a]/10'
                        : 'border-[#bdcac0] bg-[#f8f9ff] hover:bg-[#eff4ff] hover:border-[#006a46]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-white border border-[#bdcac0]/60 flex items-center justify-center text-[#006a46] shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0b1c30]">
                        Click to upload logo or drag & drop here
                      </p>
                      <p className="text-[10px] text-[#545f73]">
                        Transparent PNG or SVG recommended
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Size controller */}
              <div className="p-3 bg-[#eff4ff] border border-[#bdcac0]/60 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0b1c30] flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#006a46]" /> Logo Print Height:
                  </span>
                  <span className="font-mono font-bold text-[#006a46] px-2 py-0.5 bg-white rounded border border-[#bdcac0]">
                    {formData.logoHeight || 52} px
                  </span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={120}
                  step={2}
                  value={formData.logoHeight || 52}
                  onChange={(e) => setFormData({ ...formData, logoHeight: Number(e.target.value) })}
                  className="w-full accent-[#006a46] cursor-pointer"
                />
              </div>

              {/* Logo URL Input (optional alternative) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1">
                  Or Paste External Logo Image URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl || formData.customerLogoUrl || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoUrl: e.target.value,
                      customerLogoUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-xs text-[#0b1c30] outline-none focus:border-[#006a46]"
                />
              </div>

              {/* Sample presets */}
              <div>
                <span className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider block mb-1.5">
                  Pick Sample Logo Preset:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleLogoPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          logoUrl: p.url,
                          customerLogoUrl: p.url,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg border border-[#bdcac0]/60 bg-white hover:bg-[#eff4ff] text-[11px] font-semibold text-[#006a46] transition-all cursor-pointer shadow-2xs"
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[11px] font-semibold text-red-700 transition-all cursor-pointer"
                  >
                    Clear Logo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tenant updated successfully! Saving changes...</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#bdcac0]/40 flex justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#545f73] hover:text-[#0b1c30] rounded-xl hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-tenant-modal-btn"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#006a46] text-white hover:bg-[#00855a]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Tenant Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
