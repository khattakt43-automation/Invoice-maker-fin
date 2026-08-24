import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Phone,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  BarChart3,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  Settings2,
  Activity,
  Info,
} from 'lucide-react';
import {
  WhatsAppPlan,
  WhatsAppSubscription,
  WhatsAppAccount,
  WhatsAppUsage,
  WhatsAppOverride,
  WhatsAppAuditLog,
  Tenant,
  ServiceStatus,
} from '../types';

interface WhatsAppAdminViewProps {
  tenants: Tenant[];
  currentTenantId: string;
  onToast?: (msg: string) => void;
}

/**
 * Admin → WhatsApp — central monetizable control module.
 * Master enable/disable/suspend, plans & pricing, usage, overrides, audit.
 * All protected operations resolve through the entitlement service (server side).
 */
export const WhatsAppAdminView: React.FC<WhatsAppAdminViewProps> = ({
  tenants,
  currentTenantId,
  onToast,
}) => {
  const [tab, setTab] = useState<'overview' | 'plans' | 'tenants' | 'usage' | 'audit'>('overview');
  const [plans, setPlans] = useState<WhatsAppPlan[]>([]);
  const [subs, setSubs] = useState<WhatsAppSubscription[]>([]);
  const [accounts, setAccounts] = useState<Record<string, WhatsAppAccount>>({});
  const [usages, setUsages] = useState<WhatsAppUsage[]>([]);
  const [overrides, setOverrides] = useState<WhatsAppOverride[]>([]);
  const [audit, setAudit] = useState<WhatsAppAuditLog[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>(currentTenantId);

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then((r) => r.json());

  const loadAll = () => {
    api('/api/whatsapp/plans').then((d) => setPlans(d.data || []));
    api('/api/whatsapp/subscriptions').then((d) => setSubs(d.data || []));
    api('/api/whatsapp/usage').then((d) => setUsages(d.data || []));
    api('/api/whatsapp/overrides').then((d) => setOverrides(d.data || []));
    api('/api/whatsapp/audit').then((d) => setAudit(d.data || []));
    Promise.all(
      tenants.map((t) => api(`/api/whatsapp/accounts?tenantId=${t.id}`).then((d) => [t.id, d.data?.[0]] as const))
    ).then((rows) => setAccounts(Object.fromEntries(rows.filter(([, a]) => a))));
  };

  useEffect(() => {
    loadAll();
  }, [tenants]);

  const curSub = subs.find((s) => s.tenantId === selectedTenant);
  const curPlan = plans.find((p) => p.id === curSub?.planId);
  const curAccount = accounts[selectedTenant];

  const patchSub = async (patch: Partial<WhatsAppSubscription>) => {
    await api(`/api/whatsapp/subscriptions/${selectedTenant}`, { method: 'PATCH', body: JSON.stringify(patch) });
    onToast?.('Subscription updated');
    loadAll();
  };

  const activatePlan = async (planId: string) => {
    await api('/api/whatsapp/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ tenantId: selectedTenant, planId }),
    });
    onToast?.('Plan activated for tenant');
    loadAll();
  };

  const patchAccount = async (patch: Partial<WhatsAppAccount>) => {
    await api(`/api/whatsapp/accounts/${selectedTenant}`, { method: 'PUT', body: JSON.stringify(patch) });
    onToast?.('Account updated');
    loadAll();
  };

  const grantFeature = async (feature: string, granted: boolean, expiry?: string) => {
    await api('/api/whatsapp/overrides', {
      method: 'POST',
      body: JSON.stringify({ tenantId: selectedTenant, feature, granted, adminActor: 'Super Admin', expiry }),
    });
    onToast?.(`${feature} ${granted ? 'granted' : 'revoked'}`);
    loadAll();
  };

  const savePlan = async (plan: WhatsAppPlan) => {
    if (plans.find((p) => p.id === plan.id)) {
      await api(`/api/whatsapp/plans/${plan.id}`, { method: 'PATCH', body: JSON.stringify(plan) });
    } else {
      await api('/api/whatsapp/plans', { method: 'POST', body: JSON.stringify(plan) });
    }
    onToast?.('Plan saved');
    loadAll();
  };

  const tierColor: Record<string, string> = {
    basic: 'bg-[#00855a]/10 text-[#006a46]',
    standard: 'bg-[#1a73e8]/10 text-[#1a73e8]',
    premium: 'bg-[#8a4100]/10 text-[#8a4100]',
    custom: 'bg-[#6a1b9a]/10 text-[#6a1b9a]',
  };

  const statusPill = (status?: ServiceStatus) => {
    const map: Record<string, string> = {
      active: 'bg-[#00855a] text-white',
      suspended: 'bg-[#93000a] text-white',
      disconnected: 'bg-[#545f73] text-white',
      expired: 'bg-[#8a4100] text-white',
      'connection error': 'bg-[#ba1a1a] text-white',
      'not subscribed': 'bg-[#eff4ff] text-[#545f73]',
      pending: 'bg-[#ffebd6] text-[#8a4100]',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[status || ''] || map['not subscribed']}`}>
        {status || 'not subscribed'}
      </span>
    );
  };

  const mrr = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.price || 0), 0);

  const tenantUsage = (tid: string) => usages.find((u) => u.tenantId === tid);

  return (
    <div id="admin-whatsapp-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#006a46]" /> WhatsApp — Monetization Control
        </h2>
        <div className="flex items-center gap-1 bg-[#eff4ff] rounded-lg p-1">
          {(['overview', 'plans', 'tenants', 'usage', 'requests', 'audit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'bg-[#006a46] text-white' : 'text-[#545f73] hover:text-[#006a46]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric icon={<DollarSign className="w-4 h-4" />} label="MRR (Active)" value={`RM ${mrr.toLocaleString()}`} />
            <Metric icon={<ShieldCheck className="w-4 h-4" />} label="Active" value={String(subs.filter((s) => s.status === 'active').length)} />
            <Metric icon={<ShieldOff className="w-4 h-4" />} label="Suspended" value={String(subs.filter((s) => s.status === 'suspended').length)} />
            <Metric icon={<Phone className="w-4 h-4" />} label="Connected" value={String(Object.values(accounts).filter((a) => a?.connectionStatus === 'connected').length)} />
          </div>

          <div className="bg-white rounded-xl border border-[#bdcac0]/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#bdcac0]/40 bg-[#f8f9ff] text-xs font-bold uppercase tracking-wider text-[#545f73]">
              Tenant Connections
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9ff] text-[#545f73] uppercase text-[10px] border-b border-[#bdcac0]/40">
                <tr>
                  <th className="py-2 px-4">Tenant</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Plan</th>
                  <th className="py-2 px-4">AI</th>
                  <th className="py-2 px-4">Invoicing</th>
                  <th className="py-2 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bdcac0]/30">
                {tenants.map((t) => {
                  const s = subs.find((x) => x.tenantId === t.id);
                  const a = accounts[t.id];
                  const p = plans.find((x) => x.id === s?.planId);
                  return (
                    <tr key={t.id} className="hover:bg-[#eff4ff]/50">
                      <td className="py-2 px-4 font-semibold text-[#0b1c30]">{t.name}</td>
                      <td className="py-2 px-4">{statusPill(s?.status as ServiceStatus)}</td>
                      <td className="py-2 px-4">{p?.name || '—'}</td>
                      <td className="py-2 px-4">{a?.aiEnabled ? '✅' : '⛔'}</td>
                      <td className="py-2 px-4">{a?.invoiceGenerationEnabled ? '✅' : '⛔'}</td>
                      <td className="py-2 px-4 text-[#545f73]">{a?.lastActivity ? new Date(a.lastActivity).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <PlansEditor plans={plans} onSave={savePlan} />
      )}

      {tab === 'tenants' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 space-y-4">
            <label className="block text-xs font-bold uppercase text-[#545f73]">Operating on tenant</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <Btn label={curSub?.status === 'active' ? 'Suspend' : 'Activate'} onClick={() => patchSub({ status: curSub?.status === 'active' ? 'suspended' : 'active' })} />
              <Btn label="Reconnect" onClick={() => patchAccount({ connectionStatus: 'connected' })} />
              <Btn label="Disconnect" onClick={() => patchAccount({ connectionStatus: 'disconnected' })} />
              <Btn label={curAccount?.aiEnabled ? 'Disable AI' : 'Enable AI'} onClick={() => patchAccount({ aiEnabled: !curAccount?.aiEnabled })} />
              <Btn label={curAccount?.invoiceGenerationEnabled ? 'Disable Invoicing' : 'Enable Invoicing'} onClick={() => patchAccount({ invoiceGenerationEnabled: !curAccount?.invoiceGenerationEnabled })} />
              <Btn label={curAccount?.automationEnabled ? 'Disable Automations' : 'Enable Automations'} onClick={() => patchAccount({ automationEnabled: !curAccount?.automationEnabled })} />
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold uppercase text-[#545f73] mb-1">Activate / Change Plan</p>
              <div className="flex flex-wrap gap-2">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => activatePlan(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${curPlan?.id === p.id ? 'bg-[#006a46] text-white border-[#006a46]' : 'border-[#bdcac0] text-[#0b1c30] hover:bg-[#eff4ff]'}`}
                  >
                    {p.name} (RM {p.monthlyPrice})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold uppercase text-[#545f73] mb-1">Feature Overrides</p>
              <div className="flex flex-wrap gap-2">
                {(['voice_transcription', 'ai_invoice_generation', 'automation', 'multiple_numbers', 'advanced_analytics'] as const).map((f) => {
                  const ov = overrides.find((o) => o.tenantId === selectedTenant && o.feature === f);
                  return (
                    <button
                      key={f}
                      onClick={() => grantFeature(f, !ov?.granted, ov?.granted ? undefined : new Date(Date.now() + 14 * 864e5).toISOString())}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#bdcac0] text-[#0b1c30] hover:bg-[#eff4ff]"
                      title={`Granted manually: ${ov?.granted ? 'yes' : 'no'}`}
                    >
                      {f.replace(/_/g, ' ')} {ov?.granted ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'usage' && (
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#bdcac0]/40 bg-[#f8f9ff] text-xs font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Usage by Tenant
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9ff] text-[#545f73] uppercase text-[10px] border-b border-[#bdcac0]/40">
              <tr>
                <th className="py-2 px-4">Tenant</th>
                <th className="py-2 px-4">Messages</th>
                <th className="py-2 px-4">AI Conv.</th>
                <th className="py-2 px-4">Voice (min)</th>
                <th className="py-2 px-4">Invoices</th>
                <th className="py-2 px-4">Automations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcac0]/30">
              {tenants.map((t) => {
                const u = tenantUsage(t.id);
                const s = subs.find((x) => x.tenantId === t.id);
                return (
                  <tr key={t.id}>
                    <td className="py-2 px-4 font-semibold text-[#0b1c30]">{t.name}</td>
                    <td className="py-2 px-4 font-mono">{u?.messagesUsed ?? 0} / {s?.messageLimit ?? '—'}</td>
                    <td className="py-2 px-4 font-mono">{u?.aiConversations ?? 0} / {s?.aiLimit ?? '—'}</td>
                    <td className="py-2 px-4 font-mono">{Math.round(u?.voiceMinutes ?? 0)} / {s?.voiceMinutesLimit ?? '—'}</td>
                    <td className="py-2 px-4 font-mono">{u?.invoicesGenerated ?? 0} / {s?.invoiceLimit ?? '—'}</td>
                    <td className="py-2 px-4 font-mono">{u?.automations ?? 0} / {s?.automationLimit ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'requests' && (
        <UpgradeRequestsTab tenantNameById={Object.fromEntries(tenants.map((t) => [t.id, t.name]))} />
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#bdcac0]/40 bg-[#f8f9ff] text-xs font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-2">
            <Activity className="w-4 h-4" /> Audit Logs
          </div>
          {audit.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#545f73]">No audit events yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9ff] text-[#545f73] uppercase text-[10px] border-b border-[#bdcac0]/40">
                <tr>
                  <th className="py-2 px-4">Time</th>
                  <th className="py-2 px-4">Tenant</th>
                  <th className="py-2 px-4">Actor</th>
                  <th className="py-2 px-4">Action</th>
                  <th className="py-2 px-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bdcac0]/30 font-mono">
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 px-4 text-[#545f73]">{new Date(a.timestamp).toLocaleString('en-MY')}</td>
                    <td className="py-2 px-4">{a.tenantId}</td>
                    <td className="py-2 px-4">{a.actor}</td>
                    <td className="py-2 px-4 text-[#006a46]">{a.action}</td>
                    <td className="py-2 px-4 text-[#0b1c30]">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[11px] text-[#545f73] uppercase tracking-wider">{label}</div>
        <div className="font-mono text-lg font-bold text-[#0b1c30]">{value}</div>
      </div>
    </div>
  );
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg bg-[#006a46] text-white text-xs font-semibold hover:bg-[#00855a] transition-colors"
    >
      {label}
    </button>
  );
}

function PlansEditor({ plans, onSave }: { plans: WhatsAppPlan[]; onSave: (p: WhatsAppPlan) => void }) {
  const [editing, setEditing] = useState<WhatsAppPlan | null>(null);

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 space-y-3 max-w-xl">
        <input
          className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-3 py-2 text-sm font-bold"
          value={editing.name}
          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          placeholder="Plan name"
        />
        <div className="grid grid-cols-2 gap-3">
          <Num label="Monthly Price (RM)" v={editing.monthlyPrice} onChange={(n) => setEditing({ ...editing, monthlyPrice: n })} />
          <Num label="Yearly Price (RM)" v={editing.yearlyPrice} onChange={(n) => setEditing({ ...editing, yearlyPrice: n })} />
          <Num label="Message Limit" v={editing.messageLimit} onChange={(n) => setEditing({ ...editing, messageLimit: n })} hint="Total WhatsApp messages (inbound + outbound) this tenant may send/receive per billing period." />
          <Num label="AI Limit" v={editing.aiLimit} onChange={(n) => setEditing({ ...editing, aiLimit: n })} hint="Number of AI-powered conversations (e.g. invoice-from-text) allowed per billing period." />
          <Num label="Voice Min Limit" v={editing.voiceMinutesLimit} onChange={(n) => setEditing({ ...editing, voiceMinutesLimit: n })} hint="Maximum minutes of customer voice messages that can be transcribed per billing period. One-way (customer → system); the system does not send voice replies. When the limit is reached, transcription is paused until the next period." />
          <Num label="Invoice Limit" v={editing.invoiceLimit} onChange={(n) => setEditing({ ...editing, invoiceLimit: n })} hint="Maximum invoices the tenant can generate per billing period." />
          <Num label="Automation Limit" v={editing.automationLimit} onChange={(n) => setEditing({ ...editing, automationLimit: n })} hint="Maximum automated workflows/actions (reminders, follow-ups, triggers) this tenant can run during the selected billing period. When reached, further automations are queued/blocked until reset." />
          <Num label="Max Numbers" v={editing.maxNumbers} onChange={(n) => setEditing({ ...editing, maxNumbers: n })} hint="Maximum number of WhatsApp phone numbers / connections this plan allows the tenant to register and operate simultaneously." />
        </div>
        <div className="flex flex-wrap gap-2">
          {FEATURE_KEYS.map((f) => {
            const on = editing.features.includes(f);
            return (
              <button
                key={f}
                onClick={() =>
                  setEditing({
                    ...editing,
                    features: on ? editing.features.filter((x) => x !== f) : [...editing.features, f],
                  })
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${on ? 'bg-[#006a46] text-white border-[#006a46]' : 'border-[#bdcac0] text-[#545f73]'}`}
              >
                {f.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { onSave(editing); setEditing(null); }} className="px-4 py-2 rounded-lg bg-[#006a46] text-white text-xs font-semibold">Save</button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-[#bdcac0] text-xs font-semibold">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-[#0b1c30]">{p.name}</div>
            <div className="text-xs text-[#545f73]">RM {p.monthlyPrice}/mo · {p.messageLimit} msgs · {p.features.length} features</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing({ ...p })} className="px-3 py-1.5 rounded-lg border border-[#bdcac0] text-xs font-semibold hover:bg-[#eff4ff]">Edit</button>
            <button onClick={() => onSave(p)} className="px-3 py-1.5 rounded-lg bg-[#006a46] text-white text-xs font-semibold">Save</button>
          </div>
        </div>
      ))}
      <button
        onClick={() =>
          setEditing({
            id: `wa-${Date.now()}`,
            name: 'New Plan',
            tier: 'custom',
            monthlyPrice: 0,
            yearlyPrice: 0,
            messageLimit: 0,
            aiLimit: 0,
            voiceMinutesLimit: 0,
            invoiceLimit: 0,
            automationLimit: 0,
            maxNumbers: 1,
            features: [],
            active: true,
          })
        }
        className="px-4 py-2 rounded-lg border border-dashed border-[#006a46] text-[#006a46] text-xs font-semibold"
      >
        + New Plan
      </button>
    </div>
  );
}

const FEATURE_KEYS = [
  'whatsapp_text',
  'ai_invoice_generation',
  'invoice_pdf_generation',
  'whatsapp_invoice_delivery',
  'customer_lookup',
  'customer_creation',
  'payment_reminders',
  'automation',
  'advanced_automation',
  'ai_customer_support',
  'voice_transcription',
  'multiple_numbers',
  'advanced_ai_agents',
  'custom_ai_instructions',
  'advanced_analytics',
  'human_handoff',
];

function Num({ label, v, onChange, hint }: { label: string; v: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <label className="block relative">
      <span className="flex items-center gap-1 text-[11px] text-[#545f73]">
        {label}
        {hint && (
          <span
            className="cursor-help text-[#006a46]"
            title={hint}
            aria-label={hint}
          >
            <Info className="w-3 h-3" />
          </span>
        )}
      </span>
      <input
        type="number"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-2 py-1.5 text-sm font-mono"
      />
      {hint && <p className="mt-1 text-[10px] leading-snug text-[#545f73]">{hint}</p>}
    </label>
  );
}

function UpgradeRequestsTab({ tenantNameById }: { tenantNameById: Record<string, string> }) {
  const [reqs, setReqs] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetch('/api/upgrade-requests').then((r) => r.json()).then((d) => setReqs(d.data || []));
  useEffect(() => { load(); }, []);
  const api = (url: string, opts?: RequestInit) => fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then((r) => r.json());

  const act = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(id);
    await api(`/api/upgrade-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
    setBusy(null);
  };

  return (
    <div className="bg-white rounded-xl border border-[#bdcac0]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#bdcac0]/40 bg-[#f8f9ff] text-xs font-bold uppercase tracking-wider text-[#545f73] flex items-center gap-2">
        <Activity className="w-4 h-4" /> Plan Upgrade Requests
      </div>
      {reqs.length === 0 ? (
        <div className="p-6 text-center text-sm text-[#545f73]">No upgrade requests yet.</div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8f9ff] text-[#545f73] uppercase text-[10px] border-b border-[#bdcac0]/40">
            <tr>
              <th className="py-2 px-4">Ref</th>
              <th className="py-2 px-4">Tenant</th>
              <th className="py-2 px-4">Plan</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#bdcac0]/30">
            {reqs.map((r) => (
              <tr key={r.id}>
                <td className="py-2 px-4 font-mono text-[#0b1c30]">{r.reference}</td>
                <td className="py-2 px-4">{tenantNameById[r.tenantId] || r.tenantId}</td>
                <td className="py-2 px-4">{r.requestedPlanName || r.requestedPlanId || '—'}</td>
                <td className="py-2 px-4 font-mono">{r.currency || 'RM'} {r.amount ?? '—'}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.status === 'approved' ? 'bg-[#00855a] text-white' : r.status === 'rejected' ? 'bg-[#93000a] text-white' : 'bg-[#ffebd6] text-[#8a4100]'
                  }`}>{r.status}</span>
                </td>
                <td className="py-2 px-4">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button disabled={busy === r.id} onClick={() => act(r.id, 'approved')} className="px-2.5 py-1 rounded-lg bg-[#006a46] text-white text-[11px] font-semibold disabled:opacity-40">Approve</button>
                      <button disabled={busy === r.id} onClick={() => act(r.id, 'rejected')} className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold disabled:opacity-40">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
