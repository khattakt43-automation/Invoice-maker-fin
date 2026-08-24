/**
 * SQLite-backed write-through persistence layer.
 *
 * Motivation (spec points 14-20 "tenants are disappearing" + durability):
 *   The server previously kept all business data in a JSON file (`store.json`).
 *   That worked but a relational store is more robust and lets us enforce the
 *   tenant isolation findings from the multi-tenant audit at the data layer.
 *
 * Design goal: KEEP THE EXACT SAME PUBLIC INTERFACE the rest of the server uses.
 *   - `db()` returns the in-memory `StoreShape` (read-through cache).
 *   - `save()` flushes the in-memory store to SQLite.
 *   Routes are untouched; only this module changed.
 *
 * How it works:
 *   - On first run it creates `data/billah.db` (SQLite) and seeds it from the
 *     existing `store.json` if present, otherwise from the static seed data.
 *   - Relational collections (tenants, customers, invoices, products) are stored
 *     in real tables with a `tenant_id` column so cross-tenant access can be
 *     scoped/audited at the database layer.
 *   - Non-relational collections (waPlans, notifications, activityLogs, ...) are
 *     stored as JSON columns on a single `meta` row keyed by name — they are
 *     tenant-scoped where it matters via a `tenant_id` field inside the JSON.
 *   - Every mutation updates the in-memory store and calls `save()` to flush.
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
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
const DB_FILE = path.join(DATA_DIR, "billah.db");
const LEGACY_STORE_FILE = path.join(DATA_DIR, "store.json");

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

// ---- JSON <-> SQLite helpers ----
const j = (v: any) => (v === undefined ? null : JSON.stringify(v));
const unj = (v: any) => (v === null || v === undefined ? undefined : JSON.parse(v));

// In-memory cache mirroring the previous JSON store (kept for zero route changes).
let store: StoreShape | null = null;
let sql: Database.Database | null = null;

function getDb(): Database.Database {
  if (sql) return sql;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
  `);
  sql = db;
  return db;
}

function loadFromDb(): StoreShape {
  const db = getDb();
  const base = seedStore();
  const out: StoreShape = {
    ...base,
    tenants: [],
    customers: [],
    invoices: [],
    products: [],
    waPlans: [],
    waSubscriptions: [],
    waAccounts: [],
    waUsage: [],
    waOverrides: [],
    auditLogs: [],
    notifications: [],
    activityLogs: [],
    upgradeRequests: [],
  };

  const tenants = db.prepare("SELECT data FROM tenants").all() as { data: string }[];
  out.tenants = tenants.map((r) => unj(r.data));

  const customers = db.prepare("SELECT data FROM customers").all() as { data: string }[];
  out.customers = customers.map((r) => unj(r.data));

  const invoices = db.prepare("SELECT data FROM invoices").all() as { data: string }[];
  out.invoices = invoices.map((r) => unj(r.data));

  const products = db.prepare("SELECT data FROM products").all() as { data: string }[];
  out.products = products.map((r) => unj(r.data));

  const metaKeys = [
    "platformKPIs",
    "retainerPlans",
    "waPlans",
    "waSubscriptions",
    "waAccounts",
    "waUsage",
    "waOverrides",
    "auditLogs",
    "notifications",
    "activityLogs",
    "upgradeRequests",
    "paymentSettings",
  ] as const;
  for (const key of metaKeys) {
    const row = db.prepare("SELECT data FROM meta WHERE key = ?").get(key) as
      | { data: string }
      | undefined;
    if (row) {
      (out as any)[key] = unj(row.data);
    }
  }
  return out;
}

function persistToDb(s: StoreShape) {
  const db = getDb();
  const tx = db.transaction(() => {
    const upsertRel = db.prepare(
      "INSERT INTO tenants (id, data) VALUES (@id, @data) ON CONFLICT(id) DO UPDATE SET data = @data"
    );
    for (const t of s.tenants) upsertRel.run({ id: t.id, data: j(t) });

    const upsertCust = db.prepare(
      "INSERT INTO customers (id, tenant_id, data) VALUES (@id, @tid, @data) ON CONFLICT(id) DO UPDATE SET tenant_id=@tid, data=@data"
    );
    for (const c of s.customers) upsertCust.run({ id: c.id, tid: c.tenantId || "", data: j(c) });

    const upsertInv = db.prepare(
      "INSERT INTO invoices (id, tenant_id, data) VALUES (@id, @tid, @data) ON CONFLICT(id) DO UPDATE SET tenant_id=@tid, data=@data"
    );
    for (const i of s.invoices) upsertInv.run({ id: i.id, tid: i.tenantId || "", data: j(i) });

    const upsertProd = db.prepare(
      "INSERT INTO products (id, tenant_id, data) VALUES (@id, @tid, @data) ON CONFLICT(id) DO UPDATE SET tenant_id=@tid, data=@data"
    );
    for (const p of s.products) upsertProd.run({ id: p.id, tid: p.tenantId || "", data: j(p) });

    // CRITICAL: remove DB rows that no longer exist in memory. Without this a
    // deleted invoice/customer/tenant/ product stays in the SQLite table and
    // reappears after a refresh. (Bug #3: deleted data not persisting.)
    const syncTable = (table: string, rows: { id: string }[]) => {
      const liveIds = rows.map((r) => r.id);
      const all = db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[];
      const stale = all.map((r) => r.id).filter((id) => !liveIds.includes(id));
      const del = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
      for (const id of stale) del.run(id);
    };
    syncTable("invoices", s.invoices);
    syncTable("customers", s.customers);
    syncTable("tenants", s.tenants);
    syncTable("products", s.products);

    const metaKeys = [
      "platformKPIs",
      "retainerPlans",
      "waPlans",
      "waSubscriptions",
      "waAccounts",
      "waUsage",
      "waOverrides",
      "auditLogs",
      "notifications",
      "activityLogs",
      "upgradeRequests",
      "paymentSettings",
    ] as const;
    const upsertMeta = db.prepare(
      "INSERT INTO meta (key, data) VALUES (@key, @data) ON CONFLICT(key) DO UPDATE SET data=@data"
    );
    for (const key of metaKeys) upsertMeta.run({ key, data: j((s as any)[key]) });
  });
  tx();
}

function ensureStore(): StoreShape {
  if (store) return store;
  const db = getDb();
  const hasData =
    (db.prepare("SELECT COUNT(*) AS c FROM tenants").get() as { c: number }).c > 0;

  // First run: migrate from legacy store.json if present, else seed.
  if (!hasData) {
    let legacy: StoreShape | null = null;
    if (fs.existsSync(LEGACY_STORE_FILE)) {
      try {
        legacy = JSON.parse(fs.readFileSync(LEGACY_STORE_FILE, "utf-8")) as StoreShape;
        // Backfill any missing collections from seed.
        const seeded = seedStore();
        for (const k of Object.keys(seeded) as (keyof StoreShape)[]) {
          if ((legacy as any)[k] === undefined) (legacy as any)[k] = (seeded as any)[k];
        }
      } catch (e) {
        console.error("[db] legacy store.json parse failed, reseeding:", (e as Error).message);
        legacy = null;
      }
    }
    store = legacy ?? seedStore();
    // Hash any plaintext tenant passwords before first persist (so tenant login works).
    hashPlaintextTenantPasswords(store);
    persistToDb(store);
    // Rename legacy file so we don't re-migrate on next start (keep as backup).
    if (fs.existsSync(LEGACY_STORE_FILE)) {
      try {
        fs.renameSync(LEGACY_STORE_FILE, LEGACY_STORE_FILE + ".migrated");
      } catch { /* ignore */ }
    }
    return store;
  }

  store = loadFromDb();
  // Migrate any plaintext tenant passwords to bcrypt hashes (one-time, in place).
  // Detect plaintext by the absence of the bcrypt marker ($2). New accounts are
  // always stored hashed; this only fixes legacy/restored data.
  hashPlaintextTenantPasswords(store);
  return store;
}

// Hash any tenant password that is still stored in plaintext (missing the bcrypt
// "$2" marker). Idempotent — already-hashed passwords are left untouched.
function hashPlaintextTenantPasswords(s: StoreShape) {
  let pwdMigrated = false;
  for (const t of s.tenants) {
    if (t.password && !String(t.password).startsWith("$2")) {
      try {
        t.password = bcrypt.hashSync(t.password, 12);
        pwdMigrated = true;
      } catch { /* ignore */ }
    }
  }
  if (pwdMigrated) persistToDb(s);
}

/** Reload from disk so a freshly-started process reflects the SQLite store. */
export function db() {
  ensureStore();
  return store as StoreShape;
}

/** Persist the whole store to SQLite after a mutation. */
export function save() {
  if (store) persistToDb(store);
}

/** Convenience: read relational rows for a tenant (used by scoped endpoints). */
export function dbRaw() {
  return getDb();
}
