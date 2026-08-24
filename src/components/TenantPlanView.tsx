import React, { useEffect, useState } from 'react';
import {
  Check,
  CreditCard,
  Upload,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Tenant } from '../types';
import { apiFetch } from "./lib/api";

interface TenantPlanViewProps {
  tenant: Tenant;
  onToast?: (msg: string) => void;
}

/**
 * Tenant-facing Plan / Subscription centre (spec points 21-39).
 * Shows current plan + usage, available upgrade plans (from admin config),
 * admin bank/QR payment details, and a payment-submission + verification flow.
 * Voice is one-way (customer -> transcription); no voice response is offered.
 */
export const TenantPlanView: React.FC<TenantPlanViewProps> = ({ tenant, onToast }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [txnId, setTxnId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofName, setProofName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then((r) => r.json());

  useEffect(() => {
    api('/api/whatsapp/plans').then((d) => setPlans(d.data || []));
    api('/api/payment-settings').then((d) => setSettings(d.data || {}));
    api(`/api/whatsapp/subscriptions?tenantId=${tenant.id}`).then((d) => setSub(d.data?.[0] || null));
    api(`/api/whatsapp/usage?tenantId=${tenant.id}`).then((d) => setUsage(d.data?.[0] || null));
  }, [tenant.id]);

  const currentPlan = plans.find((p) => p.id === sub?.planId);

  const submitPayment = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    setStatus('pending');
    await api('/api/upgrade-requests', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: tenant.id,
        tenantName: tenant.name,
        requestedPlanId: selectedPlan.id,
        requestedPlanName: selectedPlan.name,
        amount: Number(amount) || selectedPlan.monthlyPrice,
        currency: 'RM',
        transactionId: txnId,
        paymentDate: date,
        paymentProof: proofName,
        status: 'pending',
      }),
    });
    setSubmitting(false);
    onToast?.('Payment submitted — awaiting admin verification');
  };

  return (
    <div id="tenant-plan-view" className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-[#0b1c30]">My Plan &amp; Subscription</h2>

      {status && (
        <div className={`rounded-xl border p-4 text-sm font-semibold ${
          status === 'approved' ? 'bg-[#00855a]/10 text-[#006a46] border-[#00855a]/30'
            : status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-[#ffebd6] text-[#8a4100] border-[#fdba74]'
        }`}>
          {status === 'pending' && 'Payment submitted. Your upgrade will activate once the admin verifies the payment.'}
          {status === 'approved' && 'Upgrade approved — your new plan is now active.'}
          {status === 'rejected' && 'Payment was rejected. Please contact support.'}
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] mb-1">Current Plan</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-[#0b1c30]">{currentPlan?.name || sub?.planId || 'Free'}</span>
          <span className="text-sm text-[#545f73]">RM {currentPlan?.monthlyPrice ?? sub?.price ?? 0} / month</span>
        </div>
        {sub && usage && currentPlan && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Usage label="WhatsApp" used={usage.messagesUsed ?? 0} limit={sub.messageLimit} />
            <Usage label="Automations" used={usage.automations ?? 0} limit={sub.automationLimit} />
            <Usage label="Voice (min)" used={Math.round(usage.voiceMinutes ?? 0)} limit={sub.voiceMinutesLimit} />
            <Usage label="Invoices" used={usage.invoicesGenerated ?? 0} limit={sub.invoiceLimit} />
          </div>
        )}
        <p className="mt-3 text-[11px] text-[#545f73]">
          Voice is one-way: customers can send voice messages that the system transcribes. The system does not send voice replies.
        </p>
      </div>

      {/* Available plans */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] mb-2">Available Upgrades</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 ${selectedPlan?.id === p.id ? 'border-[#006a46] ring-2 ring-[#006a46]/20' : 'border-[#bdcac0]/60'}`}>
              <div className="font-bold text-[#0b1c30]">{p.name}</div>
              <div className="text-lg font-extrabold text-[#006a46]">RM {p.monthlyPrice}<span className="text-xs font-normal text-[#545f73]">/mo</span></div>
              <ul className="mt-2 text-[11px] text-[#545f73] space-y-1">
                <li>· {p.messageLimit} messages</li>
                <li>· {p.automationLimit} automations</li>
                <li>· {p.voiceMinutesLimit} voice min</li>
                <li>· {p.maxNumbers} number(s)</li>
              </ul>
              <button
                onClick={() => { setSelectedPlan(p); setAmount(String(p.monthlyPrice)); }}
                className={`mt-3 w-full px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedPlan?.id === p.id ? 'bg-[#006a46] text-white' : 'border border-[#006a46] text-[#006a46] hover:bg-[#eff4ff]'}`}
              >
                {currentPlan?.id === p.id ? 'Current' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment details + submit */}
      {selectedPlan && (
        <div className="bg-white rounded-xl border border-[#bdcac0]/60 p-5 space-y-4">
          <p className="text-sm font-bold text-[#0b1c30] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#006a46]" /> Payment Details — pay to upgrade to {selectedPlan.name}</p>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[#545f73]"><strong>Bank:</strong> {settings.bankName || '—'}</p>
              <p className="text-[#545f73]"><strong>Account Name:</strong> {settings.accountHolder || '—'}</p>
              <p className="text-[#545f73]"><strong>Account No:</strong> {settings.accountNumber || '—'}</p>
              {settings.iban && <p className="text-[#545f73]"><strong>IBAN:</strong> {settings.iban}</p>}
              <p className="text-[#545f73] mt-1"><strong>Reference:</strong> {settings.referenceFormat?.replace('{tenantId}', tenant.id) || tenant.id}</p>
              <p className="text-[#545f73] mt-1 italic">{settings.instructions}</p>
            </div>
            <div>
              {settings.qrCode ? (
                <img src={settings.qrCode} alt="Payment QR" className="w-32 h-32 border border-[#bdcac0] rounded-lg" />
              ) : (
                <div className="w-32 h-32 border border-dashed border-[#bdcac0] rounded-lg flex items-center justify-center text-[#545f73] text-[11px]">No QR uploaded</div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] text-[#545f73]">Amount Paid (RM)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-2 py-1.5 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[11px] text-[#545f73]">Transaction ID</span>
              <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. FPX12345" className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-2 py-1.5 text-sm font-mono" />
            </label>
            <label className="block">
              <span className="text-[11px] text-[#545f73]">Payment Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg px-2 py-1.5 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#545f73] cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload payment proof (screenshot)</span>
            <input type="file" className="hidden" onChange={(e) => setProofName(e.target.files?.[0]?.name || '')} />
            {proofName && <span className="text-[#006a46] font-semibold">{proofName}</span>}
          </label>
          <button
            onClick={submitPayment}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#006a46] text-white text-sm font-semibold hover:bg-[#00855a] disabled:opacity-40 flex items-center gap-2"
          >
            I Have Made the Payment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="bg-[#f8f9ff] rounded-lg p-2.5">
      <div className="flex justify-between text-[10px] text-[#545f73] mb-1"><span>{label}</span><span className="font-mono">{used} / {limit}</span></div>
      <div className="h-1.5 bg-[#bdcac0]/40 rounded-full overflow-hidden">
        <div className={`h-full ${pct >= 90 ? 'bg-red-500' : 'bg-[#006a46]'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
