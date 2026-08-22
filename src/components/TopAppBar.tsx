import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Grid,
  HelpCircle,
  Shield,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Tenant, UserRole } from '../types';

interface TopAppBarProps {
  currentRole: UserRole;
  activeTenant: Tenant;
  onSwitchRole: () => void;
  onImpersonateClick: () => void;
  onOpenSupport: () => void;
  onCreateInvoice?: () => void;
  onLogout?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentRole,
  activeTenant,
  onSwitchRole,
  onImpersonateClick,
  onOpenSupport,
  onCreateInvoice,
  onLogout,
  onNavigateToTab,
}) => {
  const isSuperAdmin = currentRole === 'super_admin';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (appsRef.current && !appsRef.current.contains(target)) {
        setShowApps(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowApps(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Payment Received (RM 12,500.00)',
      desc: 'Acme Corp Malaysia settled INV-2023-089 via Maybank FPX.',
      time: '10m ago',
      icon: CheckCircle,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 2,
      title: 'Overdue Reminder: INV-2023-085',
      desc: 'Nexus Tech Partners invoice is 10 days past due (RM 2,000.00).',
      time: '2h ago',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 bg-amber-50',
    },
    {
      id: 3,
      title: 'LHDN SST e-Invoice Sync',
      desc: 'Monthly tax reporting schedule validated for Q4 2023.',
      time: '1d ago',
      icon: Clock,
      iconColor: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <header
      id="top-app-bar"
      className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-md border-b border-[#bdcac0]/40 shadow-xs"
    >
      {/* Left section: navigation links or search */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => {}}
            className="text-xs font-semibold tracking-wider text-[#006a46] uppercase border-b-2 border-[#006a46] pb-1"
          >
            Platform
          </button>
          <a
            href="#resources"
            onClick={(e) => {
              e.preventDefault();
              onOpenSupport();
            }}
            className="text-xs font-semibold tracking-wider text-[#545f73] hover:text-[#006a46] uppercase transition-colors"
          >
            Resources
          </a>
        </nav>

        {/* Impersonate Search or Filter for Admin */}
        {isSuperAdmin ? (
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
            <input
              type="text"
              onClick={onImpersonateClick}
              placeholder="Impersonate Tenant..."
              className="pl-10 pr-16 py-1.5 rounded-full border border-[#bdcac0] bg-white text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] w-64 cursor-pointer hover:border-[#006a46] transition-all"
              readOnly
            />
            <button
              onClick={onImpersonateClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#d5e0f8] text-[#3f465c] rounded text-[10px] font-mono font-semibold"
            >
              CMD+K
            </button>
          </div>
        ) : (
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#545f73]" />
            <input
              type="text"
              placeholder="Search invoices, clients, TIN..."
              className="pl-9 pr-4 py-1.5 rounded-full border border-[#bdcac0] bg-white text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] w-60 transition-all focus:w-72"
            />
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Role Toggle Switcher */}
        <button
          onClick={onSwitchRole}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isSuperAdmin
              ? 'bg-[#213145] text-[#8bf8c2] border-[#6edba7]/30 hover:bg-[#111c2d]'
              : 'bg-white text-[#006a46] border-[#00855a]/30 hover:bg-[#eff4ff]'
          }`}
        >
          {isSuperAdmin ? (
            <>
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </>
          ) : (
            <>
              <Building className="w-3.5 h-3.5" />
              <span>{activeTenant.name.split(' ')[0]}</span>
            </>
          )}
        </button>

        {onCreateInvoice && !isSuperAdmin && (
          <button
            onClick={onCreateInvoice}
            className="hidden sm:flex items-center gap-1.5 bg-[#006a46] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#00855a] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        )}

        <button
          onClick={onOpenSupport}
          className="hidden sm:block text-xs font-semibold text-[#006a46] border border-[#00855a]/30 px-3 py-1.5 rounded-lg hover:bg-[#00855a]/5 transition-colors cursor-pointer"
        >
          Support
        </button>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            id="notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowApps(false);
              setShowProfileMenu(false);
            }}
            className="p-2 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-full transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#bdcac0]/50 p-3 z-50 animate-fade-in">
              <div className="flex justify-between items-center px-2 py-1.5 border-b border-[#bdcac0]/30 mb-2">
                <span className="text-xs font-bold text-[#0b1c30]">Notifications</span>
                <span
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-[#006a46] font-semibold cursor-pointer hover:underline"
                >
                  Mark all read
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setShowNotifications(false)}
                      className="p-2 rounded-xl hover:bg-[#eff4ff] transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${n.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#0b1c30] truncate">{n.title}</p>
                        <p className="text-[11px] text-[#545f73] line-clamp-2 leading-relaxed">{n.desc}</p>
                        <span className="text-[9px] text-[#545f73] font-mono mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Apps Launcher */}
        <div ref={appsRef} className="relative">
          <button
            id="apps-launcher-btn"
            onClick={() => {
              setShowApps(!showApps);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer"
          >
            <Grid className="w-4 h-4" />
          </button>

          {showApps && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#bdcac0]/50 p-4 z-50 animate-fade-in">
              <div className="text-xs font-bold text-[#0b1c30] mb-3 px-1">Connected Malaysian Services</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  onClick={() => setShowApps(false)}
                  className="p-2 rounded-xl hover:bg-[#eff4ff] cursor-pointer transition-colors flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    LHDN
                  </div>
                  <span className="text-[10px] font-medium text-[#0b1c30]">e-Invoicing</span>
                </div>
                <div
                  onClick={() => setShowApps(false)}
                  className="p-2 rounded-xl hover:bg-[#eff4ff] cursor-pointer transition-colors flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-xs">
                    MBB
                  </div>
                  <span className="text-[10px] font-medium text-[#0b1c30]">Maybank Pay</span>
                </div>
                <div
                  onClick={() => setShowApps(false)}
                  className="p-2 rounded-xl hover:bg-[#eff4ff] cursor-pointer transition-colors flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                    CIMB
                  </div>
                  <span className="text-[10px] font-medium text-[#0b1c30]">BizChannel</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Logout Button */}
        {onLogout && (
          <button
            type="button"
            id="top-bar-logout-btn"
            onClick={onLogout}
            title={isSuperAdmin ? "Log Out of Super Admin Console" : `Log Out of ${activeTenant.name}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        {/* Profile Avatar & Menu */}
        <div ref={profileRef} className="relative pl-1">
          <button
            type="button"
            id="top-bar-profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowApps(false);
            }}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#006a46]/30 transition-all cursor-pointer"
          >
            {isSuperAdmin ? (
              <div className="w-8 h-8 rounded-full bg-[#00855a] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                SA
              </div>
            ) : (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3OnGtAezqLmrPVKuEoBBAAL2LCAug_CibJKIuW7GUlwAC7QVTZkWa9gLv--NLq7Ji7W9iYXpcNXkQ0Vsz4lEeFJRD5xENSzIVq_BpbKI0KwDMPMZrTyLJPW65IVLchgtKVcSXeG4c03Tmd2qd0mkTcIwUuG8C6Vu12sripqqwYEZZlq-qF_lFUPQxIwiTrOKH_4CPX0hAJ5k53eJ_Pm_O2ScePIymDSRmDApkZgIbIrsBzM0PPM65"
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover border border-[#bdcac0] shadow-xs"
              />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#bdcac0]/60 p-3 z-50 animate-fade-in space-y-2">
              <div className="p-2 border-b border-[#bdcac0]/40">
                <p className="font-bold text-xs text-[#0b1c30]">
                  {isSuperAdmin ? 'Super Administrator' : activeTenant.adminName || 'Tenant Administrator'}
                </p>
                <p className="text-[11px] text-[#545f73] truncate">
                  {isSuperAdmin ? 'superadmin@malaysiainvoice.my' : activeTenant.adminEmail}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#eff4ff] text-[#006a46]">
                  {isSuperAdmin ? 'MASTER ADMIN' : `TENANT: ${activeTenant.code}`}
                </span>
              </div>

              <div className="space-y-1">
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateToTab(isSuperAdmin ? 'admin-profile' : 'profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{isSuperAdmin ? 'Admin Credentials & Security' : 'My Profile & Settings'}</span>
                    <Shield className="w-3.5 h-3.5 text-[#545f73]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSwitchRole();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{isSuperAdmin ? 'Switch to Tenant Portal' : 'Switch to Super Admin'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#545f73]" />
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
