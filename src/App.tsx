import React, { useState, useEffect } from 'react';
import {
  Customer,
  Invoice,
  PlatformKPIs,
  Product,
  Tenant,
  UserRole,
  SuperAdminConfig
} from './types';
import {
  initialCustomers,
  initialInvoices,
  initialPlatformKPIs,
  initialProducts,
  initialTenants
} from './data/mockData';
import { generateUniqueInvoiceNumber } from './utils/invoiceUtils';
import { SideNavBar } from './components/SideNavBar';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { InvoiceBuilderView } from './components/InvoiceBuilderView';
import { InvoicesListView } from './components/InvoicesListView';
import { CustomersView } from './components/CustomersView';
import { RetainerPlansView } from './components/RetainerPlansView';
import { SuperAdminOverviewView } from './components/SuperAdminOverviewView';
import { TenantsManagementView } from './components/TenantsManagementView';
import { TenantSettingsView } from './components/TenantSettingsView';
import { TenantProfileView } from './components/TenantProfileView';
import { ProductsView } from './components/ProductsView';
import { ReportsView } from './components/ReportsView';
import { TenantSignInView } from './components/TenantSignInView';
import { AuthSignInView } from './components/AuthSignInView';
import { AdminProfileView } from './components/AdminProfileView';
import { ImpersonateModal } from './components/ImpersonateModal';
import { SupportModal } from './components/SupportModal';
import { ChangesView } from './components/ChangesView';
import { TemplatesAdminView } from './components/TemplatesAdminView';
import { UserLogsView } from './components/UserLogsView';
import { WhatsAppAdminView } from './components/WhatsAppAdminView';
import { WhatsAppTenantView } from './components/WhatsAppTenantView';
import { TenantPlanView } from './components/TenantPlanView';
import { playSound } from './utils/sound';

