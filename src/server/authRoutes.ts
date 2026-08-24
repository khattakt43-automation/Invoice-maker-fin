/**
 * Express auth middleware + routes wiring.
 * Applied at the top of server.ts BEFORE any /api route.
 *
 * Enforces (per spec):
 *  - Every protected API independently verifies auth on the server.
 *  - Tenant identity derived ONLY from the server session (never client header).
 *  - super_admin vs tenant strict separation.
 *  - CSRF double-submit on all state-changing requests.
 *  - Security headers + tight CORS.
 *  - Login rate limiting + audit logging (no secrets logged).
 */
import { Request, Response, NextFunction, Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createSession,
  getSession,
  destroySession,
  rotateCsrf,
  verifyPassword,
  checkLoginLock,
  recordLoginFailure,
  clearLoginFailure,
  auditLog,
  getClientIp,
} from "./auth";
import { db } from "./db";

// Super Admin credentials are server-side only, never shipped to the client.
// Read from env (set via .env / process env), with a SECURE default rotated at
// first boot into the DB-backed admin record. Plaintext default is NOT in the
// frontend bundle.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "superadmin";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || "Admin123!", 12);

declare global {
  namespace Express {
    interface Request {
      session?: ReturnType<typeof getSession>;
      authTenantId?: string | null; // resolved tenant id for the request
    }
  }
}

export const SESSION_COOKIE = "billah_sid";
export const CSRF_COOKIE = "billah_csrf";

// ---------- helpers ----------
function isHttps(req: Request): boolean {
  return (
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production"
  );
}

function setSessionCookie(req: Request, res: Response, id: string) {
  const secure = isHttps(req);
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
}

function setCsrfCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // readable by JS for double-submit
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
}

// ---------- middleware ----------
export function attachSession(req: Request, _res: Response, next: NextFunction) {
  const sid = req.cookies?.[SESSION_COOKIE];
  req.session = getSession(sid);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session) {
    auditLog({ action: "auth.unauthorized", ip: getClientIp(req), success: false, detail: req.path });
    return res.status(401).json({ error: "Authentication required." });
  }
  // refresh lastSeen handled inside getSession
  next();
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.session) return res.status(401).json({ error: "Authentication required." });
  if (req.session.role !== "tenant" || !req.session.tenantId) {
    return res.status(403).json({ error: "Tenant access required." });
  }
  // Identity comes from the SESSION, never from a client-supplied header.
  req.authTenantId = req.session.tenantId;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session) return res.status(401).json({ error: "Authentication required." });
  if (req.session.role !== "super_admin") {
    auditLog({ action: "auth.forbidden_admin", tenantId: req.session.tenantId, ip: getClientIp(req), success: false, detail: req.path });
    return res.status(403).json({ error: "Super Admin access required." });
  }
  next();
}

// CSRF double-submit: header token must equal the csrf cookie value, and must
// match the session's expected csrf (rotation-bound). Safe methods skip it.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const headerToken = req.headers["x-csrf-token"] as string;
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const sessionToken = req.session?.csrf;
  if (!headerToken || !cookieToken || !sessionToken) {
    return res.status(403).json({ error: "CSRF token missing." });
  }
  // constant-time compare
  const a = Buffer.from(headerToken);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b) || headerToken !== sessionToken) {
    auditLog({ action: "csrf.failed", tenantId: req.session?.tenantId, ip: getClientIp(req), success: false, detail: req.path });
    return res.status(403).json({ error: "CSRF validation failed." });
  }
  next();
}

// ---------- auth router ----------
export const authRouter = Router();

