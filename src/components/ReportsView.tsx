import React, { useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Calendar, TrendingUp, CheckCircle, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Invoice, Tenant } from '../types';

interface ReportsViewProps {
  tenant: Tenant;
  invoices: Invoice[];
}

type RangeKey =
  | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'
  | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'lastQuarter', label: 'Last Quarter' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'lastYear', label: 'Last Year' },
  { key: 'all', label: 'All Time' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function rangeBounds(key: RangeKey): { start: Date; end: Date } {
  const now = new Date();
  const s = startOfDay(now);
  switch (key) {
    case 'today': return { start: s, end: now };
    case 'yesterday': { const y = new Date(s); y.setDate(y.getDate() - 1); return { start: y, end: s }; }
    case 'thisWeek': { const d = new Date(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return { start: d, end: now }; }
    case 'lastWeek': { const d = new Date(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7); const e = new Date(d); e.setDate(e.getDate() + 7); return { start: d, end: e }; }
    case 'thisMonth': return { start: new Date(s.getFullYear(), s.getMonth(), 1), end: now };
    case 'lastMonth': { const m = new Date(s.getFullYear(), s.getMonth() - 1, 1); return { start: m, end: new Date(s.getFullYear(), s.getMonth(), 1) }; }
    case 'thisQuarter': { const q = Math.floor(s.getMonth() / 3); return { start: new Date(s.getFullYear(), q * 3, 1), end: now }; }
    case 'lastQuarter': { const q = Math.floor(s.getMonth() / 3); const lm = new Date(s.getFullYear(), q * 3 - 3, 1); return { start: lm, end: new Date(s.getFullYear(), q * 3, 1) }; }
    case 'thisYear': return { start: new Date(s.getFullYear(), 0, 1), end: now };
    case 'lastYear': return { start: new Date(s.getFullYear() - 1, 0, 1), end: new Date(s.getFullYear(), 0, 1) };
    default: return { start: new Date(2000, 0, 1), end: now };
  }
}

const fmt = (n: number) => `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export const ReportsView: React.FC<ReportsViewProps> = ({ tenant, invoices }) => {
  const [range, setRange] = useState<RangeKey>('thisMonth');
  const [grouping, setGrouping] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');

  // Tenant isolation: only this tenant's invoices (App already filters, but guard anyway).
  const myInvoices = useMemo(
    () => invoices.filter((i) => (i.tenantId ? i.tenantId === tenant.id : i.tenantName === tenant.name)),
    [invoices, tenant]
  );

  const filtered = useMemo(() => {
    const { start, end } = rangeBounds(range);
    return myInvoices.filter((i) => {
      const t = new Date(i.date);
      return t >= start && t < end;
    });
  }, [myInvoices, range]);

  const totals = useMemo(() => {
    const total = filtered.reduce((a, i) => a + i.totalAmount, 0);
    const paid = filtered.filter((i) => i.status === 'Paid').reduce((a, i) => a + i.totalAmount, 0);
    const outstanding = filtered.reduce((a, i) => a + (i.status === 'Paid' ? 0 : i.totalAmount), 0);
    const overdue = filtered.filter((i) => i.status === 'Overdue').reduce((a, i) => a + i.totalAmount, 0);
    return {
      total,
      paid,
      outstanding,
      overdue,
      count: filtered.length,
      paidCount: filtered.filter((i) => i.status === 'Paid').length,
      unpaidCount: filtered.filter((i) => i.status === 'Unpaid').length,
      overdueCount: filtered.filter((i) => i.status === 'Overdue').length,
      draftCount: filtered.filter((i) => i.status === 'Draft').length,
    };
  }, [filtered]);

  const byCustomer = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((i) => m.set(i.customerName || '—', (m.get(i.customerName || '—') || 0) + i.totalAmount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const byProduct = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((i) => (i.items || []).forEach((it: any) => m.set(it.description || '—', (m.get(it.description || '—') || 0) + (it.amount || it.quantity * it.unitPrice || 0))));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const series = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((i) => {
      const d = new Date(i.date);
      let key = '';
      if (grouping === 'day') key = d.toISOString().slice(0, 10);
      else if (grouping === 'week') { const wk = new Date(d); wk.setDate(wk.getDate() - ((wk.getDay() + 6) % 7)); key = wk.toISOString().slice(0, 10); }
      else if (grouping === 'month') key = d.toISOString().slice(0, 7);
      else if (grouping === 'quarter') key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      else key = String(d.getFullYear());
      m.set(key, (m.get(key) || 0) + i.totalAmount);
    });
    return [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  }, [filtered, grouping]);

  const maxSeries = Math.max(1, ...series.map((s) => s[1]));

  const exportCSV = () => {
    const headers = 'Period,Invoice Count,Sales,Paid,Outstanding\n';
    const rows = series.map(([k, v]) => `"${k}",${filtered.filter((i) => matchGroup(i.date, k, grouping)).length},${v.toFixed(2)},0,${(v).toFixed(2)}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `BillLah_Report_${tenant.name.replace(/\s+/g, '_')}_${range}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) return;
    const rows = filtered.map((i) => `<tr><td>${i.invoiceNumber}</td><td>${i.customerName}</td><td>${i.date}</td><td>${i.status}</td><td>${fmt(i.totalAmount)}</td></tr>`).join('');
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Business Report</title>
      <style>body{font-family:Inter,system-ui,sans-serif;color:#0b1c30;padding:32px}h1{color:#006a46}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{border:1px solid #bdcac0;padding:8px;text-align:left}.r{text-align:right}.sum{display:flex;gap:24px;margin-top:16px;font-weight:700}</style>
      </head><body>
      <h1>${tenant.name}</h1><h3>Business Report — ${RANGES.find(r => r.key === range)?.label}</h3>
      <p>Generated ${new Date().toLocaleString()}</p>
      <div class="sum"><span>Total Sales: ${fmt(totals.total)}</span><span>Collected: ${fmt(totals.paid)}</span><span>Outstanding: ${fmt(totals.outstanding)}</span></div>
      <table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Status</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table>
      <button onclick="window.print()" style="margin-top:16px;padding:8px 16px;background:#006a46;color:#fff;border:none;border-radius:8px">Print / Save PDF</button>
      </body></html>`);
    win.document.close();
  };

  return (
    <div id="reports-view" className="p-5 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#006a46]" /> Business Report</h2>
          <p className="text-sm text-[#545f73]">What is happening in my business — based on {filtered.length} invoices in range.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="bg-white border border-[#006a46]/30 text-[#006a46] px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-[#eff4ff]"><FileSpreadsheet className="w-4 h-4" /> Export CSV</button>
          <button onClick={exportPDF} className="bg-[#006a46] text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-[#00855a]"><Download className="w-4 h-4" /> Export PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#545f73]"><Calendar className="w-4 h-4" /> Range:</div>
        <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className="bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-1.5 text-sm font-semibold">
          {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#545f73] ml-2"><TrendingUp className="w-4 h-4" /> Group:</div>
        {(['day', 'week', 'month', 'quarter', 'year'] as const).map((g) => (
          <button key={g} onClick={() => setGrouping(g)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${grouping === g ? 'bg-[#006a46] text-white' : 'border border-[#bdcac0] text-[#545f73]'}`}>{g}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Sales" value={fmt(totals.total)} icon={<CreditCard className="w-4 h-4" />} />
        <Stat label="Collected" value={fmt(totals.paid)} icon={<CheckCircle className="w-4 h-4" />} tone="green" />
        <Stat label="Outstanding" value={fmt(totals.outstanding)} icon={<Clock className="w-4 h-4" />} tone="amber" />
        <Stat label="Overdue" value={fmt(totals.overdue)} icon={<AlertTriangle className="w-4 h-4" />} tone="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Mini label="Invoices" value={totals.count} />
        <Mini label="Paid" value={totals.paidCount} />
        <Mini label="Unpaid" value={totals.unpaidCount} />
        <Mini label="Overdue" value={totals.overdueCount} />
        <Mini label="Draft" value={totals.draftCount} />
      </div>

      {/* Trend */}
      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-5">
        <h3 className="font-bold text-base text-[#0b1c30] mb-3">Sales Trend ({grouping})</h3>
        <div className="space-y-2">
          {series.length === 0 && <p className="text-sm text-[#545f73]">No data in selected range.</p>}
          {series.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-20 text-[11px] font-mono text-[#545f73]">{k}</span>
              <div className="flex-1 h-5 bg-[#eff4ff] rounded-full overflow-hidden">
                <div className="h-full bg-[#006a46]" style={{ width: `${(v / maxSeries) * 100}%` }} />
              </div>
              <span className="w-28 text-right text-[11px] font-mono text-[#0b1c30]">{fmt(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-5">
          <h3 className="font-bold text-base text-[#0b1c30] mb-3">Top Customers</h3>
          {byCustomer.length === 0 ? <p className="text-sm text-[#545f73]">No data.</p> : (
            <ul className="space-y-2">
              {byCustomer.map(([c, v]) => (
                <li key={c} className="flex justify-between text-sm"><span className="text-[#0b1c30]">{c}</span><span className="font-mono text-[#006a46]">{fmt(v)}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-5">
          <h3 className="font-bold text-base text-[#0b1c30] mb-3">Top Products</h3>
          {byProduct.length === 0 ? <p className="text-sm text-[#545f73]">No data.</p> : (
            <ul className="space-y-2">
              {byProduct.map(([p, v]) => (
                <li key={p} className="flex justify-between text-sm"><span className="text-[#0b1c30] truncate">{p}</span><span className="font-mono text-[#006a46]">{fmt(v)}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

function matchGroup(dateStr: string, key: string, grouping: string) {
  const d = new Date(dateStr);
  if (grouping === 'day') return d.toISOString().slice(0, 10) === key;
  if (grouping === 'week') { const wk = new Date(d); wk.setDate(wk.getDate() - ((wk.getDay() + 6) % 7)); return wk.toISOString().slice(0, 10) === key; }
  if (grouping === 'month') return d.toISOString().slice(0, 7) === key;
  if (grouping === 'quarter') return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}` === key;
  return String(d.getFullYear()) === key;
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'text-[#006a46]' : tone === 'amber' ? 'text-[#8a4100]' : tone === 'red' ? 'text-[#93000a]' : 'text-[#0b1c30]';
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-1">{icon} {label}</span>
      <div className={`text-xl font-extrabold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#f8f9ff] rounded-xl p-3 border border-[#bdcac0]/40 text-center">
      <div className="text-lg font-extrabold text-[#0b1c30] font-mono">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#545f73]">{label}</div>
    </div>
  );
}
