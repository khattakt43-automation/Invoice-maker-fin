import React, { useEffect, useState } from 'react';
import { MessageSquare, Phone, Lock, CheckCircle2, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { WhatsAppSubscription, WhatsAppAccount, WhatsAppUsage, WhatsAppPlan } from '../types';
import { apiFetch } from "./lib/api";

interface WhatsAppTenantViewProps {
  tenantId: string;
  tenantName: string;
}

/**
 * Tenant → WhatsApp module. Shows only this tenant's own data and
 * entitlement-gated features. Frontend locks mirror the backend
 * hasFeature() check; the server is the source of truth.
 */
export const WhatsAppTenantView: React.FC<WhatsAppTenantViewProps> = ({ tenantId, tenantName }) => {
  const [sub, setSub] = useState<WhatsAppSubscription | null>(null);
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [usage, setUsage] = useState<WhatsAppUsage | null>(null);
  const [plans, setPlans] = useState<WhatsAppPlan[]>([]);
  const [entitlements, setEntitlements] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then((r) => r.json());

  const load = () => {
    api('/api/whatsapp/subscriptions?tenantId=' + tenantId).then((d) => setSub(d.data?.[0] || null));
    api('/api/whatsapp/accounts?tenantId=' + tenantId).then((d) => api('/api/whatsapp/accounts?tenantId=' + tenantId).then((d2) => setAccount(d2.data?.[0] || null)));
    api('/api/whatsapp/usage?tenantId=' + tenantId).then((d) => setUsage(d.data?.[0] || null));
    api('/api/whatsapp/plans').then((d) => setPlans(d.data || []));
    if (sub) {
      // fetch entitlements for the key features to render locked/unlocked UI
      Promise.all(
        ['voice_transcription', 'ai_invoice_generation', 'automation', 'multiple_numbers', 'advanced_analytics'].map((f) =>
          api(`/api/whatsapp/entitlement/${tenantId}?feature=${f}`).then((r) => [f, r.allowed] as const)
        )
      ).then((rows) => setEntitlements(Object.fromEntries(rows)));
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, sub?.planId]);

  const plan = plans.find((p) => p.id === sub?.planId);
  const entitled = (f: string) => entitlements[f] === true;

  const connect = async () => {
    await api(`/api/whatsapp/accounts/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify({ phoneNumber: '+60 12-345 6789', connectionStatus: 'connected', aiEnabled: true, invoiceGenerationEnabled: true, automationEnabled: true, voiceTranscriptionEnabled: true }),
    });
    setMsg('Connecting WhatsApp… (demo connection — real webhook needs credentials)');
    load();
  };

  const flash = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(''), 4000);
  };

  if (!sub || sub.status !== 'active') {
    return (
      <div id="whatsapp-view" className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#006a46]" /> WhatsApp
        </h2>
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#eff4ff] text-[#545f73] flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#0b1c30]">WhatsApp service is not active</h3>
          <p className="text-sm text-[#545f73] max-w-md mx-auto">
            WhatsApp is a paid add-on. Contact your administrator to activate or upgrade WhatsApp for your business.
          </p>
          {sub && (
            <p className="text-xs text-[#8a4100] font-semibold capitalize">Current status: {sub.status}</p>
          )}
          <button
            onClick={() => flash('Request sent to administrator (demo).')}
            className="mx-auto px-4 py-2 rounded-lg bg-[#006a46] text-white text-sm font-semibold"
          >
            Request Activation
          </button>
        </div>
      </div>
    );
  }

  const features: { key: string; label: string }[] = [
    { key: 'ai_invoice_generation', label: 'AI Invoice Generation' },
    { key: 'voice_transcription', label: 'Voice Transcription' },
    { key: 'automation', label: 'Automations' },
    { key: 'multiple_numbers', label: 'Multiple Numbers' },
    { key: 'advanced_analytics', label: 'Advanced Analytics' },
  ];

  return (
    <div id="whatsapp-view" className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#006a46]" /> WhatsApp
        </h2>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#00855a] text-white capitalize">{sub.status}</span>
      </div>

      {msg && <div className="bg-[#eff4ff] border border-[#bdcac0] rounded-lg px-3 py-2 text-xs text-[#0b1c30]">{msg}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account?.connectionStatus === 'connected' ? 'bg-[#00855a]/10 text-[#006a46]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#545f73] uppercase">Connection</div>
            <div className="font-bold text-[#0b1c30] capitalize">{account?.connectionStatus || 'disconnected'}</div>
            {account?.phoneNumber && <div className="text-xs font-mono text-[#545f73]">{account.phoneNumber}</div>}
          </div>
          {account?.connectionStatus !== 'connected' && (
            <button onClick={connect} className="ml-auto px-3 py-1.5 rounded-lg bg-[#006a46] text-white text-xs font-semibold">Connect</button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#545f73] uppercase">Plan</div>
            <div className="font-bold text-[#0b1c30]">{plan?.name || sub.planId}</div>
            <div className="text-xs text-[#545f73]">RM {sub.price}/{sub.billingCycle}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#545f73]">
          <BarChart3 className="w-4 h-4" /> Your Usage
        </div>
        {usage && (
          <div className="grid grid-cols-2 gap-3">
            <UsageBar label="Messages" used={usage.messagesUsed} limit={sub.messageLimit} color="bg-[#006a46]" />
            <UsageBar label="AI Conversations" used={usage.aiConversations} limit={sub.aiLimit} color="bg-[#1a73e8]" />
            <UsageBar label="Voice Minutes" used={Math.round(usage.voiceMinutes)} limit={sub.voiceMinutesLimit} color="bg-[#8a4100]" />
            <UsageBar label="Invoices" used={usage.invoicesGenerated} limit={sub.invoiceLimit} color="bg-[#6a1b9a]" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#545f73]">
          <Activity className="w-4 h-4" /> Features
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((f) => {
            const ok = entitled(f.key);
            return (
              <div key={f.key} className={`flex items-center justify-between rounded-lg border p-3 ${ok ? 'border-[#00855a]/30 bg-[#00855a]/5' : 'border-[#bdcac0] bg-[#f8f9ff]'}`}>
                <span className="text-sm text-[#0b1c30]">{f.label}</span>
                {ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#006a46]" />
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#8a4100]">
                    <Lock className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {!entitled('voice_transcription') && (
          <div className="flex items-center gap-2 text-xs text-[#8a4100] bg-[#ffebd6] rounded-lg p-2">
            <AlertTriangle className="w-4 h-4" /> Voice Transcription is a Premium feature. Upgrade to allow customers to send voice messages.
          </div>
        )}
      </div>

      {/* Conversations + Automations + AI Agent — placeholders wired to same tenant scope */}
      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Conversations</div>
        <div className="text-sm text-[#545f73]">
          {account?.aiEnabled ? 'AI agent is active and processing invoice requests via WhatsApp.' : 'AI agent is currently disabled by your administrator.'}
        </div>
        <div className="text-[11px] text-[#545f73]">
          Inbound text/voice → entitlement check → AI invoice tools → PDF → WhatsApp delivery. Demo mode: connect WhatsApp to enable a live webhook (requires provider credentials).
        </div>
      </div>

      {!sub && (
        <div className="text-center text-sm text-[#545f73]">No active WhatsApp subscription.</div>
      )}
    </div>
  );
};

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = limit > 0 && used >= limit;
  return (
    <div className="bg-[#f8f9ff] rounded-lg p-3 border border-[#bdcac0]/40">
      <div className="flex justify-between text-[11px] text-[#545f73] mb-1">
        <span>{label}</span>
        <span className="font-mono">{used} / {limit}</span>
      </div>
      <div className="h-2 rounded-full bg-[#bdcac0]/40 overflow-hidden">
        <div className={`h-full ${over ? 'bg-[#ba1a1a]' : color}`} style={{ width: `${pct}%` }} />
      </div>
      {over && <div className="text-[10px] text-[#ba1a1a] font-semibold mt-1">Limit reached — upgrade to continue.</div>}
    </div>
  );
}
