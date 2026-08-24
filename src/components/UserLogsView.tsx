import React, { useEffect, useState } from 'react';
import { History, Activity, Download, Filter } from 'lucide-react';
import { AppActivityLog } from '../types';

interface UserLogsViewProps {
  tenantId: string;
  actor?: string;
}

/**
 * User Logs — replaces the old "Changes Made" view.
 * Shows relevant user activity/actions in the system (Point 9).
 * NOTE: The CHANGES.md file remains Hermes's internal change-tracking doc;
 * this view is the user-facing activity log fed by the server API.
 */
export const UserLogsView: React.FC<UserLogsViewProps> = ({ tenantId, actor }) => {
  console.log('[UserLogsView] RENDER tenantId=', tenantId, 'actor=', actor);
  const [logs, setLogs] = useState<AppActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'info' | 'warning' | 'error'>('all');

  const load = () => {
    fetch(`/api/activity-logs?tenantId=${encodeURIComponent(tenantId)}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.data || []))
      .catch(() => setLogs([]));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [tenantId]);

  const severityColor: Record<string, string> = {
    success: 'bg-[#00855a]/10 text-[#006a46] border-[#00855a]/30',
    info: 'bg-[#eff4ff] text-[#545f73] border-[#bdcac0]',
    warning: 'bg-[#ffebd6] text-[#8a4100] border-[#ffebd6]',
    error: 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]',
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.severity === filter);

  const exportCsv = () => {
    const header = 'timestamp,actor,action,detail,severity\n';
    const rows = logs
      .map((l) => `${l.timestamp},${l.actor},${l.action},"${l.detail}",${l.severity}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-logs-${tenantId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="user-logs-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
            <History className="w-5 h-5 text-[#006a46]" /> User Logs
          </h2>
          <p className="text-xs text-[#545f73] mt-1">
            Recent activity and actions performed in this workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#eff4ff] rounded-lg p-1">
            {(['all', 'success', 'info', 'warning', 'error'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                  filter === f ? 'bg-[#006a46] text-white' : 'text-[#545f73] hover:text-[#006a46]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#006a46] text-white text-xs font-semibold hover:bg-[#00855a] transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#bdcac0]/60 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#bdcac0]/40 bg-[#f8f9ff]">
          <Activity className="w-4 h-4 text-[#006a46]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#545f73] text-sm">No activity recorded yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9ff] text-[#545f73] uppercase text-[10px] border-b border-[#bdcac0]/40">
              <tr>
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Actor</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">Detail</th>
                <th className="py-2 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcac0]/30 font-mono">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[#eff4ff]/60">
                  <td className="py-2 px-4 text-[#545f73]">
                    {new Date(l.timestamp).toLocaleString('en-MY')}
                  </td>
                  <td className="py-2 px-4 text-[#0b1c30] font-semibold">{l.actor}</td>
                  <td className="py-2 px-4 text-[#006a46]">{l.action}</td>
                  <td className="py-2 px-4 text-[#0b1c30]">{l.detail}</td>
                  <td className="py-2 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${severityColor[l.severity] || severityColor.info}`}>
                      {l.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
