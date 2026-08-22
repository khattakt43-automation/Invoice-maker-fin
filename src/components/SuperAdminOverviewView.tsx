import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  FileCheck,
  TrendingUp,
  Shield,
  Search,
  LogIn,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { PlatformKPIs, Tenant } from '../types';

interface SuperAdminOverviewViewProps {
  kpis: PlatformKPIs;
  tenants: Tenant[];
  onImpersonateTenant: (tenant: Tenant) => void;
  onNavigateToTenants: () => void;
}

export const SuperAdminOverviewView: React.FC<SuperAdminOverviewViewProps> = ({
  kpis,
  tenants,
  onImpersonateTenant,
  onNavigateToTenants,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(qClean(searchQuery)) ||
      t.code.toLowerCase().includes(qClean(searchQuery)) ||
      t.adminEmail.toLowerCase().includes(qClean(searchQuery))
  );

  function qClean(s: string) {
    return s.trim().toLowerCase();
  }

  return (
    <div id="super-admin-overview" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8bf8c2]/10 text-[#006a46] dark:text-[#8bf8c2] text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Super Admin Control Console
          </div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Platform Overview</h2>
          <p className="text-sm text-[#545f73]">
            Global telemetry, cloud tenant isolation status, and recurring revenue
          </p>
        </div>

        {/* Global Impersonation Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search to impersonate..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Total Tenants</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00855a]/10 text-[#006a46]">
              {kpis.totalTenantsGrowth}
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0b1c30] font-mono tracking-tight">
              {kpis.totalTenants.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#545f73] mt-1">Multi-tenant instances online</p>
          </div>
        </div>

        {/* Active Tenants */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Active Tenants</span>
            <span className="text-xs font-mono text-[#006a46] font-bold">
              {Math.round((kpis.activeTenants / kpis.totalTenants) * 100)}%
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#006a46] font-mono tracking-tight">
              {kpis.activeTenants.toLocaleString()} <span className="text-sm font-normal text-[#545f73]">/ {kpis.totalTenantsCap}</span>
            </div>
            {/* Mini Progress bar */}
            <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#00855a] h-full rounded-full"
                style={{ width: `${(kpis.activeTenants / kpis.totalTenants) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Platform MRR */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Platform MRR</span>
            <div className="p-1.5 rounded-lg bg-[#00855a]/10 text-[#006a46]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xs font-medium text-[#545f73]">RM</span>
              <span className="text-3xl font-extrabold text-[#0b1c30] font-mono tracking-tight">
                {kpis.platformMrr.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-[#006a46] font-medium mt-1">{kpis.platformMrrGrowth}</p>
          </div>
        </div>

        {/* Invoices Processed */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Invoices Processed</span>
            <div className="p-1.5 rounded-lg bg-[#d5e0f8] text-[#3f465c]">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0b1c30] font-mono tracking-tight">
              {kpis.invoicesProcessed}
            </div>
            <p className="text-[11px] text-[#545f73] mt-1">Total SST tax receipts</p>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Subscriptions & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subscription Tiers (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-[#0b1c30] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#006a46]" /> Subscription Tiers Breakdown
            </h3>
          </div>

          <div className="space-y-4">
            {/* Basic */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#545f73]">Basic Tier (Free)</span>
                <span className="font-mono text-[#0b1c30]">
                  {kpis.subscriptionTiers.basic.count} ({kpis.subscriptionTiers.basic.percentage}%)
                </span>
              </div>
              <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full"
                  style={{ width: `${kpis.subscriptionTiers.basic.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Pro */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#006a46] font-bold">Pro Tier (RM 49/mo)</span>
                <span className="font-mono text-[#0b1c30]">
                  {kpis.subscriptionTiers.pro.count} ({kpis.subscriptionTiers.pro.percentage}%)
                </span>
              </div>
              <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00855a] h-full rounded-full"
                  style={{ width: `${kpis.subscriptionTiers.pro.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Enterprise */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-purple-700 font-bold">Enterprise Retainers</span>
                <span className="font-mono text-[#0b1c30]">
                  {kpis.subscriptionTiers.enterprise.count} ({kpis.subscriptionTiers.enterprise.percentage}%)
                </span>
              </div>
              <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${kpis.subscriptionTiers.enterprise.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#eff4ff]/60 rounded-xl border border-[#bdcac0]/40 text-xs text-[#545f73] space-y-1 leading-relaxed">
            <span className="font-bold text-[#0b1c30] block">Automated Billing Status</span>
            All tenant database schemas run daily health checks with zero isolation anomalies detected.
          </div>
        </div>

        {/* Recent Registrations Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">Recent Tenant Registrations</h3>
              <p className="text-xs text-[#545f73]">Click impersonate to log into any tenant instance</p>
            </div>
            <button
              onClick={onNavigateToTenants}
              className="text-xs font-semibold text-[#006a46] hover:underline flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#bdcac0]/40 text-[#545f73] font-semibold uppercase">
                  <th className="py-2.5 px-3">Business Entity</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bdcac0]/30">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[#eff4ff]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006a46] flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                          {t.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0b1c30] truncate">{t.name}</p>
                          <span className="font-mono text-[10px] text-[#545f73]">{t.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.plan === 'Enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : t.plan === 'Pro'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#545f73] whitespace-nowrap">{t.joinedDate}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onImpersonateTenant(t)}
                        className="px-3 py-1 bg-[#006a46] text-white rounded-lg text-[11px] font-semibold hover:bg-[#00855a] transition-all flex items-center gap-1.5 ml-auto shadow-xs active:scale-95"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Impersonate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
