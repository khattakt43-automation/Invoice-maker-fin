import React, { useState } from 'react';
import { Tenant } from '../types';
import {
  X,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  UserCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantAdded: (tenant: Tenant) => void;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({
  isOpen,
  onClose,
  onTenantAdded,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Pass' + Math.floor(1000 + Math.random() * 9000) + '!');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+60 ');
  const [plan, setPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  const [address, setAddress] = useState('');
  const [sstId, setSstId] = useState('W10-');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Auto populate username suggestion if user types email or company name
  const handleEmailChange = (val: string) => {
    setAdminEmail(val);
    if (!username) {
      const suggested = val.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (suggested) setUsername(suggested);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminEmail.trim()) return;

    const finalUsername = username.trim() || adminEmail.split('@')[0] || 'tenantadmin';
    const finalPassword = password || 'Password123!';

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          adminName: adminName || 'Admin User',
          adminEmail,
          username: finalUsername,
          password: finalPassword,
          phone,
          plan,
          address: address || 'Kuala Lumpur, Malaysia',
          sstId: sstId.trim() || `W10-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000000 + Math.random() * 90000000)}`,
          logoHeight: 52,
          invoiceTitle: 'Tax Invoice',
        }),
      });
      const data = await res.json();
      onTenantAdded(data.data);
      setCreatedTenant(data.data);
    } catch (err) {
      const fallback: Tenant = {
        id: `tenant-${Date.now()}`,
        code: `TEN-${String(Math.floor(1000 + Math.random() * 9000))}`,
        name,
        initials: name.substring(0, 2).toUpperCase(),
        adminName: adminName || 'Admin User',
        adminEmail,
        username: finalUsername,
        password: finalPassword,
        phone,
        address: address || 'Kuala Lumpur, Malaysia',
        sstId: sstId || 'W10-1808-99999999',
        tin: `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: 'Active',
        joinedDate: 'Today',
        billingStatus: 'Paid',
        accessEnabled: true,
        plan,
        mrr: plan === 'Enterprise' ? 4999 : plan === 'Pro' ? 49 : 0,
        invoicesCount: 0,
        bankName: 'Maybank',
        bankAccount: '5123-9999-0000',
        logoHeight: 52,
        invoiceTitle: 'Tax Invoice',
      };
      onTenantAdded(fallback);
      setCreatedTenant(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdTenant) return;
    const text = `--- TENANT PORTAL CREDENTIALS ---
Organization: ${createdTenant.name}
Tenant Code: ${createdTenant.code}
Portal Sign-In: ${window.location.origin}
Username: ${createdTenant.username || username}
Password: ${createdTenant.password || password}
Admin Contact: ${createdTenant.adminEmail}
---------------------------------`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#213145] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8bf8c2]/20 text-[#8bf8c2] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Provision New Tenant</h3>
              <p className="text-xs text-[#bcc7de]">Multi-Tenant Database & Isolated Portal Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#bcc7de] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If tenant created, show success credential view */}
        {createdTenant ? (
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#006a46] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#006a46]">Tenant Provisioned Successfully!</h4>
                <p className="text-xs text-[#3e4942] mt-0.5">
                  The tenant database partition is active. Provide the following login credentials to the tenant administrator.
                </p>
              </div>
            </div>

            <div className="bg-[#f8f9ff] border border-[#bdcac0] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#bdcac0]/40">
                <span className="text-xs font-bold uppercase text-[#545f73] tracking-wider">Tenant Access Details</span>
                <span className="text-[11px] font-mono font-bold text-[#006a46] bg-emerald-100 px-2 py-0.5 rounded-md">
                  {createdTenant.code}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#545f73]">Company:</span>
                  <span className="font-bold text-[#0b1c30]">{createdTenant.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white p-2 rounded-lg border border-[#bdcac0]/40">
                  <span className="font-semibold text-[#545f73]">Username / Login ID:</span>
                  <span className="font-mono font-bold text-[#006a46]">{createdTenant.username || username}</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white p-2 rounded-lg border border-[#bdcac0]/40">
                  <span className="font-semibold text-[#545f73]">Password:</span>
                  <span className="font-mono font-bold text-[#0b1c30]">{createdTenant.password || password}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#545f73]">Admin Email:</span>
                  <span className="text-[#0b1c30]">{createdTenant.adminEmail}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#545f73]">Plan:</span>
                  <span className="font-semibold text-[#006a46]">{createdTenant.plan}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#006a46] text-[#006a46] bg-[#eff4ff] hover:bg-[#d5e0f8] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedCreds ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Credentials Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-[#006a46] text-white font-bold text-xs hover:bg-[#00855a] transition-all cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                Business / Corporate Entity Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Borneo Cloud Logistics Sdn Bhd"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                  Admin Contact Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Encik Faris"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                  Subscription Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as any)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                >
                  <option value="Pro">Pro (RM 49/mo)</option>
                  <option value="Basic">Basic (Free)</option>
                  <option value="Enterprise">Enterprise (RM 4,999/mo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#545f73]" /> Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="admin@borneocloud.my"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#545f73]" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+60 19-333 4444"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
            </div>

            {/* USERNAME AND PASSWORD SECTION */}
            <div className="p-3.5 bg-[#eff4ff] border border-[#bdcac0]/70 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#006a46] uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Tenant Sign-In Credentials
                </span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-[#006a46] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Gen Password
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. borneoadmin"
                    className="w-full bg-white border border-[#bdcac0] rounded-lg p-2 text-xs font-mono font-semibold text-[#0b1c30] outline-none focus:border-[#006a46]"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-white border border-[#bdcac0] rounded-lg p-2 text-xs font-mono font-semibold text-[#0b1c30] outline-none pr-7 focus:border-[#006a46]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2.5 text-[#545f73] hover:text-[#0b1c30]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                  SST Registration ID
                </label>
                <input
                  type="text"
                  value={sstId}
                  onChange={(e) => setSstId(e.target.value)}
                  placeholder="W10-1808-32000123"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1">
                  Data Isolation Mode
                </label>
                <div className="p-2.5 bg-[#eff4ff] border border-[#bdcac0]/60 rounded-lg text-xs text-[#006a46] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00855a]" /> Dedicated Schema Silo
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-[#3e4942] uppercase mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#545f73]" /> Office Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Level 10, Menara Shell, KL Sentral, 50470 Kuala Lumpur"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none resize-none"
              ></textarea>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-[#bdcac0]/40 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#545f73] hover:text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#006a46] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Provisioning...' : 'Provision Tenant & Generate Access'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

