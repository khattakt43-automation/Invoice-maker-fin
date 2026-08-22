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
  currency: 'MYR' | 'USD' | 'SGD';
  status: InvoiceStatus;
  notes: string;
  paperSize: 'A4 (Standard)' | 'A5' | 'Letter' | 'Legal';
  paymentTerms: string;
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
  logoUrl?: string;
  customerLogoUrl?: string;
  logoHeight?: number; // Manual logo height in pixels e.g. 48-120
  invoiceTitle?: string; // Customizable title e.g. 'Tax Invoice', 'Commercial Invoice'
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
