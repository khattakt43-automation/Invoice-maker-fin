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
  ChevronDown
} from 'lucide-react';
import { Invoice } from '../types';
import { SendInvoiceModal } from './SendInvoiceModal';

interface InvoicesListViewProps {
  invoices: Invoice[];
  onCreateInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onStatusChange: (id: string, newStatus: Invoice['status']) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  onCreateInvoice,
  onSelectInvoice,
  onStatusChange,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareInvoice, setShareInvoice] = useState<Invoice | null>(null);

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

  return (
    <div id="invoices-list-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Tax Invoices</h2>
          <p className="text-sm text-[#545f73]">
            Manage, dispatch, and track Malaysian SST invoices and payment status
          </p>
        </div>
        <button
          onClick={onCreateInvoice}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#bdcac0]/60 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#eff4ff] rounded-xl border border-[#bdcac0]/40 w-full md:w-auto overflow-x-auto">
          {(['All', 'Paid', 'Unpaid', 'Overdue'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
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

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, client..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#bdcac0]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#bdcac0]/50 text-xs font-semibold tracking-wider text-[#545f73] uppercase bg-[#eff4ff]/60">
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#545f73]">
                    No invoices match your current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#eff4ff]/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectInvoice(inv)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#006a46] group-hover:underline">
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
                      RM {inv.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={inv.status}
                        onChange={(e) => onStatusChange(inv.id, e.target.value as any)}
                        className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full outline-none cursor-pointer border ${
                          inv.status === 'Paid'
                            ? 'bg-[#00855a]/15 text-[#006a46] border-[#00855a]/30'
                            : inv.status === 'Unpaid'
                            ? 'bg-[#ffdad6] text-[#93000a] border-[#ffdad6]'
                            : 'bg-[#ffebd6] text-[#8a4100] border-[#ffebd6]'
                        }`}
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
                          title="Edit invoice data and line items"
                          className="px-2.5 py-1 text-xs font-semibold text-[#006a46] bg-[#00855a]/10 hover:bg-[#006a46] hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          title="Preview Invoice"
                          className="p-1.5 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShareInvoice(inv)}
                          title="Share via WhatsApp / Email"
                          className="p-1.5 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
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

      <SendInvoiceModal
        isOpen={Boolean(shareInvoice)}
        onClose={() => setShareInvoice(null)}
        invoice={shareInvoice}
      />
    </div>
  );
};
