import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  FileSpreadsheet,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Tenant } from '../types';

interface TenantSignInViewProps {
  tenants: Tenant[];
  onSignInSuccess: (tenant: Tenant) => void;
  onBackToPlatform?: () => void;
}

export const TenantSignInView: React.FC<TenantSignInViewProps> = ({
  tenants,
  onSignInSuccess,
  onBackToPlatform,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSigningIn(true);

    setTimeout(() => {
      const trimmedUser = usernameInput.trim().toLowerCase();
      const trimmedPass = passwordInput.trim();

      // Find tenant matching username, code, or email
      const matched = tenants.find((t) => {
        const uMatch =
          (t.username && t.username.toLowerCase() === trimmedUser) ||
          t.code.toLowerCase() === trimmedUser ||
          t.adminEmail.toLowerCase() === trimmedUser ||
          t.name.toLowerCase() === trimmedUser;

        const pMatch = !t.password || t.password === trimmedPass || trimmedPass === 'Password123!';
        return uMatch && pMatch;
      });

      if (matched) {
        if (!matched.accessEnabled) {
          setErrorMessage('This tenant workspace account has been suspended or deactivated. Please contact platform support.');
          setIsSigningIn(false);
          return;
        }
        setIsSigningIn(false);
        onSignInSuccess(matched);
      } else {
        setIsSigningIn(false);
        setErrorMessage('Invalid username or password. You can also pick one of the demo tenant logins below.');
      }
    }, 450);
  };

  const handleQuickLogin = (tenant: Tenant) => {
    setUsernameInput(tenant.username || tenant.code);
    setPasswordInput(tenant.password || 'Password123!');
    setErrorMessage('');
    onSignInSuccess(tenant);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Story & Demo Credentials */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {onBackToPlatform && (
              <button
                type="button"
                onClick={onBackToPlatform}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006a46] hover:underline mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Overview
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#006a46] text-white flex items-center justify-center font-black text-lg shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[#0b1c30] tracking-tight">
                  Tenant Billing Portal
                </h1>
                <p className="text-xs text-[#545f73]">Malaysian Multi-Tenant SST & e-Invoice Engine</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#006a46] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#00855a]" />
              <span>1-Click Demo Tenant Sign-In</span>
            </div>
            <p className="text-xs text-[#545f73]">
              Click any provisioned Malaysian corporate tenant below to authenticate instantly:
            </p>

            <div className="space-y-2 pt-1">
              {tenants.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleQuickLogin(t)}
                  className="w-full text-left p-2.5 rounded-xl border border-[#bdcac0]/60 hover:border-[#006a46] hover:bg-[#eff4ff] transition-all flex items-center justify-between group cursor-pointer bg-[#f8f9ff]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#00855a] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#0b1c30] truncate">{t.name}</p>
                      <p className="text-[11px] font-mono text-[#545f73]">
                        ID: <span className="text-[#006a46] font-semibold">{t.username || t.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#006a46] opacity-80 group-hover:opacity-100 shrink-0">
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#545f73]">
            <ShieldCheck className="w-4 h-4 text-[#00855a] shrink-0" />
            <span>256-Bit SSL Isolated Schema & LHDN e-Invoicing Compliance</span>
          </div>
        </div>

        {/* Right Side: Sign-In Box */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#bdcac0]/70 shadow-xl p-8 lg:p-10 space-y-6">
          <div>
            <span className="px-3 py-1 bg-emerald-100 text-[#006a46] rounded-full text-[11px] font-bold tracking-wider uppercase">
              Tenant Administrator Access
            </span>
            <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight mt-3">Sign in to your Tenant Portal</h2>
            <p className="text-xs text-[#545f73] mt-1">
              Enter your corporate username or tenant ID and credentials to manage invoices and SST records.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1.5">
                Username / Tenant ID / Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#545f73]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  id="tenant-login-username-input"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. techadmin, mayaretail, or TEN-0982"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-9 pr-3 py-3 text-sm font-medium text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942]">
                  Password *
                </label>
                <span className="text-[11px] text-[#545f73]">
                  Demo: <code className="text-[#006a46] font-mono font-bold">Password123!</code>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#545f73]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id="tenant-login-password-input"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your tenant password"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-9 pr-10 py-3 text-sm font-medium text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#545f73] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#006a46] rounded"
                />
                <span>Remember this session</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setUsernameInput('techadmin');
                  setPasswordInput('Password123!');
                }}
                className="text-[#006a46] font-semibold hover:underline"
              >
                Auto-Fill Sample Login
              </button>
            </div>

            <button
              type="submit"
              id="tenant-signin-submit-btn"
              disabled={isSigningIn}
              className="w-full bg-[#006a46] text-white py-3.5 px-4 rounded-xl font-bold text-sm hover:bg-[#00855a] transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating Tenant Workspace...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Tenant Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
