import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Calendar, TrendingUp, CheckCircle, Percent } from 'lucide-react';
import { Invoice, Tenant } from '../types';

interface ReportsViewProps {
  tenant: Tenant;
  invoices: Invoice[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ tenant, invoices }) => {
  const [selectedYear, setSelectedYear] = useState('2023');

  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalTaxCollected = invoices.reduce((acc, i) => acc + i.taxAmount, 0);
  const totalSubtotal = invoices.reduce((acc, i) => acc + i.subtotal, 0);
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const paidTotal = paidInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

  const handleExportCSV = () => {
    const headers = 'Invoice No,Customer,Date,Due Date,Subtotal (MYR),SST (MYR),Total (MYR),Status\n';
    const rows = invoices
      .map(
        (i) =>
          `"${i.invoiceNumber}","${i.customerName}","${i.date}","${i.dueDate}",${i.subtotal},${i.taxAmount},${i.totalAmount},"${i.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BillLah_SST_Report_${tenant.name.replace(/\s+/g, '_')}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">SST & Revenue Reports</h2>
          <p className="text-sm text-[#545f73]">
            Malaysian Sales and Service Tax (SST-02) return data and financial year aggregates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-[#006a46] text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export SST Return (CSV)</span>
          </button>
        </div>
      </div>

      {/* SST Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Gross Taxable Sales</span>
          <div className="text-2xl font-extrabold text-[#0b1c30] font-mono">
            RM {totalSubtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#545f73]">Excludes SST component</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">SST Output Tax (8%)</span>
          <div className="text-2xl font-extrabold text-[#006a46] font-mono">
            RM {totalTaxCollected.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#006a46] font-medium">Payable to Royal Malaysian Customs</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Total Realized Collection</span>
          <div className="text-2xl font-extrabold text-[#0b1c30] font-mono">
            RM {paidTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#545f73]">{paidInvoices.length} settled invoices</p>
        </div>
      </div>

      {/* Quarterly Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#bdcac0]/60 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-[#0b1c30]">Quarterly SST-02 Schedule</h3>
          <span className="text-xs font-mono font-semibold text-[#006a46]">SST Reg: {tenant.sstId}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eff4ff] border-b border-[#bdcac0]/40 font-semibold text-[#545f73] uppercase">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Taxable Amount (RM)</th>
                <th className="py-3 px-4">Tax Payable (8% SST)</th>
                <th className="py-3 px-4">Filing Status</th>
                <th className="py-3 px-4 text-right">LHDN/Customs Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcac0]/30 font-mono">
              <tr className="hover:bg-[#eff4ff]/40">
                <td className="py-3 px-4 font-bold text-[#0b1c30]">Q1 (Jan - Mar 2023)</td>
                <td className="py-3 px-4">15,000.00</td>
                <td className="py-3 px-4 font-bold text-[#006a46]">1,200.00</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">Filed & Paid</td>
                <td className="py-3 px-4 text-right text-[#545f73]">SST-2023-Q1-9011</td>
              </tr>
              <tr className="hover:bg-[#eff4ff]/40">
                <td className="py-3 px-4 font-bold text-[#0b1c30]">Q2 (Apr - Jun 2023)</td>
                <td className="py-3 px-4">22,000.00</td>
                <td className="py-3 px-4 font-bold text-[#006a46]">1,760.00</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">Filed & Paid</td>
                <td className="py-3 px-4 text-right text-[#545f73]">SST-2023-Q2-8822</td>
              </tr>
              <tr className="hover:bg-[#eff4ff]/40">
                <td className="py-3 px-4 font-bold text-[#0b1c30]">Q3 (Jul - Sep 2023)</td>
                <td className="py-3 px-4">35,000.00</td>
                <td className="py-3 px-4 font-bold text-[#006a46]">2,800.00</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">Filed & Paid</td>
                <td className="py-3 px-4 text-right text-[#545f73]">SST-2023-Q3-1044</td>
              </tr>
              <tr className="hover:bg-[#eff4ff]/40 bg-[#f8f9ff]">
                <td className="py-3 px-4 font-bold text-[#006a46]">Q4 (Oct - Dec 2023)</td>
                <td className="py-3 px-4">{totalSubtotal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4 font-bold text-[#ba1a1a]">{totalTaxCollected.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4 text-amber-800 font-bold">Pending Filing (Due Jan 31)</td>
                <td className="py-3 px-4 text-right text-[#006a46] font-bold">Ready to Submit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
