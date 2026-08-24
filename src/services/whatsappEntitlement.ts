import {
  FeatureKey,
  WhatsAppPlan,
  WhatsAppSubscription,
  WhatsAppOverride,
  WhatsAppAccount,
  WhatsAppUsage,
  WhatsAppServiceStatus,
} from '../types';

/**
 * Centralized WhatsApp entitlement service.
 *
 * IMPORTANT: application code MUST NOT branch on plan names like `plan === 'premium'`.
 * Instead every protected operation goes through:
 *   authenticate -> identify tenant -> hasFeature -> usage check -> execute -> record usage
 *
 * This module is the single source of truth for:
 *  - which features a tenant is entitled to (plan + admin overrides)
 *  - whether usage limits have been reached
 *  - service status gating (suspended services stop AI/automation/invoice generation)
 */

export interface EntitlementContext {
  subscription: WhatsAppSubscription | undefined;
  plan: WhatsAppPlan | undefined;
  account: WhatsAppAccount | undefined;
  usage: WhatsAppUsage | undefined;
  overrides: WhatsAppOverride[];
}

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Has the subscription expired or been cancelled/suspended? */
export function isServiceBlocked(sub: WhatsAppSubscription | undefined): boolean {
  if (!sub) return true;
  return (
    sub.status === 'suspended' ||
    sub.status === 'expired' ||
    sub.status === 'cancelled' ||
    sub.status === 'not_subscribed'
  );
}

/** Resolve the effective set of feature keys for a tenant (plan + active overrides). */
export function resolveFeatures(ctx: EntitlementContext): Set<FeatureKey> {
  const features = new Set<FeatureKey>();
  if (ctx.plan) ctx.plan.features.forEach((f) => features.add(f));

  const today = Date.now();
  for (const ov of ctx.overrides || []) {
    const expired = ov.expiry && new Date(ov.expiry).getTime() < today;
    if (expired) continue; // temporary access expired -> falls back to plan
    if (ov.granted) features.add(ov.feature);
    else features.delete(ov.feature); // explicit revoke
  }
  return features;
}

/** Centralized feature entitlement check. */
export function hasFeature(ctx: EntitlementContext, feature: FeatureKey): EntitlementResult {
  if (isServiceBlocked(ctx.subscription)) {
    return { allowed: false, reason: `Service ${ctx.subscription?.status || 'not_subscribed'}` };
  }
  const features = resolveFeatures(ctx);
  if (!features.has(feature)) {
    return { allowed: false, reason: `Feature '${feature}' not included in plan/overrides` };
  }
  return { allowed: true };
}

/** Generic usage-limit check against a (used, limit) pair. */
export function withinLimit(used: number | undefined, limit: number | undefined): boolean {
  if (limit === undefined || limit === null) return false;
  if (limit <= 0) return false;
  return (used || 0) < limit;
}

export interface UsageCheck {
  kind: 'message' | 'ai' | 'voice' | 'invoice' | 'automation';
}

/** Combined entitlement + usage gate for a given operation. */
export function checkUsage(ctx: EntitlementContext, kind: UsageCheck['kind']): EntitlementResult {
  if (isServiceBlocked(ctx.subscription)) {
    return { allowed: false, reason: `Service ${ctx.subscription?.status || 'not_subscribed'}` };
  }
  const sub = ctx.subscription;
  const usage = ctx.usage;
  if (!sub || !usage) return { allowed: false, reason: 'No subscription/usage record' };

  switch (kind) {
    case 'message':
      return withinLimit(usage.outgoingMessages + usage.incomingMessages, sub.messageLimit)
        ? { allowed: true }
        : { allowed: false, reason: 'Message limit reached' };
    case 'ai':
      return withinLimit(usage.aiConversations, sub.aiLimit)
        ? { allowed: true }
        : { allowed: false, reason: 'AI conversation limit reached' };
    case 'voice':
      return withinLimit(usage.voiceMinutes, sub.voiceMinutesLimit)
        ? { allowed: true }
        : { allowed: false, reason: 'Voice transcription minutes limit reached' };
    case 'invoice':
      return withinLimit(usage.invoicesGenerated, sub.invoiceLimit)
        ? { allowed: true }
        : { allowed: false, reason: 'Invoice generation limit reached' };
    case 'automation':
      return withinLimit(usage.automations, sub.automationLimit)
        ? { allowed: true }
        : { allowed: false, reason: 'Automation limit reached' };
  }
}

/** Full protected-operation gate used by the backend before executing anything. */
export function authorize(
  ctx: EntitlementContext,
  feature: FeatureKey,
  kind: UsageCheck['kind']
): EntitlementResult {
  const f = hasFeature(ctx, feature);
  if (!f.allowed) return f;
  return checkUsage(ctx, kind);
}

export function statusLabel(status: WhatsAppServiceStatus): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Default plan catalogue. Admin can edit these (prices/limits are NOT hard-coded). */
export const DEFAULT_PLANS: WhatsAppPlan[] = [
  {
    id: 'wa-basic',
    name: 'Basic',
    description: 'WhatsApp connection, text messaging, AI invoice generation (basic limits).',
    monthlyPrice: 99,
    yearlyPrice: 990,
    messageLimit: 1000,
    aiLimit: 100,
    voiceMinutesLimit: 0,
    invoiceLimit: 50,
    automationLimit: 0,
    connectionLimit: 1,
    features: [
      'whatsapp_text',
      'ai_invoice_generation',
      'invoice_pdf_generation',
      'whatsapp_invoice_delivery',
      'customer_lookup',
      'customer_creation',
      'human_handoff',
    ],
    active: true,
  },
  {
    id: 'wa-standard',
    name: 'Standard',
    description: 'Everything in Basic plus payment reminders, automation and AI support.',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    messageLimit: 5000,
    aiLimit: 500,
    voiceMinutesLimit: 0,
    invoiceLimit: 250,
    automationLimit: 50,
    connectionLimit: 1,
    features: [
      'whatsapp_text',
      'ai_invoice_generation',
      'invoice_pdf_generation',
      'whatsapp_invoice_delivery',
      'customer_lookup',
      'customer_creation',
      'payment_reminders',
      'automation',
      'ai_customer_support',
      'human_handoff',
    ],
    active: true,
  },
  {
    id: 'wa-premium',
    name: 'Premium',
    description: 'Everything in Standard plus voice transcription, multiple numbers, advanced AI.',
    monthlyPrice: 399,
    yearlyPrice: 3990,
    messageLimit: 20000,
    aiLimit: 2000,
    voiceMinutesLimit: 500,
    invoiceLimit: 1000,
    automationLimit: 200,
    connectionLimit: 3,
    features: [
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
    ],
    active: true,
  },
];

export function emptyUsage(tenantId: string): WhatsAppUsage {
  return {
    tenantId,
    incomingMessages: 0,
    outgoingMessages: 0,
    aiConversations: 0,
    invoicesGenerated: 0,
    pdfsGenerated: 0,
    voiceMessages: 0,
    voiceMinutes: 0,
    automations: 0,
    paymentReminders: 0,
  };
}