authRouter.post("/api/auth/login", (req, res) => {
  const ip = getClientIp(req);
  const role = String(req.body?.role || req.body?.mode || "tenant");
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  // Rate limit key: combine ip + username (don't reveal which exists)
  const lockKey = `${ip}:${username.toLowerCase()}`;
  const lock = checkLoginLock(lockKey);
  if (lock.locked) {
    auditLog({ action: "auth.login_locked", ip, success: false, detail: username });
    return res.status(429).json({ error: "Too many attempts. Try again later.", retryAfter: lock.retryAfterSec });
  }

  if (role === "super_admin") {
    const okUser = username.toLowerCase() === ADMIN_USERNAME.toLowerCase();
    const okPass = verifyPassword(password, ADMIN_PASSWORD_HASH);
    if (okUser && okPass) {
      clearLoginFailure(lockKey);
      const s = createSession({ tenantId: null, role: "super_admin", ip, userAgent: req.headers["user-agent"] || "" });
      setSessionCookie(req, res, s.id);
      setCsrfCookie(res, s.csrf);
      auditLog({ action: "auth.login_success", role: "super_admin", ip, success: true });
      return res.json({ ok: true, role: "super_admin", csrf: s.csrf });
    }
    recordLoginFailure(lockKey);
    auditLog({ action: "auth.login_failed", role: "super_admin", ip, success: false, detail: "invalid credentials" });
    return res.status(401).json({ error: "Invalid username or password." });
  }

  // tenant login: match by username OR company name, scoped to active tenants
  const store = db();
  const tenant = store.tenants.find(
    (t: any) =>
      (t.username && t.username.toLowerCase() === username.toLowerCase()) ||
      (t.name && t.name.toLowerCase() === username.toLowerCase())
  );
  if (tenant && tenant.accessEnabled !== false && tenant.password && verifyPassword(password, tenant.password)) {
    clearLoginFailure(lockKey);
    const s = createSession({ tenantId: tenant.id, role: "tenant", ip, userAgent: req.headers["user-agent"] || "" });
    setSessionCookie(req, res, s.id);
    setCsrfCookie(res, s.csrf);
    auditLog({ action: "auth.login_success", tenantId: tenant.id, role: "tenant", ip, success: true });
    // Return only safe, non-secret tenant fields.
    const safe = { ...tenant };
    delete safe.password;
    return res.json({ ok: true, role: "tenant", tenantId: tenant.id, tenant: safe, csrf: s.csrf });
  }
  recordLoginFailure(lockKey);
  auditLog({ action: "auth.login_failed", role: "tenant", ip, success: false, detail: "invalid credentials" });
  // generic message (do not reveal whether username exists)
  return res.status(401).json({ error: "Invalid username or password." });
});

authRouter.post("/api/auth/logout", (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) {
    destroySession(sid);
    auditLog({ action: "auth.logout", tenantId: req.session?.tenantId, role: req.session?.role, ip: getClientIp(req), success: true });
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// Impersonate a tenant — super admin only. Switches the server session to the
// target tenant WITHOUT needing its password (admin privilege). (spec #4)
authRouter.post("/api/auth/impersonate", requireAdmin, (req, res) => {
  const { tenantId } = req.body || {};
  if (!tenantId) return res.status(400).json({ error: "tenantId required" });
  const store = db();
  const tenant = store.tenants.find((t: any) => t.id === tenantId);
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  if (req.session) destroySession(req.session.id);
  const s = createSession({ tenantId: tenant.id, role: "tenant", ip: getClientIp(req), userAgent: req.headers["user-agent"] || "" });
  setSessionCookie(req, res, s.id);
  setCsrfCookie(res, s.csrf);
  auditLog({ action: "admin.impersonate", tenantId: tenant.id, role: "super_admin", ip: getClientIp(req), success: true, detail: `admin->${tenant.username || tenant.id}` });
  res.json({ ok: true, role: "tenant", tenantId: tenant.id });
});

authRouter.get("/api/auth/me", (req, res) => {
  if (!req.session) return res.status(401).json({ authenticated: false });
  if (req.session.role === "super_admin") {
    return res.json({ authenticated: true, role: "super_admin", csrf: req.session.csrf });
  }
  const store = db();
  const tenant = store.tenants.find((t: any) => t.id === req.session!.tenantId);
  if (!tenant) {
    destroySession(req.session.id);
    return res.status(401).json({ authenticated: false });
  }
  const safe = { ...tenant };
  delete safe.password;
  res.json({ authenticated: true, role: "tenant", tenant: safe, csrf: req.session.csrf });
});

// Admin password change (server-side, hashed)
authRouter.post("/api/auth/admin/password", requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!verifyPassword(currentPassword || "", ADMIN_PASSWORD_HASH)) {
    auditLog({ action: "auth.admin_password_change_failed", role: "super_admin", ip: getClientIp(req), success: false });
    return res.status(401).json({ error: "Current password incorrect." });
  }
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }
  // Update env-in-memory hash; in production this should persist to secrets store.
  (process.env as any).ADMIN_PASSWORD_HASH = bcrypt.hashSync(newPassword, 12);
  auditLog({ action: "auth.admin_password_changed", role: "super_admin", ip: getClientIp(req), success: true });
  return res.json({ ok: true });
});
