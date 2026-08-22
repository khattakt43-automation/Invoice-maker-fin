import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  Building2,
  Clock,
  Fingerprint
} from 'lucide-react';
import { SuperAdminConfig } from '../types';

interface AdminProfileViewProps {
  adminConfig: SuperAdminConfig;
  onUpdateAdminConfig: (config: SuperAdminConfig) => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  adminConfig,
  onUpdateAdminConfig,
}) => {
  const [formData, setFormData] = useState<SuperAdminConfig>(adminConfig);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(adminConfig);
  }, [adminConfig]);

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let res = 'Admin!';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
    setConfirmPassword(res);
    setMessage({ type: 'success', text: 'Secure password generated. Click "Save Changes" to apply.' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // If attempting to change password
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'New password and confirmation password do not match.' });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
      }

      // If current password was required and incorrect
      if (adminConfig.password && currentPasswordInput && currentPasswordInput !== adminConfig.password) {
        setMessage({ type: 'error', text: 'Current password entered is incorrect.' });
        return;
      }
    }

    const updated: SuperAdminConfig = {
      ...formData,
      password: newPassword ? newPassword : formData.password || adminConfig.password || 'Admin123!',
    };

    onUpdateAdminConfig(updated);
    setFormData(updated);
    setIsSaved(true);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Super Administrator credentials updated successfully!' });

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset Super Admin credentials to factory default (superadmin / Admin123!)?')) {
      const defaultConf: SuperAdminConfig = {
        username: 'superadmin',
        email: 'admin@malaysiainvoice.my',
        displayName: 'Master Administrator',
        password: 'Admin123!',
        phone: '+60 3-8000 8000',
        securityRole: 'Root Authority',
      };
      onUpdateAdminConfig(defaultConf);
      setFormData(defaultConf);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordInput('');
      setMessage({ type: 'success', text: 'Credentials reset to default (Username: superadmin, Password: Admin123!).' });
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0b1c30] text-[#8bf8c2] flex items-center justify-center font-bold text-xl shadow-md border border-[#8bf8c2]/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0b1c30] tracking-tight">
              Super Admin Profile & Security
            </h1>
            <p className="text-xs text-[#545f73]">
              Manage master console access credentials, administrator contact details, and root security
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3.5 py-2 rounded-xl border border-[#bdcac0] bg-white text-xs font-semibold text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="font-semibold">{message.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Identity & Credentials */}
        <div className="bg-white rounded-3xl border border-[#bdcac0]/60 p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#bdcac0]/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0b1c30] text-white flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Administrator Identity</h3>
                <p className="text-xs text-[#545f73]">Public handle and login identifiers for master console</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-[#006a46] rounded-full text-[11px] font-mono font-bold uppercase">
              Root Level
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                Login Username / Handle *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  id="admin-profile-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. superadmin"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-3 py-2.5 font-mono font-bold text-[#0b1c30] focus:border-[#006a46] outline-none"
                />
              </div>
              <p className="text-[10px] text-[#545f73] mt-1">Used on the sign-in page to access the Super Admin portal.</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                Master Administrator Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  id="admin-profile-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@malaysiainvoice.my"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-3 py-2.5 font-semibold text-[#0b1c30] focus:border-[#006a46] outline-none"
                />
              </div>
              <p className="text-[10px] text-[#545f73] mt-1">Also functions as a valid login identifier.</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Master Administrator"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl p-2.5 font-semibold text-[#0b1c30] focus:border-[#006a46] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                Emergency Support Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+60 3-8000 8000"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-3 py-2.5 font-semibold text-[#0b1c30] focus:border-[#006a46] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Password & Authentication Credentials */}
        <div className="bg-white rounded-3xl border border-[#bdcac0]/60 p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#bdcac0]/40 pb-4 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#006a46] text-white flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">Change Super Admin Password</h3>
                <p className="text-xs text-[#545f73]">Update root credential used for master authentication</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateRandomPassword}
              className="text-xs font-bold text-[#006a46] hover:underline flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00855a]" />
              <span>Generate Random Password</span>
            </button>
          </div>

          <div className="bg-[#eff4ff] p-4 rounded-2xl border border-[#bdcac0]/50 text-xs text-[#545f73] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#006a46]" />
              <span>Current Master Password:</span>
              <span className="font-mono font-bold text-[#0b1c30] px-2 py-0.5 bg-white rounded-md border border-[#bdcac0]/60">
                {adminConfig.password || 'Admin123!'}
              </span>
            </div>
            <span className="text-[11px] text-[#006a46] font-semibold">Active in Auth Portal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                New Super Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  id="admin-profile-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-10 py-2.5 font-mono font-bold text-[#0b1c30] focus:border-[#006a46] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  id="admin-profile-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-10 py-2.5 font-mono font-bold text-[#0b1c30] focus:border-[#006a46] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            id="save-admin-profile-btn"
            className="px-6 py-3 bg-[#0b1c30] hover:bg-[#1a2d47] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Credentials Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Admin Credentials</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
