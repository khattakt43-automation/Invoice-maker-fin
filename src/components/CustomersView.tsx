import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Customer, Invoice } from '../types';
import { AddCustomerModal } from './AddCustomerModal';
import { SendInvoiceModal } from './SendInvoiceModal';
import { statusBadgeClass } from '../utils/invoiceStatus';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  openCustomerId?: string | null;
  onNewInvoiceForCustomer: (customer: Customer) => void;
  onCustomerAdded: (customer: Customer) => void;
  onCustomerDeleted: (customerId: string) => void;
  onCustomersBulkDeleted: (ids: string[]) => void;
  onSelectInvoice: (invoice: Invoice, returnTo?: string, customerId?: string | null) => void;
}

const PAGE_SIZE = 20;

const downloadInvoice = (inv: Invoice) => {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${inv.invoiceNumber}</title>
    <style>body{font-family:sans-serif;margin:0;padding:40px;color:#0b1c30}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0b1c30;padding-bottom:16px}
    .meta{display:flex;justify-content:space-between;margin:20px 0}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #bdcac0;padding:8px;text-align:left;font-size:13px}
    th{background:#eff4ff}.right{text-align:right}.tot{font-size:16px;font-weight:bold}
    .foot{margin-top:20px;font-size:11px;color:#545f73}</style></head><body>
    <div class="head"><div><h2>${inv.customerName}</h2><p>${inv.customerEmail || ''}<br>${inv.customerPhone || ''}</p></div>
    <div><h1>${inv.docTitle || 'TAX INVOICE'}</h1><p>${inv.invoiceNumber}<br>${inv.date} / Due ${inv.dueDate}</p></div></div>
    <table><thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Amount</th></tr></thead><tbody>
    ${(inv.items || []).map((it: any) => `<tr><td>${it.description}</td><td class="right">${it.quantity}</td><td class="right">${Number(it.unitPrice).toFixed(2)}</td><td class="right">${Number(it.amount).toFixed(2)}</td></tr>`).join('')}
    </tbody></table>
    <div class="meta"><span></span><span class="tot">Total: ${inv.currency} ${Number(inv.totalAmount).toFixed(2)}</span></div>
    <p class="foot">${inv.notes || ''}</p></body></html>`);
  w.document.close();
  setTimeout(() => {
    w!.focus();
    w!.print();
  }, 400);
};

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  openCustomerId,
  onNewInvoiceForCustomer,
  onCustomerAdded,
  onCustomerDeleted,
  onCustomersBulkDeleted,
  onSelectInvoice,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Outstanding Balance' | 'Name (A-Z)' | 'Recent Activity'>('Outstanding Balance');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Open a specific customer when arriving back from an invoice edit
  useEffect(() => {
    if (openCustomerId) setSelectedCustomerId(openCustomerId);
  }, [openCustomerId]);

  const handleDeleteCustomer = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/customers/${confirmDelete.id}`, { method: 'DELETE' });
      onCustomerDeleted(confirmDelete.id);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(confirmDelete.id);
        return n;
      });
      setSelectedCustomerId('');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) => fetch(`/api/customers/${id}`, { method: 'DELETE' }))
      );
      onCustomersBulkDeleted([...selected]);
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  };

  // Filter & sort
  const filteredCustomers = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.tin.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'Name (A-Z)') return a.name.localeCompare(b.name);
      if (sortBy === 'Recent Activity') return b.ltv - a.ltv;
      return b.outstandingBalance - a.outstandingBalance;
    });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || customers[0];

  // Invoices for the selected customer
  const customerInvoices = invoices.filter(
    (inv) => inv.customerId === selectedCustomer?.id || inv.customerName === selectedCustomer?.name
  );

  const [statementMonth, setStatementMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const openEdit = (inv: Invoice) => onSelectInvoice(inv, 'customers', selectedCustomer?.id);

  return (
    <div id="customers-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Customers</h2>
          <p className="text-sm text-[#545f73]">
            Manage client credit limits, SST profiles, and historical payment performance
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Bulk action bar */}
      <div className="flex items-center justify-between gap-3 bg-[#eff4ff]/60 border border-[#bdcac0]/50 rounded-2xl px-4 py-2.5">
        <span className="text-xs text-[#545f73]">
          {selected.size > 0 ? `${selected.size} selected` : 'Select customers to bulk-delete'}
        </span>
        <button
          onClick={handleBulkDelete}
          disabled={selected.size === 0 || deleting}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Selected
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Directory (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Search & Sort Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#bdcac0]/60 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search by company, email, or TIN..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#545f73] font-semibold shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#f8f9ff] border border-[#bdcac0] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#0b1c30] outline-none w-full sm:w-auto"
              >
                <option value="Outstanding Balance">Outstanding</option>
                <option value="Name (A-Z)">Name (A-Z)</option>
                <option value="Recent Activity">Highest LTV</option>
              </select>
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2.5">
            {pageCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const statusColor =
                cust.status === 'OVERDUE'
                  ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]'
                  : cust.status === 'CURRENT'
                  ? 'bg-[#ffebd6] text-[#8a4100] border-[#ffebd6]'
                  : 'bg-[#00855a]/15 text-[#006a46] border-[#00855a]/30';

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white border-[#006a46] ring-2 ring-[#006a46]/20 shadow-md'
                      : 'bg-white border-[#bdcac0]/60 hover:border-[#006a46]/50 hover:bg-[#eff4ff]/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(cust.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() =>
                        setSelected((prev) => {
                          const n = new Set(prev);
                          if (n.has(cust.id)) n.delete(cust.id);
                          else n.add(cust.id);
                          return n;
                        })
                      }
                      className="w-4 h-4 accent-[#006a46] cursor-pointer shrink-0"
                    />
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs ${
                        isSelected ? 'bg-[#00855a] text-white' : 'bg-[#eff4ff] text-[#006a46]'
                      }`}
                    >
                      {cust.initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#0b1c30] truncate">{cust.name}</h4>
                      <p className="text-xs text-[#545f73] truncate">{cust.contactPerson} • {cust.email}</p>
                      <span className="text-[10px] font-mono text-[#3e4942]">TIN: {cust.tin}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {cust.status}
                    </span>
                    {cust.outstandingBalance > 0 ? (
                      <span className="font-mono text-xs font-bold text-[#ba1a1a]">
                        {cust.currency || 'RM'} {cust.outstandingBalance.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-medium text-[#006a46]">Settled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border border-[#bdcac0]/40 rounded-2xl px-4 py-3 text-xs bg-white">
              <span className="text-[#545f73]">
                Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filteredCustomers.length)}–
                {Math.min(safePage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-[#bdcac0] text-[#545f73] hover:bg-[#eff4ff] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-[#545f73]">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                          p === safePage ? 'bg-[#006a46] text-white' : 'text-[#545f73] hover:bg-[#eff4ff] border border-[#bdcac0]'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-[#bdcac0] text-[#545f73] hover:bg-[#eff4ff] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Bento Detail Drawer (6 Cols) */}
        {selectedCustomer && (
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#bdcac0]/60 p-6 shadow-xs space-y-6 sticky top-20">
            {/* Header & Primary Identity */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#bdcac0]/40">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#00855a] text-white flex items-center justify-center font-bold text-base font-mono shadow-xs shrink-0">
                  {selectedCustomer.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xl text-[#0b1c30] leading-tight">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-[#545f73] mt-0.5">
                    Attn: <strong>{selectedCustomer.contactPerson}</strong>
                  </p>
                  <p className="text-xs font-mono text-[#3e4942] mt-0.5">
                    TIN: <strong>{selectedCustomer.tin}</strong>
                  </p>
                  <p className="text-xs text-[#545f73] whitespace-pre-line mt-1.5 leading-relaxed bg-[#f8f9ff] p-2 rounded-lg border border-[#bdcac0]/40 font-mono">
                    {selectedCustomer.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#bdcac0]/50 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#545f73]">
                  Outstanding Balance
                </span>
                <div className="font-mono text-xl font-bold text-[#ba1a1a]">
                  {selectedCustomer.currency || 'RM'} {selectedCustomer.outstandingBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-[#545f73]">Unsettled tax invoices</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#bdcac0]/50 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#545f73]">
                  Lifetime Value (LTV)
                </span>
                <div className="font-mono text-xl font-bold text-[#006a46]">
                  {selectedCustomer.currency || 'RM'} {selectedCustomer.ltv.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-[#545f73]">Cumulative billed volume</p>
              </div>
            </div>

            {/* Customer Financial Summary (Point 12) */}
            {(() => {
              const cur = selectedCustomer.currency || 'RM';
              const totalBilled = customerInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
              const collected = customerInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
              const pending = customerInvoices.filter((i) => i.status === 'Unpaid').reduce((s, i) => s + (i.totalAmount || 0), 0);
              const overdue = customerInvoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + (i.totalAmount || 0), 0);
              const fmt = (n: number) => `${cur} ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
              const cells = [
                { label: 'Total Billed', val: fmt(totalBilled), cls: 'text-[#0b1c30]' },
                { label: 'Collected / Paid', val: fmt(collected), cls: 'text-[#006a46]' },
                { label: 'Pending Payment', val: fmt(pending), cls: 'text-[#8a4100]' },
                { label: 'Overdue', val: fmt(overdue), cls: 'text-[#ba1a1a]' },
              ];
              return (
                <div className="bg-white rounded-xl border border-[#bdcac0]/50 p-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cells.map((c) => (
                      <div key={c.label} className="bg-[#f8f9ff] rounded-lg p-2.5 border border-[#bdcac0]/40">
                        <div className="text-[10px] text-[#545f73]">{c.label}</div>
                        <div className={`font-mono text-sm font-bold ${c.cls}`}>{c.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Invoice Status Sections (Point 11) */}
            {(() => {
              const groups: { key: Invoice['status']; label: string; cls: string }[] = [
                { key: 'Paid', label: 'Paid Invoices', cls: 'text-[#006a46] border-[#00855a]/30 bg-[#00855a]/10' },
                { key: 'Unpaid', label: 'Unpaid Invoices', cls: 'text-[#93000a] border-[#ffdad6] bg-[#ffdad6]/40' },
                { key: 'Draft', label: 'Draft Invoices', cls: 'text-[#545f73] border-[#bdcac0] bg-[#eff4ff]' },
                { key: 'Overdue', label: 'Overdue Invoices', cls: 'text-[#8a4100] border-[#ffebd6] bg-[#ffebd6]/60' },
              ];
              return (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Invoices by Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {groups.map((g) => {
                      const list = customerInvoices.filter((i) => i.status === g.key);
                      return (
                        <div key={g.key} className={`rounded-xl border p-2.5 ${g.cls}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider">{g.label}</span>
                            <span className="text-[10px] font-mono font-bold">{list.length}</span>
                          </div>
                          {list.length > 0 && (
                            <div className="mt-1 space-y-0.5 max-h-24 overflow-auto">
                              {list.map((inv) => (
                                <div
                                  key={inv.id}
                                  onClick={() => openEdit(inv)}
                                  className="text-[10px] font-mono cursor-pointer hover:underline"
                                >
                                  {inv.invoiceNumber} · {inv.currency} {(inv.totalAmount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Monthly Statement (Point 10) */}
            {(() => {
              // Build a useful historical range: last 12 months (system date based),
              // plus any months that actually have invoice data for this customer.
              const now = new Date();
              const historical: string[] = [];
              for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                historical.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
              }
              const dataMonths = Array.from(new Set(customerInvoices.map((i) => (i.date || '').slice(0, 7)))).filter(Boolean);
              const months = Array.from(new Set([...historical, ...dataMonths])).sort().reverse();
              const byMonth = customerInvoices.filter((i) => (i.date || '').slice(0, 7) === statementMonth);
              const total = byMonth.reduce((s, i) => s + (i.totalAmount || 0), 0);
              const cur = selectedCustomer.currency || 'RM';
              const [sy, sm] = statementMonth.split('-');
              const monthLabel = new Date(Number(sy), Number(sm) - 1, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
              const todayLabel = now.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <div className="bg-white rounded-xl border border-[#bdcac0]/50 p-3">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Monthly Statement
                    </h4>
                    <select
                      value={statementMonth}
                      onChange={(e) => setStatementMonth(e.target.value)}
                      className="bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-2 py-1 text-xs font-semibold text-[#0b1c30] outline-none max-w-[150px]"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-[#545f73] mb-2">Showing: {monthLabel} · Today: {todayLabel}</p>
                  <div className="border border-[#bdcac0]/40 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-[#f8f9ff] border-b border-[#bdcac0]/40 text-[#545f73] uppercase text-[10px]">
                          <th className="py-2 px-2">Invoice</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2 text-right">Amount</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#bdcac0]/30">
                        {byMonth.length === 0 ? (
                          <tr><td colSpan={4} className="py-3 text-center text-[#545f73]">No invoices this month.</td></tr>
                        ) : byMonth.map((inv) => (
                          <tr key={inv.id} onClick={() => openEdit(inv)} className="hover:bg-[#eff4ff] cursor-pointer">
                            <td className="py-1.5 px-2 font-bold text-[#006a46]">{inv.invoiceNumber}</td>
                            <td className="py-1.5 px-2 text-[#545f73]">{inv.date}</td>
                            <td className="py-1.5 px-2 text-right">{inv.currency} {(inv.totalAmount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadgeClass(inv.status)}`}>{inv.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-mono">
                    <span className="text-[#545f73]">Total for {monthLabel}</span>
                    <span className="font-bold text-[#0b1c30]">{cur} {total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })()}

            {/* Contact quick strip */}
            <div className="flex flex-wrap gap-4 text-xs text-[#545f73] bg-[#eff4ff]/60 p-3 rounded-xl border border-[#bdcac0]/40">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#006a46]" />
                <a href={`mailto:${selectedCustomer.email}`} className="hover:underline font-mono">
                  {selectedCustomer.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#006a46]" />
                <span className="font-mono">{selectedCustomer.phone}</span>
              </div>
            </div>

            {/* Recent Invoices for this customer */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#006a46] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Recent Invoices
                </h4>
              </div>

              <div className="border border-[#bdcac0]/50 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9ff] border-b border-[#bdcac0]/40 font-semibold text-[#545f73] uppercase">
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bdcac0]/30 font-mono">
                    {customerInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[#545f73]">
                          No invoices recorded yet.
                        </td>
                      </tr>
                    ) : (
                      customerInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => openEdit(inv)}
                          className="hover:bg-[#eff4ff] cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3 font-bold text-[#006a46] group-hover:underline">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-[#545f73]">{inv.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#0b1c30]">
                            {inv.currency} {inv.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(inv.status)}`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(inv)}
                                title="Edit (returns to this customer)"
                                className="px-2 py-1 rounded bg-[#eff4ff] hover:bg-[#006a46] hover:text-white text-[#006a46] text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => downloadInvoice(inv)}
                                title="Download / Save as PDF"
                                className="p-1 rounded bg-[#eff4ff] hover:bg-[#006a46] hover:text-white text-[#006a46] transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setShareInvoice(inv)}
                                title="Share via WhatsApp / Email"
                                className="p-1 rounded bg-[#eff4ff] hover:bg-[#006a46] hover:text-white text-[#006a46] transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(selectedCustomer)}
                                title="Delete customer"
                                className="p-1 rounded bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={() => onNewInvoiceForCustomer(selectedCustomer)}
              className="w-full bg-[#006a46] text-white py-3 rounded-xl font-semibold text-xs hover:bg-[#00855a] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice for {selectedCustomer.name.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => setConfirmDelete(selectedCustomer)}
              className="mt-3 w-full px-4 py-3 rounded-xl font-semibold text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Delete customer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Customer Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0b1c30]">Delete Customer?</h3>
            <p className="text-sm text-[#545f73] mt-2">
              This will permanently delete <strong>{confirmDelete.name}</strong> and all their invoices, and cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-[#0b1c30] text-xs font-semibold hover:bg-[#eff4ff]">Cancel</button>
              <button onClick={handleDeleteCustomer} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={onCustomerAdded}
      />

      <SendInvoiceModal
        isOpen={Boolean(shareInvoice)}
        onClose={() => setShareInvoice(null)}
        invoice={shareInvoice}
      />
    </div>
  );
};
