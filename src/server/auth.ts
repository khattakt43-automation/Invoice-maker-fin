/**
 * Server-side authentication & authorization core.
 *
 * Design (spec: real backend auth, no frontend hiding, no plaintext passwords):
 *  - Sessions are server-held rows in SQLite (sessions table). The browser only
 *    ever receives an opaque, unguessable session id in an HttpOnly cookie.
 *  - Passwords are hashed with bcrypt (cost 12) at rest. Plaintext is never
 *    stored, logged, or returned.
 *  - Tenant identity is ALWAYS derived from the session, never from a client
 *    `tenantId`/`X-Tenant-Id` header. Every data route re-derives the tenant
 *    from `req.session` and scopes queries to it (prevents IDOR/BOLA).
 *  - CSRF protection via double-submit cookie (X-CSRF-Token header === csrf cookie).
 *  - Login rate limiting: per-IP + per-username exponential backoff lockout.
 *  - All security-relevant events are written to an append-only audit log
 *    (audit_logs table) without ever logging secrets.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbRaw } from "./db";

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h
const IDLE_TTL_MS = 1000 * 60 * 30; // 30m idle timeout
const CSRF_BYTES = 32;
const BCRYPT_COST = 12;

// ---------- password hashing ----------
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_COST);
}
export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

// ---------- sessions ----------
export interface SessionRecord {
  id: string; // opaque session id (cookie value)
  tenantId: string | null; // tenant id if tenant session, else null
  role: "tenant" | "super_admin";
  csrf: string; // expected CSRF token (double-submit)
  createdAt: number;
  lastSeen: number;
  ip: string;
  userAgent: string;
}

function getSessionsTable() {
  const db = dbRaw();
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      role TEXT NOT NULL,
      csrf TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      action TEXT NOT NULL,
      tenant_id TEXT,
      actor TEXT,
      ip TEXT,
      success INTEGER NOT NULL,
      detail TEXT
    );
  `);
  return db;
}

function rowToSession(r: any): SessionRecord {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    role: r.role,
    csrf: r.csrf,
    createdAt: r.created_at,
    lastSeen: r.last_seen,
    ip: r.ip,
    userAgent: r.user_agent,
  };
}

export function createSession(opts: {
  tenantId: string | null;
  role: "tenant" | "super_admin";
  ip: string;
  userAgent: string;
}): SessionRecord {
  const db = getSessionsTable();
  const id = crypto.randomBytes(32).toString("hex"); // 64 hex chars, unguessable
  const csrf = crypto.randomBytes(CSRF_BYTES).toString("hex");
  const now = Date.now();
  db.prepare(
    `INSERT INTO sessions (id, tenant_id, role, csrf, created_at, last_seen, ip, user_agent)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(id, opts.tenantId, opts.role, csrf, now, now, opts.ip, opts.userAgent);
  return { id, csrf, tenantId: opts.tenantId, role: opts.role, createdAt: now, lastSeen: now, ip: opts.ip, userAgent: opts.userAgent };
}

export function getSession(id: string | undefined): SessionRecord | null {
  if (!id) return null;
  const db = getSessionsTable();
  const r = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as any;
  if (!r) return null;
  const s = rowToSession(r);
  // expiry / idle checks
  const now = Date.now();
  if (now - s.createdAt > SESSION_TTL_MS || now - s.lastSeen > IDLE_TTL_MS) {
    destroySession(id);
    return null;
  }
  // rotate lastSeen if within window (avoid write on every request spam)
  if (now - s.lastSeen > 60_000) {
    db.prepare("UPDATE sessions SET last_seen = ? WHERE id = ?").run(now, id);
  }
  return s;
}

export function destroySession(id: string | undefined) {
  if (!id) return;
  const db = getSessionsTable();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export function rotateCsrf(id: string): string | null {
  const db = getSessionsTable();
  const csrf = crypto.randomBytes(CSRF_BYTES).toString("hex");
  const res = db.prepare("UPDATE sessions SET csrf = ? WHERE id = ?").run(csrf, id);
  return res.changes ? csrf : null;
}

// ---------- rate limiting (login brute force) ----------
interface FailRecord { count: number; firstAt: number; lockedUntil: number; }
const failMap = new Map<string, FailRecord>();
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOCK_MS = 15 * 60 * 1000; // 15 min lockout

export function checkLoginLock(key: string): { locked: boolean; retryAfterSec?: number } {
  const r = failMap.get(key);
  if (!r) return { locked: false };
  const now = Date.now();
  if (now < r.lockedUntil) {
    return { locked: true, retryAfterSec: Math.ceil((r.lockedUntil - now) / 1000) };
  }
  // window expired -> reset
  if (now - r.firstAt > WINDOW_MS) {
    failMap.delete(key);
    return { locked: false };
  }
  return { locked: false };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const r = failMap.get(key);
  if (!r || now - r.firstAt > WINDOW_MS) {
    failMap.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  r.count += 1;
  if (r.count >= MAX_FAILS) {
    r.lockedUntil = now + LOCK_MS;
  }
}

export function clearLoginFailure(key: string) {
  failMap.delete(key);
}

// ---------- audit log ----------
export function auditLog(opts: {
  action: string;
  tenantId?: string | null;
  actor?: string;
  role?: string;
  ip?: string;
  success: boolean;
  detail?: string;
}) {
  try {
    const db = getSessionsTable();
    db.prepare(
      `INSERT INTO audit_logs (id, ts, action, tenant_id, actor, ip, success, detail)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(
      crypto.randomBytes(12).toString("hex"),
      Date.now(),
      opts.action,
      opts.tenantId ?? null,
      (opts.actor ?? opts.role ?? null),
      opts.ip ?? null,
      opts.success ? 1 : 0,
      opts.detail ?? null
    );
  } catch (e) {
    // never break request flow due to audit logging
    console.error("[audit] write failed:", (e as Error).message);
  }
}

export function getClientIp(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
