import React, { useState } from 'react';
import { User, Mail, Phone, Camera, Save } from 'lucide-react';
import { Tenant } from '../types';

interface TenantProfileViewProps {
  tenant: Tenant;
  onUpdateTenant: (updated: Tenant) => void;
}

export const TenantProfileView: React.FC<TenantProfileViewProps> = ({
  tenant,
  onUpdateTenant,
}) => {
  const [adminName, setAdminName] = useState(tenant.adminName);
  const [adminEmail, setAdminEmail] = useState(tenant.adminEmail);
  const [phone, setPhone] = useState(tenant.phone);
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || '');
  const [saved, setSaved] = useState(false);

  const onPickPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateTenant({
      ...tenant,
      adminName,
      adminEmail,
      phone,
      logoUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-[#0b1c30]">Tenant Admin Profile</h2>

      <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-6">
        {/* Profile picture */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#00855a] text-white flex items-center justify-center font-bold text-2xl font-mono shrink-0 border border-[#bdcac0]/50">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              tenant.initials
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eff4ff] text-[#006a46] text-xs font-semibold cursor-pointer hover:bg-[#dce9ff] transition-colors">
              <Camera className="w-4 h-4" />
              <span>Change Profile Picture</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPickPicture} />
            </label>
            <p className="text-[11px] text-[#545f73] mt-1.5">PNG / JPG, used as your invoice logo.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">Admin Name</label>
            <div className="flex items-center gap-2 bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-2.5">
              <User className="w-4 h-4 text-[#006a46]" />
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-transparent text-xs text-[#0b1c30] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">Admin Email</label>
            <div className="flex items-center gap-2 bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-2.5">
              <Mail className="w-4 h-4 text-[#006a46]" />
              <input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-[#0b1c30] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">Phone</label>
            <div className="flex items-center gap-2 bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-2.5">
              <Phone className="w-4 h-4 text-[#006a46]" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-xs text-[#0b1c30] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">Plan</label>
            <div className="px-3 py-2.5 rounded-lg bg-[#f4f8ff] border border-[#bdcac0]/60 text-xs font-bold text-[#006a46] uppercase">
              {tenant.plan} Plan
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#006a46] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#00855a] transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
          {saved && <span className="text-xs font-semibold text-[#006a46]">✓ Profile updated</span>}
        </div>
      </div>
    </div>
  );
};
