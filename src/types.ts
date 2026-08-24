export type UserRole = 'business_admin' | 'super_admin';

export interface SuperAdminConfig {
  username: string;
  email: string;
  displayName: string;
  password?: string;
  phone?: string;
  securityRole?: string;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';
export type CustomerStatus = 'OVERDUE' | 'CURRENT' | 'PAID';
export type TenantStatus = 'Active' | 'Trial' | 'Suspended';
export type SubscriptionPlan = 'Basic (Free)' | 'Pro (RM 49/mo)' | 'Enterprise (Custom)' | 'Starter Retainer' | 'Growth Retainer' | 'Custom Retainer';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  size?: string;
  sizeUnit?: 'sq' | 'meter' | 'ft' | 'hr' | 'unit' | 'pcs' | 'm' | 'hrs' | string;
  unitPrice: number;
  taxRate: number; // e.g. 0.08 for 8% SST
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTin?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // 0.08 or 0
  taxAmount: number;
  totalAmount: number;
  currency: 'MYR' | 'USD' | 'SGD' | 'EUR';
  status: InvoiceStatus;
  notes: string;
  paperSize: 'A4 (Standard)' | 'A5' | 'Letter' | 'Legal';
  paymentTerms: string;
  docTitle?: string;        // per-invoice header title override
  showDocTitle?: boolean;   // include/exclude the header title
  docTitleSize?: number;    // px font size of the header title (Point 2)
  notesAlign?: 'left' | 'center' | 'right';
  qrData?: string;          // QR code content
  qrSize?: number;          // QR code px size
  qrAlign?: 'left' | 'center' | 'right';
  createdAt?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  contactPerson: string;
  email: string;
  phone: string;
  tin: string;
  address: string;
  outstandingBalance: number;
  ltv: number;
  status: CustomerStatus;
  joinedDate: string;
  recentInvoices?: {
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate?: string;
    amount: number;
    status: InvoiceStatus;
  }[];
}

export interface Tenant {
  id: string;
  code: string; // e.g. TEN-0982
  name: string;
  initials: string;
  username?: string;
  password?: string;
  adminName: string;
  adminEmail: string;
  phone: string;
  address: string;
  sstId: string;
  tin: string;
  status: TenantStatus;
  joinedDate: string;
  billingStatus: string; // "Paid" | "RM 5,000 Due"
  accessEnabled: boolean;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  mrr: number;
  invoicesCount: number;
  bankName: string;
  bankAccount: string;
  bankTitle: string; // Account Title (separate from bank name & account number)
  logoUrl?: string;
  customerLogoUrl?: string;
  logoHeight?: number; // Manual logo height in pixels e.g. 48-120
  invoiceTitle?: string; // Customizable title e.g. 'Tax Invoice', 'Commercial Invoice'
  defaultDocTitle?: string; // Default document title saved as permanent default (Point 1)
  defaultDocTitleSize?: number; // Default header title size in px (Point 2)
  soundsEnabled?: boolean; // Notification & system sounds ON/OFF (Point 8)
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  description: string;
}

export interface PlatformKPIs {
  totalTenants: number;
  totalTenantsGrowth: string;
  activeTenants: number;
  totalTenantsCap: number;
  platformMrr: number;
  platformMrrGrowth: string;
  invoicesProcessed: string;
  pendingApprovalCount: number;
  subscriptionTiers: {
    basic: { count: number; percentage: number };
    pro: { count: number; percentage: number };
    enterprise: { count: number; percentage: number };
  };
}

// User-facing activity log (Point 9 - replaces "Changes Made")
export interface AppActivityLog {
  id: string;
  timestamp: string;
  tenantId?: string;
  actor: string;
  action: string;
  detail: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export type ServiceStatus =
  | 'not subscribed'
  | 'pending'
  | 'pending activation'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'connection error';

export interface WhatsAppAuditLog {
  id: string;
  timestamp: string;
  tenantId?: string;
  actor?: string;
  action: string;
  detail?: string;
}

export interface RetainerPlan {
  id: string;
  name: string;
  tag?: string;
  priceFormatted: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
}

// ---------------------------------------------------------------------------
// User activity log (replaces the old "Changes Made" customer-facing view) (Point 9)
// ---------------------------------------------------------------------------
export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO
  tenantId: string;
  actor: string; // who did it (tenant name / 'System' / 'Super Admin')
  action: string; // e.g. 'invoice.created', 'invoice.draft_autosaved'
  detail: string; // human readable
  severity?: 'info' | 'success' | 'warning' | 'danger';
}

// ---------------------------------------------------------------------------
// Notifications (top bar bell) (Points 6 & 7)
// ---------------------------------------------------------------------------
export interface AppNotification {
  id: string;
  tenantId: string;
  title: string;
  desc: string;
  time: string; // display e.g. '10m ago'
  icon: 'check' | 'alert' | 'clock' | 'invoice' | 'user' | 'info';
  link?: {
    tab: string; // target tab to navigate to
    customerId?: string;
    invoiceId?: string;
  };
  read?: boolean;
}

// ---------------------------------------------------------------------------
// WhatsApp monetizable multi-tenant subsystem (specs 2 & 3)
// ---------------------------------------------------------------------------
export type WhatsAppServiceStatus =
  | 'not_subscribed'
  | 'pending_activation'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'connection_error';

export type FeatureKey =
  | 'whatsapp_text'
  | 'ai_invoice_generation'
  | 'invoice_pdf_generation'
  | 'whatsapp_invoice_delivery'
  | 'customer_lookup'
  | 'customer_creation'
  | 'payment_reminders'
  | 'automation'
  | 'advanced_automation'
  | 'ai_customer_support'
  | 'voice_transcription'
  | 'multiple_numbers'
  | 'advanced_ai_agents'
  | 'custom_ai_instructions'
  | 'advanced_analytics'
  | 'human_handoff';

export interface WhatsAppPlan {
  id: string;
  name: string; // Basic | Standard | Premium | Custom
  description: string;
  monthlyPrice: number; // RM, configurable (not hard-coded)
  yearlyPrice: number;
  messageLimit: number;
  aiLimit: number;
  voiceMinutesLimit: number;
  invoiceLimit: number;
  automationLimit: number;
  connectionLimit: number; // number of WhatsApp numbers
  features: FeatureKey[]; // entitlement keys included
  active: boolean;
}

export interface WhatsAppSubscription {
  tenantId: string;
  planId: string;
  status: WhatsAppServiceStatus;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  subscriptionStart: string;
  subscriptionEnd: string;
  messageLimit: number;
  messagesUsed: number;
  aiLimit: number;
  aiUsed: number;
  voiceMinutesLimit: number;
  voiceMinutesUsed: number;
  invoiceLimit: number;
  invoicesUsed: number;
  automationLimit: number;
  automationsUsed: number;
}

export interface WhatsAppAccount {
  tenantId: string;
  phoneNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  aiEnabled: boolean;
  invoiceGenerationEnabled: boolean;
  automationEnabled: boolean;
  voiceTranscriptionEnabled: boolean;
  lastActivity: string;
}

export interface WhatsAppUsage {
  tenantId: string;
  incomingMessages: number;
  outgoingMessages: number;
  aiConversations: number;
  invoicesGenerated: number;
  pdfsGenerated: number;
  voiceMessages: number;
  voiceMinutes: number;
  automations: number;
  paymentReminders: number;
}

export interface WhatsAppOverride {
  tenantId: string;
  feature: FeatureKey;
  granted: boolean;
  adminActor: string;
  date: string;
  expiry?: string; // optional ISO expiry for temporary access
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  actor: string;
  action: string;
  detail: string;
}