export function App() {
  // App state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('billah_session_v1') || 'null');
      if (s?.role === 'super_admin' || s?.role === 'business_admin') return s.role;
    } catch { /* ignore */ }
    return 'business_admin';
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('billah_session_v1') || 'null');
      if (s?.tab) return s.tab;
    } catch { /* ignore */ }
    return 'dashboard';
  });
  // Back-context: remembers where an invoice edit was launched from
  const [returnTab, setReturnTab] = useState<string>('invoices');
  const [returnCustomerId, setReturnCustomerId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [activeTenant, setActiveTenant] = useState<Tenant>(initialTenants[0]);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [kpis, setKpis] = useState<PlatformKPIs>(initialPlatformKPIs);

  // Super Admin Configuration with persistent LocalStorage
  const [superAdminConfig, setSuperAdminConfig] = useState<SuperAdminConfig>(() => {
    const saved = localStorage.getItem('my_invoice_superadmin_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      username: 'superadmin',
      email: 'admin@malaysiainvoice.my',
      displayName: 'Master Administrator',
      password: 'Admin123!',
      phone: '+60 3-8000 8000',
      securityRole: 'Root Authority',
    };
  });

  const handleUpdateAdminConfig = (newConfig: SuperAdminConfig) => {
    setSuperAdminConfig(newConfig);
    localStorage.setItem('my_invoice_superadmin_config', JSON.stringify(newConfig));
  };

  // Selected invoice for builder
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modals
  const [isImpersonateOpen, setIsImpersonateOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('billah_sounds_enabled');
    return saved ? saved === 'true' : true;
  });
  const [toast, setToast] = useState<string | null>(null);

  // --- Session + active-tab persistence (tenant login lands on Create Invoice;
  //     refresh keeps the user on the same page) ---
  const SESSION_KEY = 'billah_session_v1';
  // Persist on any change so a refresh restores the exact page the user was on.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ role: currentRole, tenantId: activeTenant?.id, tab: activeTab })
      );
    } catch { /* ignore */ }
  }, [activeTab, currentRole, activeTenant]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const toggleSounds = (val: boolean) => {
    setSoundsEnabled(val);
    localStorage.setItem('billah_sounds_enabled', String(val));
  };

  // Notification bell click -> navigate to the relevant page/location (Point 6)
  const handleNotificationNavigate = (link?: { tab: string; customerId?: string; invoiceId?: string }) => {
    if (!link) return;
    if (link.customerId) setReturnCustomerId(link.customerId);
    if (link.invoiceId) {
      const inv = invoices.find((i) => i.id === link.invoiceId || i.invoiceNumber === link.invoiceId);
      if (inv) {
        setSelectedInvoice(inv);
        setActiveTab('create-invoice');
        return;
      }
    }
    setActiveTab(link.tab);
    setSidebarOpen(false);
  };

  // Fetch initial data from backend API if available
  useEffect(() => {
    async function loadData() {
      try {
        const [tenantsRes, custRes, invRes, prodRes, kpiRes] = await Promise.all([
          fetch('/api/tenants'),
          fetch('/api/customers'),
          fetch('/api/invoices'),
          fetch('/api/products'),
          fetch('/api/kpis'),
        ]);

        if (tenantsRes.ok) {
          const tData = await tenantsRes.json();
          if (tData.data?.length) {
            setTenants(tData.data);
            // Restore the previous session (role + active tenant + active tab) so a
            // refresh keeps the user on the exact page they were viewing. Falls back
            // to the first tenant if no saved session exists.
            let restoredTenant = tData.data[0];
            try {
              const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
              if (saved?.tenantId) {
                const match = tData.data.find((t: any) => t.id === saved.tenantId);
                if (match) restoredTenant = match;
              }
              if (saved?.role) setCurrentRole(saved.role);
              if (saved?.tab) setActiveTab(saved.tab);
            } catch { /* ignore */ }
            setActiveTenant(restoredTenant);
          }
        }
        if (custRes.ok) {
          const cData = await custRes.json();
          if (cData.data?.length) setCustomers(cData.data);
        }
        if (invRes.ok) {
          const iData = await invRes.json();
          if (iData.data?.length) setInvoices(iData.data);
        }
        if (prodRes.ok) {
          const pData = await prodRes.json();
          if (pData.data?.length) setProducts(pData.data);
        }
        if (kpiRes.ok) {
          const kData = await kpiRes.json();
          if (kData.data?.platform) setKpis(kData.data.platform);
        }
      } catch (e) {
        console.log('Running in local client state');
      }
    }
    loadData();
  }, []);

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsImpersonateOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Switch Role between Business Portal and Super Admin
  const handleSwitchRole = () => {
    if (currentRole === 'business_admin') {
      setCurrentRole('super_admin');
      setActiveTab('admin-overview');
    } else {
      setCurrentRole('business_admin');
      setActiveTab('dashboard');
    }
  };

  // Impersonate a specific tenant
  const handleImpersonateTenant = (tenant: Tenant) => {
    setActiveTenant(tenant);
    setCurrentRole('business_admin');
    setActiveTab('dashboard');
    setIsImpersonateOpen(false);
  };

  // Sign out handler
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Sign in handler
  const handleSignIn = (role: UserRole, tenant?: Tenant) => {
    setIsAuthenticated(true);
    setCurrentRole(role);
    if (role === 'business_admin' && tenant) {
      setActiveTenant(tenant);
      // Tenant users land directly on Create Invoice (their primary action).
      setActiveTab('create-invoice');
    } else if (role === 'super_admin') {
      setActiveTab('admin-overview');
    } else {
      // Non-impersonated tenant keeps dashboard fallback for safety.
      setActiveTab('create-invoice');
    }
  };

  // Toggle tenant access switch
  const handleToggleTenantAccess = async (tenantId: string, enabled: boolean) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, accessEnabled: enabled } : t))
    );
    try {
      await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessEnabled: enabled }),
      });
    } catch (e) {
      console.log('Error syncing tenant access');
    }
  };

  // Update tenant settings and branding/logo
  const handleUpdateTenant = (updated: Tenant) => {
    setActiveTenant(updated);
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    // Persist to the server so defaults survive restart (PATCH /api/tenants/:id)
    fetch(`/api/tenants/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  };

  // Create invoice click
  const handleCreateInvoiceClick = (returnTo: string = 'invoices', customerId: string | null = null) => {
    setSelectedInvoice(null);
    setReturnTab(returnTo);
    setReturnCustomerId(customerId);
    setActiveTab('create-invoice');
  };

  // Select existing invoice to view/edit
  const handleSelectInvoice = (inv: Invoice, returnTo: string = 'invoices', customerId: string | null = null) => {
    setSelectedInvoice(inv);
    setReturnTab(returnTo);
    setReturnCustomerId(customerId);
    setActiveTab('create-invoice');
  };

  // Create invoice for a specific customer
  const handleNewInvoiceForCustomer = (cust: Customer) => {
    const freshInv: Invoice = {
      id: 'NEW',
      invoiceNumber: generateUniqueInvoiceNumber(invoices),
      tenantId: activeTenant.id,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      customerTin: cust.tin,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'Consulting & Implementation Services',
          quantity: 1,
          size: '1',
          sizeUnit: 'unit',
          unitPrice: 5000.0,
          taxRate: 0.08,
          amount: 5000.0,
        },
      ],
      subtotal: 5000.0,
      taxRate: 0.08,
      taxAmount: 400.0,
      totalAmount: 5400.0,
      currency: 'MYR',
      status: 'Unpaid',
      notes: `Payment is due within 30 days. Please transfer to ${activeTenant.bankName} Acc: ${activeTenant.bankAccount}.`,
      paperSize: 'A4 (Standard)',
      paymentTerms: 'Payment due in 30 days.',
    };
    setSelectedInvoice(freshInv);
    setReturnTab('customers');
    setReturnCustomerId(cust.id);
    setActiveTab('create-invoice');
  };

  // Invoice saved handler
  const handleInvoiceSaved = (savedInv: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === savedInv.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedInv;
        return copy;
      }
      return [savedInv, ...prev];
    });

    // Update customer stats
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === savedInv.customerId || c.name === savedInv.customerName) {
          return {
            ...c,
            outstandingBalance:
              savedInv.status !== 'Paid'
                ? c.outstandingBalance + savedInv.totalAmount
                : c.outstandingBalance,
            ltv: c.ltv + savedInv.totalAmount,
          };
        }
        return c;
      })
    );

    // Refresh customers so a newly auto-created customer (billed for the first
    // time on an invoice) shows up in the Customers list immediately.
    fetch('/api/customers')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data?.length) setCustomers(d.data); })
      .catch(() => {});

    // Sound + activity log (Points 7 & 9)
    playSound('invoice_generated', soundsEnabled);
    fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenant.id,
        actor: activeTenant.name,
        action: savedInv.id && !String(savedInv.id).startsWith('inv-') ? 'invoice.updated' : 'invoice.created',
        detail: `Invoice ${savedInv.invoiceNumber}`,
        severity: 'success',
      }),
    }).catch(() => {});
  };

  const handleInvoiceDeleted = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    playSound('invoice_deleted', soundsEnabled);
  };

  // Bulk delete invoices (and sync customer recentInvoices)
  const handleInvoicesBulkDeleted = (ids: string[]) => {
    const idSet = new Set(ids);
    setInvoices((prev) => prev.filter((i) => !idSet.has(i.id)));
    setCustomers((prev) =>
      prev.map((c) =>
        c.recentInvoices
          ? { ...c, recentInvoices: c.recentInvoices.filter((r) => !idSet.has(r.id)) }
          : c
      )
    );
  };

  const handleCustomersBulkDeleted = (ids: string[]) => {
    const idSet = new Set(ids);
    setCustomers((prev) => prev.filter((c) => !idSet.has(c.id)));
    setInvoices((prev) => prev.filter((i) => !idSet.has(i.customerId)));
  };

  // Invoice status change from table
  const handleInvoiceStatusChange = async (id: string, newStatus: Invoice['status']) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
    try {
      await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.log('Updated locally');
    }
  };

  // Add customer
  const handleCustomerAdded = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleCustomerDeleted = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // Add tenant
  const handleTenantAdded = (newTenant: Tenant) => {
    setTenants((prev) => [newTenant, ...prev]);
    setKpis((prev) => ({
      ...prev,
      totalTenants: prev.totalTenants + 1,
      activeTenants: prev.activeTenants + 1,
    }));
  };

  // Add product
  const handleProductAdded = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  // Update product
  const handleProductUpdated = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
  };

  // Delete product
  const handleProductDeleted = (prodId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
  };

  // If user is logged out, render the AuthSignInView
  if (!isAuthenticated) {
    return (
      <AuthSignInView
        tenants={tenants}
        adminConfig={superAdminConfig}
        initialMode={currentRole === 'super_admin' ? 'super_admin' : 'tenant'}
        onSignInSuccess={handleSignIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex">
      {/* Side Navigation */}
      <SideNavBar
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        activeTenant={activeTenant}
        onCreateInvoiceClick={handleCreateInvoiceClick}
        onSwitchRole={handleSwitchRole}
        onOpenSupportModal={() => setIsSupportOpen(true)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col min-h-screen">
        {/* Top App Bar */}
        <TopAppBar
          currentRole={currentRole}
          activeTenant={activeTenant}
          onSwitchRole={handleSwitchRole}
          onImpersonateClick={() => setIsImpersonateOpen(true)}
          onOpenSupport={() => setIsSupportOpen(true)}
          onCreateInvoice={handleCreateInvoiceClick}
          onLogout={handleLogout}
          onNavigateToTab={handleNavigate}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          onNotificationNavigate={handleNotificationNavigate}
          soundsEnabled={soundsEnabled}
        />

        {/* Dynamic Route/Tab Views */}
        <main className="flex-1 pb-16">
          {/* User-scoped & admin WhatsApp views placed before the role-gated
              fragments so they always render regardless of role gating */}
          {activeTab === 'user-logs' && (
            <UserLogsView tenantId={activeTenant.id} actor={activeTenant.name} />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppTenantView tenantId={activeTenant.id} tenantName={activeTenant.name} />
          )}

          {activeTab === 'plan' && (
            <TenantPlanView tenant={activeTenant} onToast={(m) => setToast(m)} />
          )}

          {activeTab === 'admin-whatsapp' && (
            <WhatsAppAdminView
              tenants={tenants}
              currentTenantId={activeTenant.id}
              onToast={(m) => setToast(m)}
            />
          )}

          {/* Business Portal Views */}
          {currentRole === 'business_admin' && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  tenant={activeTenant}
                  invoices={invoices}
                  onCreateInvoice={handleCreateInvoiceClick}
                  onViewAllInvoices={() => setActiveTab('invoices')}
                  onSelectInvoice={handleSelectInvoice}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesListView
                  invoices={invoices}
                  onCreateInvoice={handleCreateInvoiceClick}
                  onSelectInvoice={handleSelectInvoice}
                  onStatusChange={handleInvoiceStatusChange}
                  onInvoiceDeleted={handleInvoiceDeleted}
                  onInvoicesBulkDeleted={handleInvoicesBulkDeleted}
                />
              )}

              {activeTab === 'create-invoice' && (
                <InvoiceBuilderView
                  tenant={activeTenant}
                  customers={customers}
                  products={products}
                  existingInvoices={invoices}
                  initialInvoice={selectedInvoice}
                  onBack={() => setActiveTab(returnTab)}
                  returnCustomerId={returnCustomerId}
                  onInvoiceSaved={handleInvoiceSaved}
                  onSetDefaultTitle={(title, size) => {
                    handleUpdateTenant({ ...activeTenant, defaultDocTitle: title, defaultDocTitleSize: size });
                  }}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  invoices={invoices}
                  openCustomerId={returnCustomerId}
                  onNewInvoiceForCustomer={handleNewInvoiceForCustomer}
                  onCustomerAdded={handleCustomerAdded}
                  onCustomerDeleted={handleCustomerDeleted}
                  onCustomersBulkDeleted={handleCustomersBulkDeleted}
                  onSelectInvoice={handleSelectInvoice}
                />
              )}

              {activeTab === 'products' && (
                <ProductsView
                  tenant={activeTenant}
                  products={products}
                  onProductAdded={handleProductAdded}
                  onProductUpdated={handleProductUpdated}
                  onProductDeleted={handleProductDeleted}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView tenant={activeTenant} invoices={invoices} />
              )}

              {activeTab === 'retainers' && <RetainerPlansView />}

              {activeTab === 'settings' && (
                <TenantSettingsView
                  tenant={activeTenant}
                  onUpdateTenant={handleUpdateTenant}
                  soundsEnabled={soundsEnabled}
                  onToggleSounds={toggleSounds}
                />
              )}

              {activeTab === 'profile' && (
                <TenantProfileView
                  tenant={activeTenant}
                  onUpdateTenant={handleUpdateTenant}
                />
              )}

              {(activeTab === 'tenant-signin' || activeTab === 'auth-signin') && (
                <AuthSignInView
                  tenants={tenants}
                  initialMode="tenant"
                  onSignInSuccess={handleSignIn}
                  onBackToApp={() => setActiveTab('dashboard')}
                />
              )}
            </>
          )}

          {/* Super Admin Views */}
          {currentRole === 'super_admin' && (
            <>
              {activeTab === 'admin-overview' && (
                <SuperAdminOverviewView
                  kpis={kpis}
                  tenants={tenants}
                  onImpersonateTenant={handleImpersonateTenant}
                  onNavigateToTenants={() => setActiveTab('admin-tenants')}
                />
              )}

              {activeTab === 'admin-tenants' && (
                <TenantsManagementView
                  tenants={tenants}
                  onImpersonateTenant={handleImpersonateTenant}
                  onTenantAdded={handleTenantAdded}
                  onTenantUpdated={handleUpdateTenant}
                  onToggleAccess={handleToggleTenantAccess}
                />
              )}

              {activeTab === 'admin-subscriptions' && <RetainerPlansView />}

              {activeTab === 'admin-audit-logs' && (
                <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                  <h2 className="text-3xl font-bold text-[#0b1c30]">Audit & Security Logs</h2>
                  <div className="bg-white rounded-2xl border border-[#bdcac0]/60 p-6 shadow-xs">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-[#bdcac0]/40 font-semibold text-[#545f73] uppercase">
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Event</th>
                          <th className="py-2.5 px-3">Tenant Code</th>
                          <th className="py-2.5 px-3">Actor</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#bdcac0]/30">
                        <tr>
                          <td className="py-3 px-3 text-[#545f73]">Today, 10:42 AM</td>
                          <td className="py-3 px-3 font-semibold text-[#0b1c30]">Tenant Provisioned (TEN-0990)</td>
                          <td className="py-3 px-3 text-[#006a46]">TEN-0990</td>
                          <td className="py-3 px-3">super_admin@billlah.my</td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-bold">SUCCESS</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 text-[#545f73]">Today, 09:15 AM</td>
                          <td className="py-3 px-3 font-semibold text-[#0b1c30]">Invoice Dispatched (INV-2023-1042)</td>
                          <td className="py-3 px-3 text-[#006a46]">TEN-0982</td>
                          <td className="py-3 px-3">aminah@techsolutions.my</td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-bold">SUCCESS</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 text-[#545f73]">Yesterday, 04:30 PM</td>
                          <td className="py-3 px-3 font-semibold text-[#0b1c30]">SST-02 Filing Export Generated</td>
                          <td className="py-3 px-3 text-[#006a46]">TEN-0982</td>
                          <td className="py-3 px-3">aminah@techsolutions.my</td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-bold">SUCCESS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'admin-settings' && (
                <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-[#0b1c30]">System Configuration</h2>
                      <p className="text-xs text-[#545f73]">Multi-tenant database engine, e-Invoice gateway and security controls</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('admin-profile')}
                      className="px-4 py-2 bg-[#0b1c30] text-white rounded-xl text-xs font-bold hover:bg-[#1a2d47] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Security & Credentials</span>
                    </button>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4 text-xs">
                    <div className="space-y-2">
                      <span className="font-bold text-sm text-[#0b1c30] block">Global Multi-Tenancy Engine</span>
                      <p className="text-[#545f73]">LHDN e-Invoice XML Gateway Status: <strong className="text-emerald-700">ONLINE</strong></p>
                      <p className="text-[#545f73]">Database Pool: <strong>1,240 Isolated Schemas</strong></p>
                      <p className="text-[#545f73]">Default SST Tax Rate: <strong>8.00%</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin-profile' && (
                <AdminProfileView
                  adminConfig={superAdminConfig}
                  onUpdateAdminConfig={handleUpdateAdminConfig}
                />
              )}

              {activeTab === 'admin-templates' && (
                <TemplatesAdminView onNavigateToTab={setActiveTab} />
              )}

              {(activeTab === 'tenant-signin' || activeTab === 'auth-signin') && (
                <AuthSignInView
                  tenants={tenants}
                  adminConfig={superAdminConfig}
                  initialMode="super_admin"
                  onSignInSuccess={handleSignIn}
                  onBackToApp={() => setActiveTab('admin-overview')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Impersonate Modal (CMD+K) */}
      <ImpersonateModal
        isOpen={isImpersonateOpen}
        onClose={() => setIsImpersonateOpen(false)}
        tenants={tenants}
        onSelectTenant={handleImpersonateTenant}
      />

      {/* Support Modal */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* Lightweight toast for WhatsApp admin actions */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] bg-[#0b1c30] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
export default App;
