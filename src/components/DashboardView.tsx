import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  Receipt,
  Building,
  Edit,
  Eye,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Invoice, Tenant } from '../types';

interface DashboardViewProps {
  tenant: Tenant;
  invoices: Invoice[];
  onCreateInvoice: () => void;
  onViewAllInvoices: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  invoices,
  onCreateInvoice,
  onViewAllInvoices,
  onSelectInvoice,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Dynamic calculations based on invoices
  const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const paidSales = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const unpaidSales = invoices
    .filter((inv) => inv.status === 'Unpaid')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);
  const overdueSales = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);

  const totalSstTax = invoices.reduce((acc, inv) => acc + (inv.taxAmount || 0), 0);
  const collectionRate = totalSales > 0 ? Math.round((paidSales / totalSales) * 100) : 0;

  // Monthly dataset for recharts
  const monthlyData = [
    { period: 'Jul', billed: 18500, collected: 17000, pending: 1500, invoices: 8 },
    { period: 'Aug', billed: 24200, collected: 21800, pending: 2400, invoices: 12 },
    { period: 'Sep', billed: 29800, collected: 26500, pending: 3300, invoices: 14 },
    { period: 'Oct', billed: 38400, collected: 34100, pending: 4300, invoices: 19 },
    { period: 'Nov', billed: 33600, collected: 30200, pending: 3400, invoices: 16 },
    { period: 'Dec', billed: totalSales > 0 ? Math.round(totalSales * 0.45) : 46500, collected: paidSales > 0 ? Math.round(paidSales * 0.45) : 39200, pending: unpaidSales + overdueSales > 0 ? Math.round((unpaidSales + overdueSales) * 0.45) : 7300, invoices: invoices.length || 22 },
  ];

  // Quarterly dataset
  const quarterlyData = [
    { period: 'Q1', billed: 42000, collected: 39500, pending: 2500, invoices: 24 },
    { period: 'Q2', billed: 58500, collected: 52000, pending: 6500, invoices: 32 },
    { period: 'Q3', billed: 72400, collected: 64800, pending: 7600, invoices: 38 },
    { period: 'Q4', billed: totalSales > 0 ? totalSales : 88200, collected: paidSales > 0 ? paidSales : 76400, pending: unpaidSales + overdueSales > 0 ? unpaidSales + overdueSales : 11800, invoices: invoices.length > 0 ? invoices.length : 45 },
  ];

  const trendData = chartPeriod === 'monthly' ? monthlyData : quarterlyData;

  // Status donut data
  const statusPieData = [
    { name: 'Paid', value: paidSales > 0 ? paidSales : 65, count: invoices.filter(i => i.status === 'Paid').length || 4, color: '#00855a' },
    { name: 'Unpaid', value: unpaidSales > 0 ? unpaidSales : 25, count: invoices.filter(i => i.status === 'Unpaid').length || 2, color: '#ba1a1a' },
    { name: 'Overdue', value: overdueSales > 0 ? overdueSales : 10, count: invoices.filter(i => i.status === 'Overdue').length || 1, color: '#d97706' },
  ].filter(d => d.value > 0);

  // Group top customers by billing
  const customerMap = new Map<string, { name: string; total: number; count: number }>();
  invoices.forEach(inv => {
    const existing = customerMap.get(inv.customerName) || { name: inv.customerName, total: 0, count: 0 };
    existing.total += inv.totalAmount;
    existing.count += 1;
    customerMap.set(inv.customerName, existing);
  });

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  // Custom Tooltip for Recharts
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111c2d] text-white p-3.5 rounded-xl shadow-xl border border-[#bdcac0]/30 text-xs space-y-1.5 min-w-[170px] z-50">
          <p className="font-bold text-[#8bf8c2] border-b border-white/10 pb-1 flex items-center justify-between">
            <span>Period: {label}</span>
            <span className="text-[10px] font-mono text-white/70">MYR</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="capitalize">{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                RM {entry.value?.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalSales > 0 ? Math.round((data.value / totalSales) * 100) : 0;
      return (
        <div className="bg-[#111c2d] text-white p-3 rounded-xl shadow-xl border border-[#bdcac0]/30 text-xs space-y-1 z-50">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
            <span>{data.name} Status</span>
          </div>
          <p className="font-mono font-bold text-white text-sm">
            RM {data.value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-300">
            {percent}% of total • {data.payload.count} invoices
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dashboard-view" className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#0b1c30]">
              {tenant.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00855a]/15 text-[#006a46] border border-[#00855a]/20">
              Active FY
            </span>
          </div>
          <p className="text-sm lg:text-base text-[#545f73] mt-1">
            Financial Health & Real-time SST Ledger • SST ID: <span className="font-mono font-bold text-[#0b1c30]">{tenant.sstId}</span>
          </p>
        </div>
        <button
          id="dashboard-create-invoice-btn"
          onClick={onCreateInvoice}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Total Billed</span>
            <div className="p-2 rounded-lg bg-[#00855a]/10 text-[#006a46] group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs font-medium text-[#545f73]">RM</span>
              <span className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">
                {totalSales.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#006a46] font-medium mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs last FY</span>
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Collected (Paid)</span>
            <div className="p-2 rounded-lg bg-[#00855a]/10 text-[#00855a] group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs font-medium text-[#545f73]">RM</span>
              <span className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">
                {paidSales.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#545f73] mt-1">
              <span>{collectionRate}% collection rate</span>
              <span className="text-[#006a46] font-semibold">Healthy</span>
            </div>
          </div>
        </div>

        {/* Unpaid */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Pending Payment</span>
            <div className="p-2 rounded-lg bg-[#ffdad6] text-[#ba1a1a] group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs font-medium text-[#545f73]">RM</span>
              <span className="text-2xl lg:text-3xl font-bold text-[#ba1a1a] tracking-tight">
                {unpaidSales.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-[11px] text-[#545f73] mt-1">Active invoices awaiting settlement</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-2xl p-5 border border-[#bdcac0]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#545f73]">Overdue</span>
            <div className="p-2 rounded-lg bg-[#ffebd6] text-[#8a4100] group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs font-medium text-[#545f73]">RM</span>
              <span className="text-2xl lg:text-3xl font-bold text-[#8a4100] tracking-tight">
                {overdueSales.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-[11px] text-[#8a4100] font-medium mt-1">Follow-up reminder recommended</p>
          </div>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Sales Velocity & Cashflow Graph */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between space-y-4">
          {/* Chart Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-[#bdcac0]/30">
            <div>
              <h3 className="font-bold text-lg text-[#0b1c30] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#006a46]" />
                <span>Revenue & Invoicing Trend</span>
              </h3>
              <p className="text-xs text-[#545f73]">
                Cumulative billing volume, collected cashflow, and outstanding amounts (MYR)
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              {/* Area / Bar Chart Type Switch */}
              <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#bdcac0]/40 text-xs font-semibold">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-[#006a46] text-white shadow-xs'
                      : 'text-[#545f73] hover:text-[#0b1c30]'
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-[#006a46] text-white shadow-xs'
                      : 'text-[#545f73] hover:text-[#0b1c30]'
                  }`}
                >
                  Bars
                </button>
              </div>

              {/* Monthly / Quarterly Period Switch */}
              <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#bdcac0]/40 text-xs font-semibold">
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartPeriod === 'monthly'
                      ? 'bg-white text-[#006a46] shadow-xs'
                      : 'text-[#545f73] hover:text-[#0b1c30]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setChartPeriod('quarterly')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartPeriod === 'quarterly'
                      ? 'bg-white text-[#006a46] shadow-xs'
                      : 'text-[#545f73] hover:text-[#0b1c30]'
                  }`}
                >
                  Quarterly
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Graph Container */}
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006a46" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#006a46" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00855a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00855a" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `RM ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    name="Total Billed"
                    stroke="#006a46"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorBilled)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="#00855a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCollected)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `RM ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar dataKey="billed" name="Total Billed" fill="#006a46" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="collected" name="Collected" fill="#00855a" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="pending" name="Pending" fill="#ffdad6" stroke="#ba1a1a" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Graph Footer Metric Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#bdcac0]/30 text-center">
            <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#bdcac0]/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#545f73] block">Average Ticket</span>
              <span className="font-mono text-sm font-bold text-[#0b1c30]">
                RM {invoices.length > 0 ? (totalSales / invoices.length).toLocaleString('en-MY', { maximumFractionDigits: 0 }) : '0'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#bdcac0]/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#545f73] block">SST 8% Collected</span>
              <span className="font-mono text-sm font-bold text-[#006a46]">
                RM {totalSstTax.toLocaleString('en-MY', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#bdcac0]/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#545f73] block">Total Invoices</span>
              <span className="font-mono text-sm font-bold text-[#0b1c30]">
                {invoices.length} Issued
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Status Donut Chart & Aging Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#bdcac0]/30">
            <div>
              <h3 className="font-bold text-lg text-[#0b1c30] flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#006a46]" />
                <span>Collection Status</span>
              </h3>
              <p className="text-xs text-[#545f73]">Real-time invoice settlement distribution</p>
            </div>
          </div>

          {/* Donut Chart with Centered KPI */}
          <div className="relative w-full h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#ffffff" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Badge in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase text-[#545f73]">Settlement</span>
              <span className="text-xl font-bold font-mono text-[#006a46]">{collectionRate}%</span>
              <span className="text-[9px] text-[#545f73] font-medium">Efficiency</span>
            </div>
          </div>

          {/* Status Breakdown Legend & Amounts */}
          <div className="space-y-2 pt-1 border-t border-[#bdcac0]/30">
            {statusPieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0]/30 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-[#0b1c30]">{item.name}</span>
                  <span className="text-[10px] text-[#545f73]">({item.count})</span>
                </div>
                <span className="font-mono font-bold text-[#0b1c30]">
                  RM {item.value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Customers & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Accounts Ranking (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#bdcac0]/30">
            <div>
              <h3 className="font-bold text-base text-[#0b1c30] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#006a46]" />
                <span>Top Customer Accounts</span>
              </h3>
              <p className="text-xs text-[#545f73]">Highest cumulative billed accounts</p>
            </div>
          </div>

          <div className="space-y-3">
            {topCustomers.length === 0 ? (
              <p className="text-xs text-[#545f73] py-4 text-center">No customer transactions logged yet.</p>
            ) : (
              topCustomers.map((cust, idx) => {
                const percentage = totalSales > 0 ? Math.round((cust.total / totalSales) * 100) : 0;
                return (
                  <div key={cust.name} className="space-y-1 p-2.5 rounded-xl hover:bg-[#eff4ff]/60 transition-colors border border-[#bdcac0]/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#0b1c30] truncate max-w-[180px]">
                        {idx + 1}. {cust.name}
                      </span>
                      <span className="font-mono font-bold text-[#006a46]">
                        RM {cust.total.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    {/* Progress meter */}
                    <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#006a46] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#545f73]">
                      <span>{cust.count} invoices</span>
                      <span>{percentage}% of volume</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Invoices Table (8 Cols) with Direct Edit and View Actions */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#bdcac0]/60 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#bdcac0]/30">
            <div>
              <h3 className="font-bold text-lg text-[#0b1c30]">Recent Tax Invoices</h3>
              <p className="text-xs text-[#545f73]">Malaysian SST compliant invoices ready for editing, PDF, or dispatch</p>
            </div>
            <button
              onClick={onViewAllInvoices}
              className="text-xs font-semibold text-[#006a46] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({invoices.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#bdcac0]/50 text-xs font-semibold tracking-wider text-[#545f73] uppercase bg-[#eff4ff]/50">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#bdcac0]/30">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#545f73]">
                      No invoices recorded yet. Click "Create Invoice" to generate one.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 5).map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-[#eff4ff] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-mono font-medium text-xs text-[#006a46] group-hover:underline">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#0b1c30] max-w-[180px] truncate">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#545f73] whitespace-nowrap font-mono">
                        {inv.date}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-[#0b1c30]">
                        RM {inv.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
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
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
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
                            title="View Invoice"
                            className="p-1.5 text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
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
      </div>
    </div>
  );
};
