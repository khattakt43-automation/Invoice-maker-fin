import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Building,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  CreditCard,
  Building2,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  KeyRound,
  Sliders,
  Maximize2
} from 'lucide-react';
import { Tenant } from '../types';
import { apiFetch } from "./lib/api";

interface TenantSettingsViewProps {
  tenant: Tenant;
  onUpdateTenant: (updatedTenant: Tenant) => void;
  soundsEnabled?: boolean;
  onToggleSounds?: (val: boolean) => void;
}

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  tenant,
  onUpdateTenant,
  soundsEnabled,
  onToggleSounds,
}) => {
  const [formData, setFormData] = useState<Tenant>({
    ...tenant,
    username: tenant.username || tenant.adminEmail.split('@')[0] || 'tenantadmin',
    password: tenant.password || 'Password123!',
    logoHeight: tenant.logoHeight || 52,
    invoiceTitle: tenant.invoiceTitle || 'Tax Invoice',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    tenant.logoUrl || tenant.customerLogoUrl
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset sample corporate logos for quick testing
  const sampleLogos = [
    {
      name: 'Tech Shield',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    },
    {
      name: 'Emerald Leaf',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=160&auto=format&fit=crop&q=80',
    },
    {
      name: 'Corporate Geometric',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80',
    },
  ];

  const invoiceTitlePresets = [
    'Tax Invoice',
    'Tax Invoice / Invois Cukai',
    'Commercial Invoice',
    'Proforma Invoice',
    'Official Receipt',
    'Standard Invoice',
  ];

  const logoSizePresets = [
    { label: 'Small (36px)', value: 36 },
    { label: 'Standard (52px)', value: 52 },
    { label: 'Medium (68px)', value: 68 },
    { label: 'Large (88px)', value: 88 },
    { label: 'Extra Large (110px)', value: 110 },
  ];

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      const updated = {
        ...formData,
        logoUrl: result,
        customerLogoUrl: result,
      };
      setFormData(updated);
      onUpdateTenant(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(undefined);
    const updated = {
      ...formData,
      logoUrl: undefined,
      customerLogoUrl: undefined,
    };
    setFormData(updated);
    onUpdateTenant(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectSampleLogo = (url: string) => {
    setLogoPreview(url);
    const updated = {
      ...formData,
      logoUrl: url,
      customerLogoUrl: url,
    };
    setFormData(updated);
    onUpdateTenant(updated);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsError(false);
    onUpdateTenant(formData);

    try {
      const res = await fetch(`/api/tenants/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      // Surface a real failure instead of pretending the save succeeded.
      console.error('Tenant settings save failed', err);
      setIsError(true);
      setTimeout(() => setIsError(false), 5000);
    }
  };

  // Keep form in sync with the tenant prop (refreshed from the server after a
  // save and on session restore). Without this a fast refresh could show stale
  // initial state. The tenant prop only changes on legitimate events (save /
  // logout-login / refresh), never mid-keystroke, so it is safe to re-sync.
  useEffect(() => {
    setFormData((prev) => {
      if (prev.id !== tenant.id) {
        return {
          ...tenant,
          username: tenant.username || tenant.adminEmail.split('@')[0] || 'tenantadmin',
          password: tenant.password || 'Password123!',
          logoHeight: tenant.logoHeight || 52,
          invoiceTitle: tenant.invoiceTitle || 'Tax Invoice',
        };
      }
      const merged = { ...tenant };
      if (!merged.password) merged.password = prev.password || 'Password123!';
      return merged;
    });
    setLogoPreview(tenant.logoUrl || tenant.customerLogoUrl);
  }, [tenant]);

  return (
    <div id="tenant-settings-view" className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0b1c30] tracking-tight">Tenant Settings</h2>
          <p className="text-sm text-[#545f73]">
            Configure customer brand logo, manual sizing, document titles, Malaysian corporate identity, and bank accounts.
          </p>
        </div>

        {/* Notification & System Sounds (Point 8) */}
        <div className="flex items-center gap-3 bg-[#f8f9ff] border border-[#bdcac0]/60 rounded-xl px-4 py-3 shrink-0">
          <div>
            <div className="text-xs font-bold text-[#0b1c30]">Notification &amp; System Sounds</div>
            <div className="text-[10px] text-[#545f73]">New notification, invoice generated &amp; deleted</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={soundsEnabled}
            onClick={() => onToggleSounds?.(!soundsEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${soundsEnabled ? 'bg-[#006a46]' : 'bg-[#bdcac0]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${soundsEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* Top Save button with animated tick reaction */}
        <button
          type="button"
          id="top-save-tenant-settings-btn"
          onClick={() => handleSave()}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0 ${
            isError
              ? 'bg-red-600 text-white ring-2 ring-red-400/50'
              : isSaved
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-200'
              : 'bg-[#006a46] text-white hover:bg-[#00855a]'
          }`}
        >
          {isError ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-100" />
              <span>Save failed</span>
            </>
          ) : isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-100 animate-bounce" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-red-900">Save failed</p>
            <p className="text-red-700 font-normal mt-0.5">
              The server rejected the update. Please check your connection and try again. Your changes were not saved.
            </p>
          </div>
        </div>
      )}

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Changes Saved Successfully</p>
            <p className="text-emerald-700 font-normal mt-0.5">
              All branding customizations, logo dimensions, and document titles are now active across invoices and customer receipts.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. CUSTOMER & COMPANY LOGO UPLOAD & MANUAL RESIZING SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#bdcac0]/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Customer & Company Logo</h3>
                <p className="text-xs text-[#545f73]">
                  Upload brand artwork and manually adjust the display size for tax invoices and headers.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#006a46] bg-[#eff4ff] px-2.5 py-1 rounded-md font-semibold">
              PNG / JPG / SVG / WebP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Logo Preview Block */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#f8f9ff] border-2 border-dashed border-[#bdcac0] rounded-2xl text-center relative group min-h-[220px]">
              <span className="absolute top-2.5 left-3 text-[10px] uppercase font-bold text-[#545f73] tracking-wider">
                Live Preview ({formData.logoHeight || 52}px)
              </span>
              {logoPreview ? (
                <div className="flex flex-col items-center space-y-4 pt-3">
                  <div
                    className="p-2 bg-white rounded-xl border border-[#bdcac0]/60 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-150"
                    style={{
                      height: `${formData.logoHeight || 52}px`,
                      maxWidth: `${(formData.logoHeight || 52) * 3.5}px`,
                    }}
                  >
                    <img
                      src={logoPreview}
                      alt="Customer / Tenant Logo"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-[#006a46] hover:underline"
                    >
                      Replace Logo
                    </button>
                    <span className="text-[#bdcac0]">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] font-semibold text-[#ba1a1a] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-[#545f73] pt-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#00855a] text-white flex items-center justify-center font-bold text-xl font-mono shadow-xs">
                    {formData.initials || 'TS'}
                  </div>
                  <p className="text-xs font-semibold text-[#0b1c30]">No Logo Uploaded</p>
                  <p className="text-[11px] text-[#545f73]">Default initials badge currently active</p>
                </div>
              )}
            </div>

            {/* Drag & Drop Upload Zone + Controls */}
            <div className="md:col-span-8 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
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
                <div className="w-10 h-10 rounded-full bg-white border border-[#bdcac0]/60 flex items-center justify-center text-[#006a46] shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">
                    Click to browse or drag & drop customer logo image
                  </p>
                  <p className="text-[11px] text-[#545f73] mt-0.5">
                    Recommended: Transparent PNG or SVG, minimum 300x120px, max 5MB
                  </p>
                </div>
              </div>

              {/* MANUAL LOGO SIZE CONTROLLER */}
              <div className="p-4 bg-[#eff4ff] border border-[#bdcac0]/60 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 text-[#006a46]" />
                    Manual Logo Size Adjustment
                  </label>
                  <span className="px-2.5 py-0.5 bg-white border border-[#bdcac0]/60 rounded-lg text-xs font-mono font-bold text-[#006a46]">
                    {formData.logoHeight || 52} px
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#545f73] font-semibold">32px</span>
                  <input
                    type="range"
                    min={32}
                    max={120}
                    step={2}
                    value={formData.logoHeight || 52}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      const updated = { ...formData, logoHeight: newSize };
                      setFormData(updated);
                      onUpdateTenant(updated);
                    }}
                    className="w-full accent-[#006a46] cursor-pointer h-2 bg-white rounded-lg border border-[#bdcac0]"
                  />
                  <span className="text-[10px] text-[#545f73] font-semibold">120px</span>
                </div>

                {/* Quick size presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {logoSizePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, logoHeight: preset.value };
                        setFormData(updated);
                        onUpdateTenant(updated);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        (formData.logoHeight || 52) === preset.value
                          ? 'bg-[#006a46] text-white shadow-xs'
                          : 'bg-white text-[#3e4942] border border-[#bdcac0]/60 hover:bg-[#eff4ff]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Preset Logos */}
              <div>
                <span className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider block mb-2">
                  Or pick a sample logo preset:
                </span>
                <div className="flex items-center gap-3">
                  {sampleLogos.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSampleLogo(s.url)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#bdcac0]/60 bg-white hover:border-[#006a46] hover:bg-[#eff4ff] transition-all text-xs text-[#0b1c30] shadow-2xs"
                    >
                      <img
                        src={s.url}
                        alt={s.name}
                        className="w-5 h-5 rounded-md object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. INVOICE DOCUMENT TITLE / TAX INVOICE HEADER SETTINGS */}
        <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#bdcac0]/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Invoice Header & Document Title</h3>
                <p className="text-xs text-[#545f73]">
                  Customize the title header printed at the top-right of your invoices (e.g. Tax Invoice, Commercial Invoice).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Document Header Title (Editable)
                </label>
                <input
                  type="text"
                  value={formData.invoiceTitle || 'Tax Invoice'}
                  onChange={(e) => {
                    const updated = { ...formData, invoiceTitle: e.target.value };
                    setFormData(updated);
                    onUpdateTenant(updated);
                  }}
                  placeholder="e.g. Tax Invoice, Commercial Invoice, Proforma Invoice"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-sm font-bold text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>

              {/* Title Presets */}
              <div>
                <span className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider block mb-1.5">
                  Quick Title Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {invoiceTitlePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, invoiceTitle: preset };
                        setFormData(updated);
                        onUpdateTenant(updated);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        (formData.invoiceTitle || 'Tax Invoice') === preset
                          ? 'bg-[#006a46] text-white shadow-xs'
                          : 'bg-[#eff4ff] text-[#006a46] border border-[#bdcac0]/60 hover:bg-[#00855a]/15'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Header Stamp Preview */}
            <div className="md:col-span-5 p-5 bg-[#f8f9ff] border border-[#bdcac0]/60 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-[#545f73] tracking-wider mb-2">
                Header Stamp Preview on Invoices
              </span>
              <div className="p-4 bg-white rounded-xl border border-[#bdcac0]/50 shadow-xs w-full">
                <span className="text-xl lg:text-2xl font-black tracking-wider text-[#006a46] uppercase block">
                  {formData.invoiceTitle || 'TAX INVOICE'}
                </span>
                <span className="text-xs font-mono font-bold text-[#545f73] mt-1 block">INV-2023-1042</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MALAYSIAN CORPORATE & TAX DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#bdcac0]/40 pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">Malaysian Corporate Registration</h3>
              <p className="text-xs text-[#545f73]">Official legal business credentials for LHDN e-Invoicing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Company / Tenant Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-medium text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Tenant Code (Unique Identifier)
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="w-full bg-[#eef1f8] border border-[#bdcac0] rounded-xl p-2.5 font-mono text-[#545f73] cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Malaysian SST Registration ID *
              </label>
              <input
                type="text"
                value={formData.sstId}
                onChange={(e) => setFormData({ ...formData, sstId: e.target.value })}
                placeholder="W10-1808-32000123"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Tax Identification Number (TIN) *
              </label>
              <input
                type="text"
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                placeholder="C1234567890"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Admin Contact Person
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-[#0b1c30] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Billing Support Email
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-[#0b1c30] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Registered Corporate Address
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 text-[#0b1c30] outline-none resize-none font-sans"
              ></textarea>
            </div>
          </div>
        </div>

        {/* 4. BANKING & REMITTANCE DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#bdcac0]/40 pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">Banking & Direct Settlement</h3>
              <p className="text-xs text-[#545f73]">Bank remittance instructions printed on customer invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Malaysian Bank Name
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-medium text-[#0b1c30] outline-none"
              >
                <option value="Maybank">Maybank (Malayan Banking Berhad)</option>
                <option value="CIMB Bank">CIMB Bank Berhad</option>
                <option value="Public Bank">Public Bank Berhad</option>
                <option value="RHB Bank">RHB Bank Berhad</option>
                <option value="Hong Leong Bank">Hong Leong Bank Berhad</option>
                <option value="AmBank">AmBank (M) Berhad</option>
                <option value="HSBC Bank Malaysia">HSBC Bank Malaysia</option>
                <option value="Standard Chartered Malaysia">Standard Chartered Malaysia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="5123-4567-8900"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-mono font-semibold text-[#0b1c30] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Bank Account Title
              </label>
              <input
                type="text"
                value={formData.bankTitle}
                onChange={(e) => setFormData({ ...formData, bankTitle: e.target.value })}
                placeholder="Account holder name"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-semibold text-[#0b1c30] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 5. TENANT SIGN-IN CREDENTIALS & SECURITY */}
        <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#bdcac0]/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Portal Sign-In & Security</h3>
                <p className="text-xs text-[#545f73]">Tenant admin credentials for accessing the billing and invoicing portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                let res = '';
                for (let i = 0; i < 10; i++) {
                  res += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setFormData((prev) => ({ ...prev, password: res }));
              }}
              className="text-xs font-semibold text-[#006a46] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate Random Password
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Portal Login Username / ID *
              </label>
              <input
                type="text"
                required
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. techadmin"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-mono font-bold text-[#006a46] outline-none focus:border-[#006a46]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Portal Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-mono font-bold text-[#0b1c30] outline-none pr-9 focus:border-[#006a46]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. BOTTOM ACTION BAR WITH SUCCESS TICK REACTION */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="save-all-changes-btn"
            className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2.5 cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-300/40 shadow-emerald-200'
                : 'bg-[#006a46] text-white hover:bg-[#00855a]'
            }`}
          >
            {isSaved ? (
              <>
                <div className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center animate-pulse">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Changes Saved! ✓</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

