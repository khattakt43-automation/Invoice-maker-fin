import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Plus,
  User,
  HelpCircle,
  Building2,
  Shield,
  Layers,
  FileCheck,
  CreditCard,
  Sliders,
  LogOut,
  Repeat,
  History as HistoryIcon,
  MessageSquare,
} from 'lucide-react';
import { Tenant, UserRole } from '../types';

interface SideNavBarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTenant: Tenant;
  onCreateInvoiceClick: () => void;
  onSwitchRole: () => void;
  onOpenSupportModal?: () => void;
  onLogout?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  activeTenant,
  onCreateInvoiceClick,
  onSwitchRole,
  onOpenSupportModal,
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <>
    {/* Mobile close overlay (sibling of sidebar so it never blocks nav clicks) */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <aside
      id="main-sidebar"
      className={`w-64 h-screen fixed left-0 top-0 z-50 flex flex-col border-r transition-transform duration-300 ease-in-out ${
        isSuperAdmin
          ? 'bg-[#213145] text-[#eaf1ff] border-[#bdcac0]/20'
          : 'bg-[#f8f9ff] text-[#0b1c30] border-[#bdcac0]/60'
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Brand Header */}
      <div className={`p-4 flex items-center gap-3 border-b ${isSuperAdmin ? 'border-[#bdcac0]/20' : 'border-[#bdcac0]/40'}`}>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
            isSuperAdmin
              ? 'bg-[#8bf8c2]/20 text-[#8bf8c2]'
              : 'bg-[#00855a] text-white'
          }`}
        >
          {isSuperAdmin ? <Shield className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h1
              className={`font-bold text-lg leading-tight truncate ${
                isSuperAdmin ? 'text-[#8bf8c2]' : 'text-[#006a46]'
              }`}
            >
              {isSuperAdmin ? 'BillLah! Admin' : 'BillLah!'}
            </h1>
          </div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#545f73] dark:text-[#bcc7de] truncate">
            {isSuperAdmin ? 'Super Admin Console' : 'Business Portal'}
          </p>
        </div>
      </div>

      {/* Tenant or Role indicator pill */}
      <div className="px-3 pt-3 pb-1">
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
            isSuperAdmin
              ? 'bg-[#111c2d]/60 border-[#bdcac0]/20 text-[#eaf1ff]'
              : 'bg-white border-[#bdcac0]/50 text-[#0b1c30] shadow-2xl shadow-emerald-950/5'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                isSuperAdmin
                  ? 'bg-[#6edba7] text-[#002113]'
                  : 'bg-[#00855a]/10 text-[#006a46]'
              }`}
            >
              {isSuperAdmin ? 'SA' : activeTenant.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">
                {isSuperAdmin ? 'Admin Central' : activeTenant.name}
              </p>
              <p className="text-[10px] text-[#545f73] dark:text-[#bcc7de] font-mono truncate">
                {isSuperAdmin ? 'Global Controller' : activeTenant.code}
              </p>
            </div>
          </div>
          <button
            onClick={onSwitchRole}
            title={isSuperAdmin ? 'Switch to Business Portal' : 'Switch to Super Admin'}
            className={`p-1 rounded-md transition-colors ${
              isSuperAdmin
                ? 'hover:bg-white/10 text-[#8bf8c2]'
                : 'hover:bg-[#eff4ff] text-[#006a46]'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {!isSuperAdmin ? (
          // Business Portal Nav
          <>
            <button
              id="nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-invoices"
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'invoices' || activeTab === 'create-invoice'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Invoices</span>
            </button>

            <button
              id="nav-customers"
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'customers'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Customers</span>
            </button>

            <button
              id="nav-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'products'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Products</span>
            </button>

            <button
              id="nav-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'reports'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Reports</span>
            </button>

            <button
              id="nav-retainers"
              onClick={() => setActiveTab('retainers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'retainers'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Retainer Plans</span>
            </button>

            <button
              id="nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'settings'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
            <button
              id="nav-user-logs"
              onClick={() => setActiveTab('user-logs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'user-logs'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <HistoryIcon className="w-4 h-4 shrink-0" />
              <span>User Logs</span>
            </button>

            <button
              id="nav-whatsapp"
              onClick={() => setActiveTab('whatsapp')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'whatsapp'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>

            <button
              id="nav-plan"
              onClick={() => setActiveTab('plan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'plan'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>My Plan</span>
            </button>

            <button
              id="nav-tenant-signin"
              onClick={() => setActiveTab('tenant-signin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'tenant-signin'
                  ? 'bg-[#00855a]/10 text-[#006a46] font-bold border-r-4 border-[#006a46]'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0 rotate-180" />
              <span>Tenant Sign-In</span>
            </button>
          </>
        ) : (
          // Super Admin Nav
          <>
            <button
              id="nav-admin-overview"
              onClick={() => setActiveTab('admin-overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-overview'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            <button
              id="nav-admin-tenants"
              onClick={() => setActiveTab('admin-tenants')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-tenants'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Tenants</span>
            </button>

            <button
              id="nav-admin-subscriptions"
              onClick={() => setActiveTab('admin-subscriptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-subscriptions'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Subscriptions</span>
            </button>

            <button
              id="nav-admin-audit-logs"
              onClick={() => setActiveTab('admin-audit-logs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-audit-logs'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>Audit Logs</span>
            </button>

            <button
              id="nav-admin-settings"
              onClick={() => setActiveTab('admin-settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-settings'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>System Settings</span>
            </button>
            <button
              id="nav-admin-templates"
              onClick={() => setActiveTab('admin-templates')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-templates'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Templates (Draft)</span>
            </button>

            <button
              id="nav-admin-whatsapp"
              onClick={() => setActiveTab('admin-whatsapp')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === 'admin-whatsapp'
                  ? 'bg-[#00855a]/30 text-[#8bf8c2] font-bold border-r-4 border-[#6edba7]'
                  : 'text-[#bcc7de] hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer & Actions */}
      <div className={`p-3 border-t space-y-1.5 ${isSuperAdmin ? 'border-[#bdcac0]/20' : 'border-[#bdcac0]/40'}`}>
        {!isSuperAdmin ? (
          <>
            <button
              id="sidebar-create-invoice-btn"
              onClick={onCreateInvoiceClick}
              className="w-full bg-[#006a46] text-white py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-[#00855a] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 mb-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#eff4ff] text-[#006a46] font-bold'
                  : 'text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
              onClick={onOpenSupportModal}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#545f73] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </button>

            {onLogout && (
              <button
                id="sidebar-tenant-logout-btn"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('admin-profile')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#bcc7de] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Admin Profile</span>
            </button>

            <button
              onClick={onSwitchRole}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#bcc7de] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
              <span>Switch to Tenant</span>
            </button>

            {onLogout && (
              <button
                id="sidebar-admin-logout-btn"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </>
        )}
      </div>
    </aside>
    </>
  );
};
