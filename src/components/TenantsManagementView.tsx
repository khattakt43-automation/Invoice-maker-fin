import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  LogIn,
  MoreVertical,
  CheckCircle,
  Clock,
  Shield,
  Download,
  AlertCircle,
  Edit2,
  Settings
} from 'lucide-react';
import { Tenant } from '../types';
import { AddTenantModal } from './AddTenantModal';
import { EditTenantModal } from './EditTenantModal';

interface TenantsManagementViewProps {
  tenants: Tenant[];
  onImpersonateTenant: (tenant: Tenant) => void;
  onTenantAdded: (tenant: Tenant) => void;
  onTenantUpdated?: (tenant: Tenant) => void;
  onToggleAccess: (tenantId: string, enabled: boolean) => void;
}

export const TenantsManagementView: React.FC<TenantsManagementViewProps> = ({
  tenants,
  onImpersonateTenant,
  onTenantAdded,
  onTenantUpdated,
  onToggleAccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Trial'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const filteredTenants = tenants.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.adminEmail.toLowerCase().includes(q) ||
      t.adminName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div id="tenants-management-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Tenants Management</h2>
          <p className="text-sm text-[#545f73]">
            System Admin Central • Global schema control and provisioning
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Total Tenants</span>
          <div className="text-3xl font-extrabold text-[#0b1c30] font-mono mt-2">
            {tenants.length.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#545f73] mt-1">Multi-tenant schemas isolated</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Active Today</span>
          <div className="text-3xl font-extrabold text-[#006a46] font-mono mt-2">
            {tenants.filter((t) => t.accessEnabled).length.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#006a46] font-medium mt-1">Healthy access channels</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Pending Approval</span>
            <span className="text-xs text-[#006a46] font-semibold cursor-pointer hover:underline">Review All</span>
          </div>
          <div className="text-3xl font-extrabold text-[#ba1a1a] font-mono mt-2">
            {tenants.filter((t) => t.status === 'Trial').length}
          </div>
          <p className="text-[11px] text-[#ba1a1a] font-medium mt-1">SST verification required</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#bdcac0]/60 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, name, admin email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 p-1 bg-[#eff4ff] rounded-xl border border-[#bdcac0]/40 text-xs font-semibold">
            {(['All', 'Active', 'Trial'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-white text-[#006a46] shadow-xs'
                    : 'text-[#545f73] hover:text-[#0b1c30]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#bdcac0]/50 text-xs font-semibold tracking-wider text-[#545f73] uppercase bg-[#eff4ff]/60">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Business Entity</th>
                <th className="py-3.5 px-4">Admin Contact</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Billing</th>
                <th className="py-3.5 px-4 text-center">Access</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcac0]/30 text-xs">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-[#eff4ff]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#006a46]">{t.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#006a46] flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                        {t.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#0b1c30] truncate">{t.name}</p>
                        <span className="text-[10px] text-[#545f73] font-mono">SST: {t.sstId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#0b1c30]">{t.adminName}</p>
                    <span className="text-[#545f73] font-mono text-[11px]">{t.adminEmail}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#545f73] whitespace-nowrap">{t.phone}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'Active'
                          ? 'bg-[#00855a]/15 text-[#006a46]'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#545f73] whitespace-nowrap">{t.joinedDate}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        t.billingStatus === 'Paid' ? 'text-[#006a46]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {t.billingStatus}
                    </span>
                  </td>
                  {/* ACCESS TOGGLE */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleAccess(t.id, !t.accessEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        t.accessEnabled ? 'bg-[#006a46]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          t.accessEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  {/* ACTIONS */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingTenant(t)}
                        title="Edit Tenant Details"
                        className="px-2.5 py-1 bg-white border border-[#bdcac0] text-[#0b1c30] hover:border-[#006a46] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onImpersonateTenant(t)}
                        title="Impersonate Portal"
                        className="px-2.5 py-1 bg-[#006a46] text-white rounded-lg font-semibold text-[11px] hover:bg-[#00855a] transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Impersonate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTenantAdded={onTenantAdded}
      />

      <EditTenantModal
        isOpen={!!editingTenant}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onTenantUpdated={(updated) => {
          onTenantUpdated?.(updated);
          setEditingTenant(null);
        }}
      />
    </div>
  );
};
