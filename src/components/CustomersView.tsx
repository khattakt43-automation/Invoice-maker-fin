import React, { useState } from 'react';
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
  Edit
} from 'lucide-react';
import { Customer, Invoice } from '../types';
import { AddCustomerModal } from './AddCustomerModal';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  onNewInvoiceForCustomer: (customer: Customer) => void;
  onCustomerAdded: (customer: Customer) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  onNewInvoiceForCustomer,
  onCustomerAdded,
  onSelectInvoice,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Outstanding Balance' | 'Name (A-Z)' | 'Recent Activity'>('Outstanding Balance');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || customers[0];

  // Invoices for the selected customer
  const customerInvoices = invoices.filter(
    (inv) => inv.customerId === selectedCustomer?.id || inv.customerName === selectedCustomer?.name
  );

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredCustomers.map((cust) => {
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
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs ${
                        isSelected
                          ? 'bg-[#00855a] text-white'
                          : 'bg-[#eff4ff] text-[#006a46]'
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
                        RM {cust.outstandingBalance.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-medium text-[#006a46]">Settled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  RM {selectedCustomer.outstandingBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-[#545f73]">Unsettled tax invoices</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#bdcac0]/50 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#545f73]">
                  Lifetime Value (LTV)
                </span>
                <div className="font-mono text-xl font-bold text-[#006a46]">
                  RM {selectedCustomer.ltv.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-[#545f73]">Cumulative billed volume</p>
              </div>
            </div>

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
                          onClick={() => onSelectInvoice(inv)}
                          className="hover:bg-[#eff4ff] cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3 font-bold text-[#006a46] hover:underline">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-[#545f73]">{inv.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#0b1c30]">
                            RM {inv.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                inv.status === 'Paid'
                                  ? 'bg-[#00855a]/15 text-[#006a46]'
                                  : inv.status === 'Unpaid'
                                  ? 'bg-[#ffdad6] text-[#93000a]'
                                  : 'bg-[#ffebd6] text-[#8a4100]'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectInvoice(inv)}
                              title="Edit invoice details"
                              className="px-2 py-1 rounded bg-[#eff4ff] hover:bg-[#006a46] hover:text-white text-[#006a46] text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
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
          </div>
        )}
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={onCustomerAdded}
      />
    </div>
  );
};
