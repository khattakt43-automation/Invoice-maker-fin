import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import {
  initialTenants,
  initialCustomers,
  initialInvoices,
  initialProducts,
  initialPlatformKPIs,
  initialRetainerPlans
} from "./src/data/mockData";
import { Tenant, Customer, Invoice, Product } from "./src/types";
import { db, save } from "./src/server/db";
import bcrypt from "bcryptjs";
import {
  attachSession,
  requireAuth,
  requireTenant,
  requireAdmin,
  requireCsrf,
  authRouter,
  CSRF_COOKIE,
} from "./src/server/authRoutes";
import { auditLog, getClientIp } from "./src/server/auth";

// Seed WhatsApp entitlement defaults (kept for type references in this file).
import { emptyUsage } from "./src/services/whatsappEntitlement";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  // ---- Security headers (spec #11) ----
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none';"
    );
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    // HSTS only once behind real HTTPS (spec #8). Harmless to pre-set; browsers
    // ignore it over plain HTTP anyway.
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // ---- CORS: no wildcard for private APIs (spec #11) ----
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && ALLOWED_ORIGINS.length && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // ---- Auth: attach session + CSRF on state-changing; auth router (public) ----
  app.use(attachSession);
  app.use(authRouter);

  // ---- Global API guard: every /api route except health + auth requires an
  // authenticated session, and every state-changing request requires a valid
  // CSRF token. Tenant/Admin scoping is enforced per-route below. (spec #1,#5,#12) ----
  app.use("/api", (req, res, next) => {
    const p = req.path;
    if (p === "/health" || p.startsWith("/auth/")) return next();
    if (!req.session) {
      auditLog({ action: "auth.api_unauthorized", ip: getClientIp(req), success: false, detail: p });
      return res.status(401).json({ error: "Authentication required." });
    }
    // CSRF for non-safe methods
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const headerToken = req.headers["x-csrf-token"] as string;
      const cookieToken = req.cookies?.[CSRF_COOKIE];
      const sessionToken = req.session?.csrf;
      if (!headerToken || !cookieToken || !sessionToken || headerToken !== cookieToken || headerToken !== sessionToken) {
        auditLog({ action: "csrf.api_failed", tenantId: req.session?.tenantId, ip: getClientIp(req), success: false, detail: p });
        return res.status(403).json({ error: "CSRF validation failed." });
      }
    }
    next();
  });

  // Persistent data store (write-through JSON file). This is the single source
  // of truth: every mutation is persisted immediately and reads always reflect
  // what is on disk, so data survives restarts and navigation.
  const store = db();

  // Convenience mutable references bound to the persistent store.
  const tenants = store.tenants;
  const customers = store.customers;
  const invoices = store.invoices;
  const products = store.products;
  const platformKPIs = store.platformKPIs;
  const retainerPlans = store.retainerPlans;

  // API Routes

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- TENANTS API ---
  app.get("/api/tenants", (req, res) => {
    // Tenant sees ONLY their own tenant record. Admin sees all. (spec #3/#4)
    if (req.session!.role === "tenant") {
      const self = tenants.find((t) => t.id === req.session!.tenantId);
      const safe = self ? (() => { const c = { ...self }; delete c.password; return c; })() : null;
      return res.json({ data: safe ? [safe] : [] });
    }
    const safe = tenants.map((t) => { const c = { ...t }; delete c.password; return c; });
    res.json({ data: safe });
  });

  app.post("/api/tenants", requireAdmin, (req, res) => {
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      code: `TEN-${String(Math.floor(1000 + Math.random() * 9000))}`,
      name: req.body.name || "New Business Sdn Bhd",
      initials: req.body.initials || (req.body.name ? req.body.name.substring(0, 2).toUpperCase() : "NB"),
      username: req.body.username || req.body.adminEmail?.split('@')[0] || "tenantadmin",
      password: req.body.password ? bcrypt.hashSync(req.body.password, 12) : bcrypt.hashSync("Password123!", 12),
      adminName: req.body.adminName || "Admin User",
      adminEmail: req.body.adminEmail || "admin@business.my",
      phone: req.body.phone || "+60 12-000 0000",
      address: req.body.address || "Kuala Lumpur, Malaysia",
      sstId: req.body.sstId || `W10-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000000 + Math.random() * 90000000)}`,
      tin: req.body.tin || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: req.body.status || "Active",
      joinedDate: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      billingStatus: "Paid",
      accessEnabled: true,
      plan: req.body.plan || "Pro",
      mrr: req.body.plan === "Enterprise" ? 4999 : req.body.plan === "Pro" ? 49 : 0,
      invoicesCount: 0,
      bankName: req.body.bankName || "Maybank",
      bankAccount: req.body.bankAccount || "5123-9999-0000",
      logoHeight: req.body.logoHeight || 52,
      invoiceTitle: req.body.invoiceTitle || "Tax Invoice",
    };

    tenants.unshift(newTenant);
    platformKPIs.totalTenants += 1;
    platformKPIs.activeTenants += 1;
    auditLog({ action: "tenant.created", tenantId: newTenant.id, role: "super_admin", ip: getClientIp(req), success: true });
    notifications.unshift({
      id: `ntf-admin-${Date.now()}`,
      tenantId: "platform",
      title: "New tenant created",
      desc: `${newTenant.name} (${newTenant.code}) was added to the platform.`,
      time: "just now",
      icon: "check",
      link: { tab: "admin-overview" },
    });
    save();
    const safe = { ...newTenant }; delete safe.password;
    res.status(201).json({ data: safe, message: "Tenant created successfully" });
  });

  app.patch("/api/tenants/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = tenants.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    const prev = tenants[index];
    // Never allow a tenant to escalate to super admin via this route.
    const update = { ...req.body };
    if (update.role) delete update.role;
    if (update.password) update.password = bcrypt.hashSync(update.password, 12);
    tenants[index] = { ...tenants[index], ...update };
    auditLog({ action: "tenant.updated", tenantId: id, role: "super_admin", ip: getClientIp(req), success: true, detail: prev.status !== tenants[index].status ? `status->${tenants[index].status}` : "" });
    if (req.body.status && req.body.status !== prev.status) {
      const suspended = /suspend/i.test(req.body.status);
      notifications.unshift({
        id: `ntf-admin-${Date.now()}`,
        tenantId: "platform",
        title: suspended ? "Tenant suspended" : `Tenant status: ${req.body.status}`,
        desc: `${tenants[index].name} is now ${req.body.status}.`,
        time: "just now",
        icon: suspended ? "alert" : "check",
        link: { tab: "admin-overview" },
      });
    }
    save();
    const safe = { ...tenants[index] }; delete safe.password;
    res.json({ data: safe, message: "Tenant updated successfully" });
  });

  // --- CUSTOMERS API (tenant-scoped: server derives tenant from session) ---
  app.get("/api/customers", (req, res) => {
    const role = req.session!.role;
    // Tenants can ONLY see their own customers. Admin may pass tenantId to scope.
    const tenantId = role === "tenant" ? req.session!.tenantId : (req.query.tenantId as string | undefined);
    let filtered = [...customers];
    if (tenantId) filtered = filtered.filter((c) => c.tenantId === tenantId);

    const { search, sortBy } = req.query;
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.tin.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q)
      );
    }
    if (sortBy === "Name (A-Z)") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "Recent Activity") filtered.sort((a, b) => b.ltv - a.ltv);
    else filtered.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    res.json({ data: filtered });
  });

  app.post("/api/customers", (req, res) => {
    // Tenant-scoped: ignore any client tenantId, force the session tenant.
    const tenantId = req.session!.role === "tenant" ? req.session!.tenantId! : (req.body.tenantId || "tenant-tech-solutions");
    const initials = req.body.name
      ? req.body.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
      : "CU";
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      tenantId,
      name: req.body.name,
      initials,
      contactPerson: req.body.contactPerson || "Finance Dept",
      email: req.body.email,
      phone: req.body.phone,
      tin: req.body.tin || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      address: req.body.address || "Kuala Lumpur, Malaysia",
      outstandingBalance: 0,
      ltv: 0,
      status: "PAID",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      recentInvoices: [],
    };
    customers.unshift(newCustomer);
    save();
    res.status(201).json({ data: newCustomer, message: "Customer created successfully" });
  });

  app.patch("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    // Ownership check: tenants may only edit their own customer.
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Customer not found" });
    if (req.session!.role === "tenant" && customers[index].tenantId !== req.session!.tenantId) {
      auditLog({ action: "authz.cross_tenant_block", tenantId: req.session!.tenantId, ip: getClientIp(req), success: false, detail: `customer ${id}` });
      return res.status(403).json({ error: "Forbidden: not your resource." });
    }
    customers[index] = { ...customers[index], ...req.body };
    save();
    res.json({ data: customers[index], message: "Customer updated successfully" });
  });

  app.delete("/api/customers/:id", (req, res) => {
    const index = customers.findIndex((c) => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Customer not found" });
    if (req.session!.role === "tenant" && customers[index].tenantId !== req.session!.tenantId) {
      auditLog({ action: "authz.cross_tenant_block", tenantId: req.session!.tenantId, ip: getClientIp(req), success: false, detail: `customer ${req.params.id}` });
      return res.status(403).json({ error: "Forbidden: not your resource." });
    }
    customers.splice(index, 1);
    save();
    res.json({ data: { id: req.params.id }, message: "Customer deleted successfully" });
  });

  // --- INVOICES API (tenant-scoped: server derives tenant from session) ---
  app.get("/api/invoices", (req, res) => {
    const role = req.session!.role;
    // Tenants see ONLY their own invoices. Admin may scope via tenantId query.
    const tenantId = role === "tenant" ? req.session!.tenantId : (req.query.tenantId as string | undefined);
    let filtered = [...invoices];
    if (tenantId) filtered = filtered.filter((i) => i.tenantId === tenantId);
    const { status, customerId } = req.query;
    if (status && status !== "All") {
      filtered = filtered.filter((i) => i.status.toLowerCase() === String(status).toLowerCase());
    }
    if (customerId) filtered = filtered.filter((i) => i.customerId === customerId);
    res.json({ data: filtered });
  });

  app.post("/api/invoices", (req, res) => {
    // Tenant-scoped: force the session tenant; never trust client tenantId.
    const tenantId = req.session!.role === "tenant" ? req.session!.tenantId! : (req.body.tenantId || "tenant-tech-solutions");
    const invCount = invoices.length + 1;
    const invNumber = req.body.invoiceNumber || `INV-2023-${String(1040 + invCount)}`;

    const items = (req.body.items || []).map((it: any) => ({ ...it, taxRate: Number(it.taxRate) || 0 }));
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
    const taxAmount = items.reduce((acc: number, item: any) => acc + (Number(item.amount) || (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)) * (Number(item.taxRate) || 0), 0);
    const totalAmount = subtotal + taxAmount;

    let customerId = req.body.customerId || "";
    const customerName = req.body.customerName || "Customer Name";
    if (!customerId && customerName && customerName !== "Customer Name") {
      const existing = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
      if (existing) {
        customerId = existing.id;
      } else {
        customerId = `cust-${Date.now()}`;
        // enforce tenant ownership on auto-created customer
        customers.unshift({
          id: customerId, name: customerName, email: req.body.customerEmail || "",
          phone: req.body.customerPhone || "", address: req.body.customerAddress || "",
          tin: req.body.customerTin || "", outstandingBalance: 0, ltv: 0, status: "CURRENT",
          recentInvoices: [], tenantId,
        });
      }
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`, invoiceNumber: invNumber, tenantId,
      customerId: customerId || "cust-custom", customerName,
      customerEmail: req.body.customerEmail || "", customerPhone: req.body.customerPhone || "",
      customerAddress: req.body.customerAddress || "", customerTin: req.body.customerTin || "",
      date: req.body.date || new Date().toISOString().split("T")[0],
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      items, subtotal, taxRate: req.body.taxRate !== undefined ? Number(req.body.taxRate) : 0.0, taxAmount,
      totalAmount, currency: req.body.currency || "MYR", status: req.body.status || "Unpaid",
      notes: req.body.notes || "Thank you for your business.", paperSize: req.body.paperSize || "A4 (Standard)",
      paymentTerms: req.body.paymentTerms || "Payment due within 30 days.", docTitle: req.body.docTitle,
      showDocTitle: req.body.showDocTitle !== undefined ? req.body.showDocTitle : true,
      notesAlign: req.body.notesAlign || "left", qrData: req.body.qrData || "", qrSize: req.body.qrSize || 110,
      qrAlign: req.body.qrAlign || "right", createdAt: new Date().toISOString(),
    };

    invoices.unshift(newInvoice);

    const customer = customers.find((c) => c.id === newInvoice.customerId || c.name === newInvoice.customerName);
    if (customer) {
      if (newInvoice.status !== "Paid") { customer.outstandingBalance += totalAmount; customer.status = "CURRENT"; }
      customer.ltv += totalAmount;
      if (!customer.recentInvoices) customer.recentInvoices = [];
      customer.recentInvoices.unshift({ id: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber, date: newInvoice.date, dueDate: newInvoice.dueDate, amount: totalAmount, status: newInvoice.status });
    }

    save();
    res.status(201).json({ data: newInvoice, message: "Invoice created successfully" });
  });

  app.put("/api/invoices/:id", (req, res) => {
    const index = invoices.findIndex((i) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Invoice not found" });
    // Ownership check: tenants may only edit their own invoice.
    if (req.session!.role === "tenant" && invoices[index].tenantId !== req.session!.tenantId) {
      auditLog({ action: "authz.cross_tenant_block", tenantId: req.session!.tenantId, ip: getClientIp(req), success: false, detail: `invoice ${req.params.id}` });
      return res.status(403).json({ error: "Forbidden: not your resource." });
    }
    const existing = invoices[index];
    const items = (req.body.items || existing.items || []).map((it: any) => ({ ...it, taxRate: Number(it.taxRate) || 0 }));
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
    const taxAmount = items.reduce((acc: number, item: any) => acc + (Number(item.amount) || (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)) * (Number(item.taxRate) || 0), 0);
    const totalAmount = subtotal + taxAmount;

    let customerId = req.body.customerId || existing.customerId || "";
    const customerName = req.body.customerName || existing.customerName || "Customer Name";
    const tenantId = req.session!.role === "tenant" ? req.session!.tenantId! : (req.body.tenantId || existing.tenantId);
    if (!customerId && customerName && customerName !== "Customer Name") {
      const match = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
      if (match) { customerId = match.id; } else {
        customerId = `cust-${Date.now()}`;
        customers.unshift({ id: customerId, name: customerName, email: req.body.customerEmail || existing.customerEmail || "", phone: req.body.customerPhone || existing.customerPhone || "", address: req.body.customerAddress || existing.customerAddress || "", tin: req.body.customerTin || existing.customerTin || "", outstandingBalance: 0, ltv: 0, status: "CURRENT", recentInvoices: [], tenantId });
      }
    }

    const updated: Invoice = {
      ...existing, invoiceNumber: req.body.invoiceNumber || existing.invoiceNumber, tenantId,
      customerId: customerId || existing.customerId, customerName,
      customerEmail: req.body.customerEmail || existing.customerEmail, customerPhone: req.body.customerPhone || existing.customerPhone,
      customerAddress: req.body.customerAddress || existing.customerAddress, customerTin: req.body.customerTin || existing.customerTin,
      date: req.body.date || existing.date, dueDate: req.body.dueDate || existing.dueDate, items, subtotal,
      taxRate: req.body.taxRate !== undefined ? Number(req.body.taxRate) : existing.taxRate, taxAmount, totalAmount,
      currency: req.body.currency || existing.currency, status: req.body.status || existing.status,
      notes: req.body.notes || existing.notes, paperSize: req.body.paperSize || existing.paperSize,
      paymentTerms: req.body.paymentTerms || existing.paymentTerms, docTitle: req.body.docTitle !== undefined ? req.body.docTitle : existing.docTitle,
      showDocTitle: req.body.showDocTitle !== undefined ? req.body.showDocTitle : existing.showDocTitle,
      notesAlign: req.body.notesAlign || existing.notesAlign, qrData: req.body.qrData !== undefined ? req.body.qrData : existing.qrData,
      qrSize: req.body.qrSize || existing.qrSize, qrAlign: req.body.qrAlign || existing.qrAlign, updatedAt: new Date().toISOString(),
    };

    invoices[index] = updated;

    const cust = customers.find((c) => c.id === updated.customerId || c.name === updated.customerName);
    if (cust && cust.recentInvoices) {
      cust.recentInvoices = cust.recentInvoices.filter((r) => r.id !== updated.id);
      cust.recentInvoices.unshift({ id: updated.id, invoiceNumber: updated.invoiceNumber, date: updated.date, dueDate: updated.dueDate, amount: totalAmount, status: updated.status });
    }

    save();
    res.json({ data: updated, message: "Invoice updated successfully" });
  });

  app.patch("/api/invoices/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    // Ownership check
    if (req.session!.role === "tenant" && inv.tenantId !== req.session!.tenantId) {
      auditLog({ action: "authz.cross_tenant_block", tenantId: req.session!.tenantId, ip: getClientIp(req), success: false, detail: `invoice ${id}` });
      return res.status(403).json({ error: "Forbidden: not your resource." });
    }
    const prevStatus = inv.status;
    inv.status = status;
    const cust = customers.find((c) => c.id === inv.customerId || c.name === inv.customerName);
    if (cust) {
      if (prevStatus !== "Paid" && status === "Paid") { cust.outstandingBalance = Math.max(0, cust.outstandingBalance - inv.totalAmount); if (cust.outstandingBalance === 0) cust.status = "PAID"; }
      else if (prevStatus === "Paid" && status !== "Paid") { cust.outstandingBalance += inv.totalAmount; cust.status = status === "Overdue" ? "OVERDUE" : "CURRENT"; }
    }
    save();
    res.json({ data: inv, message: `Invoice status updated to ${status}` });
  });

  app.delete("/api/invoices/:id", (req, res) => {
    const index = invoices.findIndex((i) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Invoice not found" });
    if (req.session!.role === "tenant" && invoices[index].tenantId !== req.session!.tenantId) {
      auditLog({ action: "authz.cross_tenant_block", tenantId: req.session!.tenantId, ip: getClientIp(req), success: false, detail: `invoice ${req.params.id}` });
      return res.status(403).json({ error: "Forbidden: not your resource." });
    }
    const [removed] = invoices.splice(index, 1);
    const cust = customers.find((c) => c.id === removed.customerId || c.name === removed.customerName);
    if (cust && removed.status === "Paid") { cust.outstandingBalance = Math.max(0, cust.outstandingBalance + removed.totalAmount); }
    save();
    res.json({ data: { id: removed.id }, message: "Invoice deleted successfully" });
  });

  // --- PRODUCTS API ---
  app.get("/api/products", (req, res) => {
    res.json({ data: products });
  });

  // --- PLATFORM KPIS & RETRACTED STATS ---
  app.get("/api/kpis", (req, res) => {
    if (req.session!.role === "tenant") {
      const tid = req.session!.tenantId;
      const my = invoices.filter((i) => i.tenantId === tid);
      const totalSales = my.reduce((acc, inv) => acc + inv.totalAmount, 0);
      const paidSales = my.filter((i) => i.status === "Paid").reduce((acc, inv) => acc + inv.totalAmount, 0);
      const unpaidSales = my.filter((i) => i.status === "Unpaid").reduce((acc, inv) => acc + inv.totalAmount, 0);
      const overdueSales = my.filter((i) => i.status === "Overdue").reduce((acc, inv) => acc + inv.totalAmount, 0);
      return res.json({
        data: {
          platform: { totalTenants: 1, activeTenants: 1 },
          tenantDashboard: { totalSales, paidSales, unpaidSales, overdueSales, recentInvoices: my.slice(0, 6) },
        },
      });
    }
    // Admin: full platform stats
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const paidSales = invoices.filter((i) => i.status === "Paid").reduce((acc, inv) => acc + inv.totalAmount, 0);
    const unpaidSales = invoices.filter((i) => i.status === "Unpaid").reduce((acc, inv) => acc + inv.totalAmount, 0);
    const overdueSales = invoices.filter((i) => i.status === "Overdue").reduce((acc, inv) => acc + inv.totalAmount, 0);
    res.json({
      data: {
        platform: platformKPIs,
        tenantDashboard: { totalSales, paidSales, unpaidSales, overdueSales, recentInvoices: invoices.slice(0, 6) },
      },
    });
  });

  app.get("/api/plans", (req, res) => {
    res.json({ data: retainerPlans });
  });

  app.post("/api/inquiries", (req, res) => {
    const { planId, planName, contactEmail, companyName, notes } = req.body;
    res.json({
      success: true,
      message: `Thank you! Your discovery request for ${planName || "Retainer Plan"} has been received. Our Enterprise team will contact ${contactEmail || "you"} within 2 business hours.`,
    });
  });

  app.post("/api/send-invoice", (req, res) => {
    const { invoiceNumber, recipient, channel, message } = req.body;
    res.json({
      success: true,
      message: `Invoice ${invoiceNumber} dispatched via ${channel || "WhatsApp"} to ${recipient || "client"} successfully.`,
      dispatchTime: new Date().toISOString(),
    });
  });

  // --- PUBLIC INVOICE VIEW (uses the system's own #printable-invoice layout + data) ---
  const PAPER = {
    "A4 (Standard)": { w: "210mm", h: "297mm", page: "A4" },
    "A5": { w: "148mm", h: "210mm", page: "A5" },
    "Letter": { w: "8.5in", h: "11in", page: "Letter" },
    "Legal": { w: "8.5in", h: "14in", page: "Legal" },
  };
  // Shared invoice HTML renderer — single source of truth for the invoice design
  // used by both the public view (/i/:number) and the example/sample view.
  const renderInvoiceHtml = (inv: any, tenant: any, cust: any | undefined, opts?: { sample?: boolean }) => {
    const fmt = (n: number) => (n ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 });
    const GREEN = "#006a46";
    const DARK = "#0b1c30";
    const MUTE = "#545f73";
    const paper = PAPER[inv.paperSize as keyof typeof PAPER] || PAPER["A4 (Standard)"];
    const initials = tenant.initials || tenant.name.slice(0, 2).toUpperCase();
    const rows = inv.items.map((it: any) => {
      const amt = (it.amount != null && it.amount !== 0) ? it.amount : (Number(it.quantity || 1) * Number(it.unitPrice || 0));
      return `
      <tr class="item">
        <td>${it.description}</td>
        <td class="ctr">${it.quantity} ${it.sizeUnit || ""}</td>
        <td class="rgt mono">${fmt(it.unitPrice)}</td>
        <td class="ctr mono">${it.taxRate > 0 ? (it.taxRate * 100).toFixed(0) + "%" : "0%"}</td>
        <td class="rgt mono">${fmt(amt)}</td>
      </tr>`;
    }).join("");
    const billLines = [inv.customerAddress, inv.customerPhone && `Tel/WhatsApp: ${inv.customerPhone}`, inv.customerEmail && `Email: ${inv.customerEmail}`, inv.customerTin && `TIN: ${inv.customerTin}`].filter(Boolean).join("<br>");
    const sampleBanner = opts?.sample
      ? `<div style="background:#fff7ed;color:#9a3412;border:1px solid #fdba74;border-radius:10px;padding:10px 14px;margin-bottom:18px;font-size:12px;font-weight:600;text-align:center">SAMPLE / DEMO INVOICE — not a real transaction. For demonstration only.</div>`
      : "";
    const logoHtml = tenant.logoUrl || tenant.customerLogoUrl
      ? `<img class="logo-img" src="${tenant.logoUrl || tenant.customerLogoUrl}" alt="${tenant.name} logo">`
      : `<div class="logo">${initials}</div>`;
    // Respect the per-invoice document title (e.g. "Cash Sale") if set; fall back
    // to the tenant's default invoice title, then to "TAX INVOICE".
    const docTitle = inv.showDocTitle === false
      ? ""
      : (inv.docTitle || tenant.invoiceTitle || "TAX INVOICE");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber} - ${tenant.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${paper.page};margin:0}
  body{font-family:Inter,system-ui,sans-serif;color:${DARK};background:#f0f2f5;padding:24px}
  .sheet{background:#fff;width:${paper.w};min-height:${paper.h};max-width:${paper.w};margin:0 auto;padding:24mm 18mm;border:1px solid #bdcac0;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);position:relative;overflow:hidden}
  .wm{position:absolute;right:40px;top:90px;font-size:64px;font-weight:900;transform:rotate(12deg);border:6px solid currentColor;padding:8px 16px;border-radius:16px;opacity:.08;color:${GREEN};pointer-events:none}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid rgba(11,28,48,.15);padding-bottom:28px;gap:16px}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{width:32px;height:32px;border-radius:8px;background:${GREEN};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
  .logo-img{height:40px;max-width:150px;object-fit:contain;border-radius:6px;display:block}
  h1{font-size:20px;font-weight:800}
  .addr{font-size:12px;color:${MUTE};line-height:1.5;max-width:300px;white-space:pre-line;margin-top:6px}
  .meta{font-size:12px;color:${MUTE};font-family:monospace;line-height:1.6;margin-top:6px}
  .title{font-size:30px;font-weight:900;letter-spacing:1px;color:${GREEN};text-transform:uppercase;text-align:right}
  .invno{font-size:13px;font-weight:700;font-family:monospace;text-align:right;margin-top:4px}
  .dates{font-size:12px;color:${MUTE};text-align:right;margin-top:8px;line-height:1.6}
  .billed{border-bottom:1px solid rgba(11,28,48,.1);padding:22px 0;display:flex;justify-content:space-between;gap:16px}
  .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${MUTE};display:block;margin-bottom:4px}
  .cust{font-weight:700;font-size:14px}
  .custlines{font-size:12px;color:${MUTE};line-height:1.6;margin-top:4px}
  .pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;background:#fef3c7;color:#92400e}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  thead th{font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${DARK};text-align:left;padding:10px 6px;color:${DARK}}
  thead th.ctr{text-align:center}thead th.rgt{text-align:right}
  tbody td{padding:12px 6px;border-bottom:1px solid rgba(189,202,192,.4);font-size:12px}
  tbody td.ctr{text-align:center;font-family:monospace;color:${MUTE}}tbody td.rgt{text-align:right;font-family:monospace;font-weight:700}
  .sum{display:flex;justify-content:space-between;gap:40px;margin-top:24px;border-top:2px solid ${DARK};padding-top:16px}
  .remit{font-size:12px;line-height:1.7}
  .totals{width:260px;font-size:12px}
  .totals .row{display:flex;justify-content:space-between;color:${MUTE};margin-bottom:8px}
  .totaldue{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid ${GREEN};padding-top:8px;color:${GREEN}}
  .totaldue .big{font-size:22px;font-weight:900;font-family:monospace}
  .foot{margin-top:48px;border-top:1px solid rgba(189,202,192,.4);text-align:center;font-size:10px;color:${MUTE};font-family:monospace;padding-top:16px}
  .toolbar{position:fixed;top:10px;right:10px;z-index:50}
  .btn{background:${GREEN};color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
  @media print{.toolbar{display:none!important}html,body{margin:0!important;padding:0!important;background:#fff!important;width:100%!important}.sheet{position:static!important;width:100%!important;max-width:100%!important;min-height:0!important;height:auto!important;margin:0!important;padding:14mm 12mm!important;border:none!important;box-shadow:none!important;border-radius:0!important;page-break-after:avoid;page-break-inside:avoid}}
</style></head>
<body>
  <div class="sheet">
    ${sampleBanner}
    <div class="wm">${inv.status}</div>
    <div class="head">
      <div>
        <div class="brand">${logoHtml}<h1>${tenant.name}</h1></div>
        <div class="addr">${tenant.address || ""}</div>
        <div class="meta"><strong>SST ID:</strong> ${tenant.sstId || "—"}<br><strong>TIN:</strong> ${tenant.tin || "—"}</div>
      </div>
      <div>
        <div class="title">${docTitle}</div>
        <div class="invno">${inv.invoiceNumber}</div>
        <div class="dates"><strong>Date:</strong> ${inv.date}<br><strong>Due Date:</strong> ${inv.dueDate || "Due Upon Receipt"}</div>
      </div>
    </div>
    <div class="billed">
      <div>
        <span class="lbl">Billed To</span>
        <div class="cust">${inv.customerName || (cust && cust.name) || "—"}</div>
        <div class="custlines">${billLines}</div>
      </div>
      <div style="text-align:right">
        <span class="lbl">Payment Status</span>
        <span class="pill">${inv.status}</span>
      </div>
    </div>
    <table>
      <thead><tr><th>Item Description</th><th class="ctr">Qty / Size</th><th class="rgt">Unit Price (${inv.currency})</th><th class="ctr">SST</th><th class="rgt">Total (${inv.currency})</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sum">
      <div class="remit">
        <span class="lbl">Remittance Instructions</span>
        <div class="mono"><strong>Bank:</strong> ${tenant.bankName}</div>
        <div class="mono"><strong>Account Name:</strong> ${tenant.bankTitle || tenant.name}</div>
        <div class="mono"><strong>Account No:</strong> ${tenant.bankAccount}</div>
        ${inv.notes ? `<div style="font-size:11px;color:${MUTE};font-style:italic;margin-top:6px">${inv.notes}</div>` : ""}
      </div>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span class="mono">${inv.currency} ${fmt(inv.subtotal)}</span></div>
        <div class="row"><span>SST (${((inv.taxRate || 0) * 100).toFixed(0)}%):</span><span class="mono">${inv.currency} ${fmt(inv.taxAmount)}</span></div>
        <div class="totaldue"><span class="lbl" style="color:${GREEN}">Total Due:</span><span class="big">${inv.currency} ${fmt(inv.totalAmount)}</span></div>
      </div>
    </div>
    <div class="foot">This is a computer-generated tax invoice issued via BillLah! Cloud Invoicing. No physical signature required.</div>
  </div>
  <div class="toolbar"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
    return html;
  };

  app.get("/i/example", (req, res) => {
    // Clearly-labeled sample/demo invoice rendered with the SAME design as real
    // invoices (spec point 6). It is never mixed with real customer invoices.
    const tenant = tenants[0];
    const sampleInv = {
      invoiceNumber: "INV-SAMPLE-0001",
      customerName: "Sample Customer Sdn Bhd",
      customerAddress: "12 Jalan Demo, Taman Contoh,\n50450 Kuala Lumpur, Malaysia",
      customerPhone: "+60 12-345 6789",
      customerEmail: "sample@customer.my",
      customerTin: "C1234567890",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "Unpaid",
      currency: "RM",
      paperSize: "A4 (Standard)",
      items: [
        { description: "Premium Satin Fabric — Emerald", quantity: 50, sizeUnit: "m", unitPrice: 18.5, taxRate: 0.08, amount: 925 },
        { description: "Custom Logo Printing", quantity: 1, sizeUnit: "job", unitPrice: 120, taxRate: 0.08, amount: 120 },
        { description: "Express Delivery", quantity: 1, sizeUnit: "trip", unitPrice: 35, taxRate: 0.08, amount: 35 },
      ],
      subtotal: 1080,
      taxRate: 0.08,
      taxAmount: 86.4,
      totalAmount: 1166.4,
      notes: "Thank you for your business. Payment due within 30 days.",
    };
    const html = renderInvoiceHtml(sampleInv, tenant, undefined, { sample: true });
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.send(html);
  });

  app.get("/i/:number", (req, res) => {
    // SECURITY: private invoice view requires authentication and tenant
    // ownership (or super admin). No public/unauthenticated access.
    if (!req.session) return res.status(401).send("<h1>Authentication required</h1>");
    const num = String(req.params.number).toLowerCase().replace(/[^a-z0-9]/g, "");
    const inv = invoices.find((i) => i.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "") === num);
    if (!inv) return res.status(404).send("<h1>Invoice not found</h1>");
    if (req.session.role === "tenant" && inv.tenantId !== req.session.tenantId) {
      return res.status(403).send("<h1>Forbidden</h1>");
    }
    const tenant = tenants.find((t) => t.id === inv.tenantId) || initialTenants[0];
    const cust = customers.find((c) => c.id === inv.customerId);
    const html = renderInvoiceHtml(inv, tenant, cust);
    const autoPrint = req.query.autoprint === "1";
    const finalHtml = autoPrint
      ? html.replace("</body>", "<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script></body>")
      : html;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.send(finalHtml);
  });

  // ---------------------------------------------------------------------------
  // WHATSAPP MONETIZABLE MULTI-TENANT SUBSYSTEM (specs 2 & 3)
  // Data is persisted to the JSON store; a real DB / payment provider can be
  // swapped in later. All protected operations go through the entitlement
  // service (no hard-coded plan branching in component code).
  // ---------------------------------------------------------------------------
  const waPlans = store.waPlans;
  const waSubscriptions = store.waSubscriptions;
  const waAccounts = store.waAccounts;
  const waUsage = store.waUsage;
  const waOverrides = store.waOverrides;
  const auditLogs = store.auditLogs;

  const seedWhatsAppForTenant = (tenantId: string) => {
    if (!waUsage.find((u) => u.tenantId === tenantId)) {
      waUsage.push(emptyUsage(tenantId));
    }
  };
  tenants.forEach((t) => seedWhatsAppForTenant(t.id));

  const addAudit = (entry: any) => {
    auditLogs.unshift({ id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), ...entry });
    if (auditLogs.length > 500) auditLogs.length = 500;
  };

  // Plans & Pricing
  app.get("/api/whatsapp/plans", (req, res) => res.json({ data: waPlans }));
  app.post("/api/whatsapp/plans", requireAdmin, (req, res) => {
    const plan = { ...req.body, id: req.body.id || `wa-${Date.now()}` };
    waPlans.push(plan);
    addAudit({ tenantId: "platform", actor: "Super Admin", action: "plan.created", detail: plan.name });
    res.status(201).json({ data: plan });
  });
  app.patch("/api/whatsapp/plans/:id", requireAdmin, (req, res) => {
    const i = waPlans.findIndex((p) => p.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Plan not found" });
    waPlans[i] = { ...waPlans[i], ...req.body };
    addAudit({ tenantId: "platform", actor: "Super Admin", action: "plan.updated", detail: waPlans[i].name });
    res.json({ data: waPlans[i] });
  });
  app.delete("/api/whatsapp/plans/:id", requireAdmin, (req, res) => {
    const i = waPlans.findIndex((p) => p.id === req.params.id);
    if (i >= 0) waPlans.splice(i, 1);
    save();
    res.json({ message: "Plan deleted" });
  });

  // Subscriptions (per tenant) — admin only
  app.get("/api/whatsapp/subscriptions", requireAdmin, (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waSubscriptions.filter((s) => s.tenantId === tenantId) : waSubscriptions;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/subscriptions", requireAdmin, (req, res) => {
    const { tenantId, planId } = req.body;
    const plan = waPlans.find((p) => p.id === planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const start = new Date();
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const sub = {
      tenantId, planId, status: "active", price: plan.monthlyPrice, billingCycle: "monthly",
      subscriptionStart: start.toISOString(), subscriptionEnd: end.toISOString(),
      messageLimit: plan.messageLimit, messagesUsed: 0, aiLimit: plan.aiLimit, aiUsed: 0,
      voiceMinutesLimit: plan.voiceMinutesLimit, voiceMinutesUsed: 0,
      invoiceLimit: plan.invoiceLimit, invoicesUsed: 0, automationLimit: plan.automationLimit, automationsUsed: 0,
    };
    const existing = waSubscriptions.findIndex((s) => s.tenantId === tenantId);
    if (existing >= 0) waSubscriptions[existing] = sub; else waSubscriptions.push(sub);
    seedWhatsAppForTenant(tenantId);
    addAudit({ tenantId, actor: "Super Admin", action: "subscription.activated", detail: `Plan ${plan.name}` });
    save();
    res.status(201).json({ data: sub });
  });
  app.patch("/api/whatsapp/subscriptions/:tenantId", requireAdmin, (req, res) => {
    const i = waSubscriptions.findIndex((s) => s.tenantId === req.params.tenantId);
    if (i === -1) return res.status(404).json({ error: "Subscription not found" });
    waSubscriptions[i] = { ...waSubscriptions[i], ...req.body };
    addAudit({ tenantId: req.params.tenantId, actor: "Super Admin", action: "subscription.updated", detail: JSON.stringify(req.body) });
    save();
    res.json({ data: waSubscriptions[i] });
  });

  // Accounts / connections — admin only
  app.get("/api/whatsapp/accounts", requireAdmin, (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waAccounts.filter((a) => a.tenantId === tenantId) : waAccounts;
    res.json({ data: list });
  });
  app.put("/api/whatsapp/accounts/:tenantId", requireAdmin, (req, res) => {
    const tenantId = req.params.tenantId;
    const i = waAccounts.findIndex((a) => a.tenantId === tenantId);
    const account = {
      tenantId,
      phoneNumber: req.body.phoneNumber || "",
      connectionStatus: req.body.connectionStatus || "disconnected",
      aiEnabled: Boolean(req.body.aiEnabled),
      invoiceGenerationEnabled: Boolean(req.body.invoiceGenerationEnabled),
      automationEnabled: Boolean(req.body.automationEnabled),
      voiceTranscriptionEnabled: Boolean(req.body.voiceTranscriptionEnabled),
      lastActivity: new Date().toISOString(),
    };
    if (i >= 0) waAccounts[i] = account; else waAccounts.push(account);
    addAudit({ tenantId, actor: "Super Admin", action: "account.updated", detail: account.connectionStatus });
    save();
    res.json({ data: account });
  });

  // Usage — tenant sees own; admin sees all
  app.get("/api/whatsapp/usage", (req, res) => {
    const tid = req.session!.role === "tenant" ? req.session!.tenantId : (req.query.tenantId as string | undefined);
    const list = tid ? waUsage.filter((u) => u.tenantId === tid) : waUsage;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/usage/:tenantId/increment", requireAdmin, (req, res) => {
    const u = waUsage.find((x) => x.tenantId === req.params.tenantId);
    if (u) Object.assign(u, req.body);
    save();
    res.json({ data: u });
  });

  // Feature overrides — admin only
  app.get("/api/whatsapp/overrides", requireAdmin, (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waOverrides.filter((o) => o.tenantId === tenantId) : waOverrides;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/overrides", requireAdmin, (req, res) => {
    const ov = { id: `ov-${Date.now()}`, date: new Date().toISOString(), ...req.body };
    waOverrides.push(ov);
    addAudit({ tenantId: ov.tenantId, actor: ov.adminActor || "Super Admin", action: ov.granted ? "feature.granted" : "feature.revoked", detail: ov.feature });
    save();
    res.status(201).json({ data: ov });
  });

  // Audit logs — admin only
  app.get("/api/whatsapp/audit", requireAdmin, (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? auditLogs.filter((a) => a.tenantId === tenantId || a.tenantId === "platform") : auditLogs;
    res.json({ data: list });
  });

  // Centralized entitlement check endpoint (backend authorization layer)
  app.get("/api/whatsapp/entitlement/:tenantId", (req, res) => {
    // Tenants may only query their own tenant. Admin may query any.
    if (req.session!.role === "tenant" && req.params.tenantId !== req.session!.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { feature } = req.query;
    const sub = waSubscriptions.find((s) => s.tenantId === req.params.tenantId);
    const plan = sub && waPlans.find((p) => p.id === sub.planId);
    const account = waAccounts.find((a) => a.tenantId === req.params.tenantId);
    const usage = waUsage.find((u) => u.tenantId === req.params.tenantId);
    const overrides = waOverrides.filter((o) => o.tenantId === req.params.tenantId);
    const { hasFeature, checkUsage, isServiceBlocked } = require("./src/services/whatsappEntitlement");
    const ctx = { subscription: sub, plan, account, usage, overrides };
    const allowed = sub && !isServiceBlocked(sub) && hasFeature(ctx, feature).allowed && checkUsage(ctx, "message").allowed;
    res.json({ allowed: Boolean(allowed), blocked: isServiceBlocked(sub) });
  });

  // Webhook simulation endpoint (admin only; demonstrates protected workflow)
  app.post("/api/whatsapp/webhook/:tenantId", requireAdmin, async (req, res) => {
    const tenantId = req.params.tenantId;
    const sub = waSubscriptions.find((s) => s.tenantId === tenantId);
    const plan = sub && waPlans.find((p) => p.id === sub.planId);
    const account = waAccounts.find((a) => a.tenantId === tenantId);
    const usage = waUsage.find((u) => u.tenantId === tenantId);
    const overrides = waOverrides.filter((o) => o.tenantId === tenantId);
    const { authorize } = require("./src/services/whatsappEntitlement");
    const ctx = { subscription: sub, plan, account, usage, overrides };

    const isVoice = Boolean(req.body?.voice);
    const feature: any = isVoice ? "voice_transcription" : "ai_invoice_generation";
    const gate = authorize(ctx, feature, isVoice ? "voice" : "ai");
    if (!gate.allowed) {
      addAudit({ tenantId, actor: "System", action: "webhook.blocked", detail: gate.reason || "not entitled" });
      return res.status(403).json({ error: gate.reason || "Not entitled" });
    }
    if (usage) {
      if (isVoice) { usage.voiceMessages += 1; usage.voiceMinutes += Number(req.body?.durationSeconds || 0) / 60; }
      else { usage.aiConversations += 1; usage.outgoingMessages += 1; usage.incomingMessages += 1; }
    }
    addAudit({ tenantId, actor: "WhatsApp AI", action: "webhook.processed", detail: isVoice ? "voice transcription" : "text invoice request" });
    save();
    res.json({ ok: true, status: "processed", entitlement: gate });
  });

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS + ACTIVITY LOGS (invoice points 6-9) — persisted to store
  // ---------------------------------------------------------------------------
  const notifications = store.notifications;
  const activityLogs = store.activityLogs;
  const upgradeRequests = store.upgradeRequests;
  const paymentSettings = store.paymentSettings;

  app.get("/api/notifications", (req, res) => {
    const { tenantId, scope } = req.query as { tenantId?: string; scope?: string };
    if (scope === "platform") {
      // Admin center only — require admin.
      if (req.session!.role !== "super_admin") return res.status(403).json({ error: "Forbidden" });
      const list = notifications.filter((n) => n.tenantId === "platform");
      return res.json({ data: list });
    }
    // Tenant sees only their own notifications.
    const tid = req.session!.role === "tenant" ? req.session!.tenantId : (tenantId as string | undefined);
    const list = tid ? notifications.filter((n) => n.tenantId === tid) : (req.session!.role === "super_admin" ? notifications : []);
    res.json({ data: list });
  });

  app.post("/api/notifications", requireAdmin, (req, res) => {
    const entry = { id: `ntf-${Date.now()}`, time: "just now", ...req.body };
    notifications.unshift(entry);
    if (notifications.length > 500) notifications.length = 500;
    save();
    res.status(201).json({ data: entry });
  });

  app.get("/api/activity-logs", (req, res) => {
    // Tenant sees only own; admin sees all.
    const tid = req.session!.role === "tenant" ? req.session!.tenantId : (req.query.tenantId as string | undefined);
    const list = tid ? activityLogs.filter((a) => a.tenantId === tid) : activityLogs;
    res.json({ data: list });
  });

  app.post("/api/activity-logs", requireAdmin, (req, res) => {
    const entry = { id: `act-${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
    activityLogs.unshift(entry);
    if (activityLogs.length > 500) activityLogs.length = 500;
    save();
    res.status(201).json({ data: entry });
  });

  // Plan upgrade requests
  app.get("/api/upgrade-requests", requireAdmin, (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? upgradeRequests.filter((r) => r.tenantId === tenantId) : upgradeRequests;
    res.json({ data: list });
  });
  app.post("/api/upgrade-requests", (req, res) => {
    // Tenant submits their own request; force tenantId from session.
    const tid = req.session!.tenantId;
    if (!tid) return res.status(403).json({ error: "Forbidden" });
    const ref = `UPG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(upgradeRequests.length + 1).padStart(5, "0")}`;
    const reqEntry = {
      id: `upg-${Date.now()}`,
      reference: ref,
      tenantId: tid,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    upgradeRequests.unshift(reqEntry);
    notifications.unshift({
      id: `ntf-admin-${Date.now()}`,
      tenantId: "platform",
      title: "New plan upgrade request",
      desc: `${req.body.tenantName || tid} requested ${req.body.requestedPlanName || "a plan upgrade"} (${ref}).`,
      time: "just now",
      icon: "alert",
      link: { tab: "admin-whatsapp" },
    });
    save();
    res.status(201).json({ data: reqEntry });
  });
  app.patch("/api/upgrade-requests/:id", requireAdmin, (req, res) => {
    const i = upgradeRequests.findIndex((r) => r.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Request not found" });
    upgradeRequests[i] = { ...upgradeRequests[i], ...req.body };
    addAudit({ tenantId: upgradeRequests[i].tenantId, actor: "Super Admin", action: "upgrade.reviewed", detail: req.body.status || "" });
    save();
    res.json({ data: upgradeRequests[i] });
  });

  // Admin payment / bank details — admin only
  app.get("/api/payment-settings", requireAdmin, (req, res) => {
    res.json({ data: paymentSettings });
  });
  app.patch("/api/payment-settings", requireAdmin, (req, res) => {
    Object.assign(paymentSettings, req.body);
    save();
    res.json({ data: paymentSettings });
  });

  // Sound event hook (the frontend plays sounds; this records the event server-side)
  app.post("/api/sound-events", requireAdmin, (req, res) => {
    addAudit({ tenantId: req.body?.tenantId || "platform", actor: "System", action: "sound.played", detail: req.body?.event || "unknown" });
    save();
    res.json({ ok: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BillLah! Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
