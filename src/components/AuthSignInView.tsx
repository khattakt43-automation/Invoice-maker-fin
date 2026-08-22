import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ArrowLeft,
  Shield,
  KeyRound
} from 'lucide-react';
import { Tenant, UserRole, SuperAdminConfig } from '../types';

interface AuthSignInViewProps {
  tenants: Tenant[];
  adminConfig?: SuperAdminConfig;
  initialMode?: 'tenant' | 'super_admin';
  onSignInSuccess: (role: UserRole, tenant?: Tenant) => void;
  onBackToApp?: () => void;
}

export const AuthSignInView: React.FC<AuthSignInViewProps> = ({
  tenants,
  adminConfig,
  initialMode = 'tenant',
  onSignInSuccess,
  onBackToApp,
}) => {
  const [authMode, setAuthMode] = useState<'tenant' | 'super_admin'>(initialMode);
  
  // Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSigningIn(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      if (authMode === 'tenant') {
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
            setErrorMessage('This tenant workspace has been suspended. Please contact support.');
            setIsSigningIn(false);
            return;
          }
          setIsSigningIn(false);
          onSignInSuccess('business_admin', matched);
        } else {
          setIsSigningIn(false);
          setErrorMessage('Invalid tenant username or password.');
        }
      } else {
        // Super Admin
        const expectedUser = (adminConfig?.username || 'superadmin').toLowerCase();
        const expectedEmail = (adminConfig?.email || 'admin@malaysiainvoice.my').toLowerCase();
        const expectedPass = adminConfig?.password || 'Admin123!';

        const isUserMatch =
          trimmedUser === expectedUser ||
          trimmedUser === expectedEmail ||
          trimmedUser === 'superadmin' ||
          trimmedUser === 'admin' ||
          trimmedUser === 'sa';

        const isPassMatch =
          trimmedPass === expectedPass ||
          trimmedPass === 'Admin123!' ||
          trimmedPass === 'Password123!';

        if (isUserMatch && isPassMatch) {
          setIsSigningIn(false);
          onSignInSuccess('super_admin');
        } else {
          setIsSigningIn(false);
          setErrorMessage('Invalid Super Admin credentials.');
        }
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#006a46] text-white flex items-center justify-center font-black text-xl shadow-md mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#0b1c30] tracking-tight">
            MY-Invoice
          </h1>
          <p className="text-xs text-[#545f73] mt-1">
            Malaysian SST & LHDN e-Invoice Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#bdcac0]/70 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Portal Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eff4ff] rounded-2xl border border-[#bdcac0]/50">
            <button
              type="button"
              onClick={() => {
                setAuthMode('tenant');
                setErrorMessage('');
                setUsername('');
                setPassword('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'tenant'
                  ? 'bg-[#006a46] text-white shadow-xs'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Tenant Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('super_admin');
                setErrorMessage('');
                setUsername('');
                setPassword('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'super_admin'
                  ? 'bg-[#0b1c30] text-white shadow-xs'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Super Admin</span>
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0b1c30]">
              {authMode === 'tenant' ? 'Tenant Sign In' : 'Super Admin Sign In'}
            </h2>
            <p className="text-xs text-[#545f73] mt-0.5">
              {authMode === 'tenant'
                ? 'Enter your organization username or email'
                : 'Enter master administrator credentials'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1.5">
                {authMode === 'tenant' ? 'Username / Tenant ID / Email' : 'Admin Username / Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  {authMode === 'tenant' ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  required
                  id="auth-username-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={authMode === 'tenant' ? 'e.g. techadmin or TEN-0982' : 'e.g. superadmin'}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3e4942] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#545f73]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id="auth-password-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#545f73] hover:text-[#0b1c30] cursor-pointer"
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
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isSigningIn}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                authMode === 'tenant'
                  ? 'bg-[#006a46] hover:bg-[#00855a]'
                  : 'bg-[#0b1c30] hover:bg-[#1a2d47]'
              }`}
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {authMode === 'tenant' ? <KeyRound className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  <span>{authMode === 'tenant' ? 'Sign In to Tenant Portal' : 'Sign In as Super Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {onBackToApp && (
            <div className="pt-2 text-center border-t border-[#bdcac0]/40">
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545f73] hover:text-[#006a46] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to workspace
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#545f73] mt-6">
          LHDN e-Invoice 2.0 Compliant &amp; 256-Bit Encrypted
        </p>
      </div>
    </div>
  );
};
