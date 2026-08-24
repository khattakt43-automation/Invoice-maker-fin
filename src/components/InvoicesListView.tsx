import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Share2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  ChevronDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Invoice } from '../types';
import { SendInvoiceModal } from './SendInvoiceModal';
import { statusBadgeClass } from '../utils/invoiceStatus';

interface InvoicesListViewProps {
  invoices: Invoice[];
  onCreateInvoice: (returnTo?: string, customerId?: string | null) => void;
  onSelectInvoice: (invoice: Invoice, returnTo?: string, customerId?: string | null) => void;
  onStatusChange: (id: string, newStatus: Invoice['status']) => void;
  onInvoiceDeleted: (id: string) => void;
  onInvoicesBulkDeleted: (ids: string[]) => void;
}

const PAGE_SIZE = 20;

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  onCreateInvoice,
  onSelectInvoice,
  onStatusChange,
  onInvoiceDeleted,
  onInvoicesBulkDeleted,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue' | 'Draft'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareInvoice, setShareInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleDeleteInvoice = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/invoices/${confirmDelete.id}`, { method: 'DELETE' });
      onInvoiceDeleted(confirmDelete.id);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(confirmDelete.id);
        return n;
      });
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
        [...selected].map((id) => fetch(`/api/invoices/${id}`, { method: 'DELETE' }))
      );
      onInvoicesBulkDeleted([...selected]);
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus =
      statusFilter === 'All' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerTin && inv.customerTin.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((i) => selected.has(i.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((i) => n.delete(i.id));
      } else {
        pageRows.forEach((i) => n.add(i.id));
      }
      return n;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const downloadInvoice = (inv: Invoice) => {
    // Open the server-rendered, branded invoice and auto-trigger the browser's
    // "Save as PDF" dialog (via ?autoprint=1 handled server-side). This gives a
    // true PDF download using the exact same design as the in-app preview.
    const num = (inv.invoiceNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const url = `/i/${num}?autoprint=1`;
    const w = window.open(url, '_blank');
    if (!w) {
      // Popup blocked — fall back to same-tab navigation.
      window.location.href = url;
    }
  };

  return (
    <div id="invoices-list-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Invoices</h2>
          <p className="text-sm text-[#545f73]">
            Manage, dispatch, and track Malaysian SST invoices and payment status
          </p>
        </div>
        <button
          onClick={() => onCreateInvoice('invoices')}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
        <button
          onClick={() => window.open('/i/example', '_blank')}
          className="bg-white text-[#006a46] border border-[#006a46]/30 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#eff4ff] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
          title="Open a sample invoice showing the standard design"
        >
          <Eye className="w-4 h-4" />
          <span>Example Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#bdcac0]/60 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#eff4ff] rounded-xl border border-[#bdcac0]/40 w-full md:w-auto overflow-x-auto">
          {(['All', 'Paid', 'Unpaid', 'Overdue', 'Draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-white text-[#006a46] shadow-xs'
                  : 'text-[#545f73] hover:text-[#0b1c30]'
              }`}
            >
              {st} ({st === 'All' ? invoices.length : invoices.filter((i) => i.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search invoice number, client..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      <div className="flex items-center justify-between gap-3 bg-[#eff4ff]/60 border border-[#bdcac0]/50 rounded-2xl px-4 py-2.5">
        <span className="text-xs text-[#545f73]">
          {selected.size > 0 ? `${selected.size} selected` : 'Select invoices to bulk-delete'}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#bdcac0]/50 text-xs font-semibold tracking-wider text-[#545f73] uppercase bg-[#eff4ff]/60">
                <th className="py-3.5 px-3 w-10">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} className="cursor-pointer w-4 h-4 accent-[#006a46]" />
                </th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer Entity</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcac0]/30 text-sm">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#545f73]">
                    No invoices match your current filter.
                  </td>
                </tr>
              ) : (
                pageRows.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#eff4ff]/70 transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleOne(inv.id)}
                        className="cursor-pointer w-4 h-4 accent-[#006a46]"
                      />
                    </td>
                    <td
                      className="py-3.5 px-4 font-mono font-bold text-xs text-[#006a46] group-hover:underline cursor-pointer"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-xs text-[#0b1c30]">{inv.customerName}</p>
                      {inv.customerTin && (
                        <span className="text-[10px] text-[#545f73] font-mono">TIN: {inv.customerTin}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#545f73] font-mono">{inv.date}</td>
                    <td className="py-3.5 px-4 text-xs text-[#545f73] font-mono">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-[#0b1c30]">
                      {inv.currency} {inv.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={inv.status}
                        onChange={(e) => onStatusChange(inv.id, e.target.value as any)}
                        className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full outline-none cursor-pointer border ${statusBadgeClass(inv.status)}`}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          title="Edit invoice"
                          className="px-2.5 py-1 text-xs font-semibold text-[#006a46] bg-[#00855a]/10 hover:bg-[#006a46] hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => downloadInvoice(inv)}
                          title="Download / Save as PDF"
                          className="p-1.5 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShareInvoice(inv)}
                          title="Share via WhatsApp / Email"
                          className="p-1.5 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(inv)}
                          title="Delete invoice"
                          className="p-1.5 text-[#545f73] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#bdcac0]/40 px-4 py-3 text-xs">
            <span className="text-[#545f73]">
              Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filteredInvoices.length)}–
              {Math.min(safePage * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length}
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
                        p === safePage
                          ? 'bg-[#006a46] text-white'
                          : 'text-[#545f73] hover:bg-[#eff4ff] border border-[#bdcac0]'
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

      <SendInvoiceModal
        isOpen={Boolean(shareInvoice)}
        onClose={() => setShareInvoice(null)}
        invoice={shareInvoice}
      />

      {/* Delete Invoice Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0b1c30]">Delete Invoice?</h3>
            <p className="text-sm text-[#545f73] mt-2">
              This will permanently delete <strong>{confirmDelete.invoiceNumber}</strong> and cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-[#0b1c30] text-xs font-semibold hover:bg-[#eff4ff]">Cancel</button>
              <button onClick={handleDeleteInvoice} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
