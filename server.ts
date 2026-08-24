import express from "express";
import path from "path";
import fs from "fs";
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
import { InvoiceDocument } from "./src/components/InvoiceDocument";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

// Seed WhatsApp entitlement defaults (kept for type references in this file).
import { emptyUsage } from "./src/services/whatsappEntitlement";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

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
    res.json({ data: tenants });
  });

  app.post("/api/tenants", (req, res) => {
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      code: `TEN-${String(Math.floor(1000 + Math.random() * 9000))}`,
      name: req.body.name || "New Business Sdn Bhd",
      initials: req.body.initials || (req.body.name ? req.body.name.substring(0, 2).toUpperCase() : "NB"),
      username: req.body.username || req.body.adminEmail?.split('@')[0] || "tenantadmin",
      password: req.body.password || "Password123!",
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
    // Admin notification: new tenant created (context-aware, platform-scoped)
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
    res.status(201).json({ data: newTenant, message: "Tenant created successfully" });
  });

  app.patch("/api/tenants/:id", (req, res) => {
    const { id } = req.params;
    const index = tenants.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const prev = tenants[index];
    tenants[index] = { ...tenants[index], ...req.body };
    // Notify admin on suspension / reactivation changes
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
    res.json({ data: tenants[index], message: "Tenant updated successfully" });
  });

  // --- CUSTOMERS API ---
  app.get("/api/customers", (req, res) => {
    const { tenantId, search, sortBy } = req.query;
    let filtered = [...customers];

    if (tenantId) {
      filtered = filtered.filter((c) => c.tenantId === tenantId);
    }

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

    if (sortBy === "Name (A-Z)") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Recent Activity") {
      filtered.sort((a, b) => b.ltv - a.ltv);
    } else {
      // Default: Outstanding Balance descending
      filtered.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    }

    res.json({ data: filtered });
  });

  app.post("/api/customers", (req, res) => {
    const initials = req.body.name
      ? req.body.name
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "CU";

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      tenantId: req.body.tenantId || "tenant-tech-solutions",
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
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Customer not found" });
    }

    customers[index] = { ...customers[index], ...req.body };
    save();
    res.json({ data: customers[index], message: "Customer updated successfully" });
  });

  app.delete("/api/customers/:id", (req, res) => {
    const index = customers.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const [removed] = customers.splice(index, 1);
    save();
    res.json({ data: removed, message: "Customer deleted successfully" });
  });

  // --- INVOICES API ---
  app.get("/api/invoices", (req, res) => {
    const { tenantId, status, customerId } = req.query;
    let filtered = [...invoices];

    if (tenantId) {
      filtered = filtered.filter((i) => i.tenantId === tenantId);
    }
    if (status && status !== "All") {
      filtered = filtered.filter((i) => i.status.toLowerCase() === String(status).toLowerCase());
    }
    if (customerId) {
      filtered = filtered.filter((i) => i.customerId === customerId);
    }

    res.json({ data: filtered });
  });

  app.post("/api/invoices", (req, res) => {
    const invCount = invoices.length + 1;
    const invNumber = req.body.invoiceNumber || `INV-2023-${String(1040 + invCount)}`;
    
    const subtotal = (req.body.items || []).reduce(
      (acc: number, item: any) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
      0
    );
    const taxRate = req.body.taxRate !== undefined ? Number(req.body.taxRate) : 0.0;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      tenantId: req.body.tenantId || "tenant-tech-solutions",
      customerId: req.body.customerId || "cust-custom",
      customerName: req.body.customerName || "Customer Name",
      customerEmail: req.body.customerEmail || "",
      customerPhone: req.body.customerPhone || "",
      customerAddress: req.body.customerAddress || "",
      customerTin: req.body.customerTin || "C1234567890",
      date: req.body.date || new Date().toISOString().split("T")[0],
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      items: req.body.items || [],
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: req.body.currency || "MYR",
      status: req.body.status || "Unpaid",
      notes: req.body.notes || "Thank you for your business.",
      paperSize: req.body.paperSize || "A4 (Standard)",
      paymentTerms: req.body.paymentTerms || "Payment due within 30 days.",
      docTitle: req.body.docTitle,
      showDocTitle: req.body.showDocTitle !== undefined ? req.body.showDocTitle : true,
      notesAlign: req.body.notesAlign || "left",
      qrData: req.body.qrData || "",
      qrSize: req.body.qrSize || 110,
      qrAlign: req.body.qrAlign || "right",
      createdAt: new Date().toISOString(),
    };

    invoices.unshift(newInvoice);

    // Update customer outstanding & LTV
    const customer = customers.find((c) => c.id === newInvoice.customerId || c.name === newInvoice.customerName);
    if (customer) {
      if (newInvoice.status !== "Paid") {
        customer.outstandingBalance += totalAmount;
        customer.status = "CURRENT";
      }
      customer.ltv += totalAmount;
      if (!customer.recentInvoices) customer.recentInvoices = [];
      customer.recentInvoices.unshift({
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        date: newInvoice.date,
        dueDate: newInvoice.dueDate,
        amount: totalAmount,
        status: newInvoice.status,
      });
    }

    save();
    res.status(201).json({ data: newInvoice, message: "Invoice created successfully" });
  });

  app.put("/api/invoices/:id", (req, res) => {
    const index = invoices.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const existing = invoices[index];
    const subtotal = (req.body.items || []).reduce(
      (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
      0
    );
    const taxRate = req.body.taxRate !== undefined ? Number(req.body.taxRate) : existing.taxRate;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const updated: Invoice = {
      ...existing,
      invoiceNumber: req.body.invoiceNumber || existing.invoiceNumber,
      tenantId: req.body.tenantId || existing.tenantId,
      customerId: req.body.customerId || existing.customerId,
      customerName: req.body.customerName || existing.customerName,
      customerEmail: req.body.customerEmail || existing.customerEmail,
      customerPhone: req.body.customerPhone || existing.customerPhone,
      customerAddress: req.body.customerAddress || existing.customerAddress,
      customerTin: req.body.customerTin || existing.customerTin,
      date: req.body.date || existing.date,
      dueDate: req.body.dueDate || existing.dueDate,
      items: req.body.items || existing.items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: req.body.currency || existing.currency,
      status: req.body.status || existing.status,
      notes: req.body.notes || existing.notes,
      paperSize: req.body.paperSize || existing.paperSize,
      paymentTerms: req.body.paymentTerms || existing.paymentTerms,
      docTitle: req.body.docTitle !== undefined ? req.body.docTitle : existing.docTitle,
      showDocTitle: req.body.showDocTitle !== undefined ? req.body.showDocTitle : existing.showDocTitle,
      notesAlign: req.body.notesAlign || existing.notesAlign,
      qrData: req.body.qrData !== undefined ? req.body.qrData : existing.qrData,
      qrSize: req.body.qrSize || existing.qrSize,
      qrAlign: req.body.qrAlign || existing.qrAlign,
      updatedAt: new Date().toISOString(),
    };

    invoices[index] = updated;

    // Keep the customer recentInvoices entry in sync
    const cust = customers.find((c) => c.id === updated.customerId || c.name === updated.customerName);
    if (cust && cust.recentInvoices) {
      cust.recentInvoices = cust.recentInvoices.filter((r) => r.id !== updated.id);
      cust.recentInvoices.unshift({
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        date: updated.date,
        dueDate: updated.dueDate,
        amount: totalAmount,
        status: updated.status,
      });
    }

    save();
    res.json({ data: updated, message: "Invoice updated successfully" });
  });

  app.patch("/api/invoices/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const inv = invoices.find((i) => i.id === id);
    if (!inv) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const prevStatus = inv.status;
    inv.status = status;

    // Adjust customer balance
    const cust = customers.find((c) => c.id === inv.customerId || c.name === inv.customerName);
    if (cust) {
      if (prevStatus !== "Paid" && status === "Paid") {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - inv.totalAmount);
        if (cust.outstandingBalance === 0) cust.status = "PAID";
      } else if (prevStatus === "Paid" && status !== "Paid") {
        cust.outstandingBalance += inv.totalAmount;
        cust.status = status === "Overdue" ? "OVERDUE" : "CURRENT";
      }
    }

    res.json({ data: inv, message: `Invoice status updated to ${status}` });
  });

  app.delete("/api/invoices/:id", (req, res) => {
    const index = invoices.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const [removed] = invoices.splice(index, 1);
    // Revert customer balance if it was paid
    const cust = customers.find((c) => c.id === removed.customerId || c.name === removed.customerName);
    if (cust && removed.status === "Paid") {
      cust.outstandingBalance = Math.max(0, cust.outstandingBalance + removed.totalAmount);
    }
    save();
    res.json({ data: removed, message: "Invoice deleted successfully" });
  });

  // --- PRODUCTS API ---
  app.get("/api/products", (req, res) => {
    res.json({ data: products });
  });

  // --- PLATFORM KPIS & RETRACTED STATS ---
  app.get("/api/kpis", (req, res) => {
    // Dynamic recalculation
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const paidSales = invoices.filter((i) => i.status === "Paid").reduce((acc, inv) => acc + inv.totalAmount, 0);
    const unpaidSales = invoices.filter((i) => i.status === "Unpaid").reduce((acc, inv) => acc + inv.totalAmount, 0);
    const overdueSales = invoices.filter((i) => i.status === "Overdue").reduce((acc, inv) => acc + inv.totalAmount, 0);

    res.json({
      data: {
        platform: platformKPIs,
        tenantDashboard: {
          totalSales,
          paidSales,
          unpaidSales,
          overdueSales,
          recentInvoices: invoices.slice(0, 6),
        },
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
  // ---------------------------------------------------------------------------
  // INVOICE PUBLIC VIEW (single source of truth = src/components/InvoiceDocument)
  // The SAME component renders the live builder preview, so the downloaded PDF
  // is pixel-identical to what the user sees on screen.
  // ---------------------------------------------------------------------------
  // Read the built Tailwind CSS once at startup so the SSR invoice is styled.
  let invoiceCss = '';
  try {
    const cssDir = path.join(process.cwd(), 'dist', 'assets');
    const cssFile = fs.readdirSync(cssDir).find((f) => f.endsWith('.css'));
    if (cssFile) invoiceCss = fs.readFileSync(path.join(cssDir, cssFile), 'utf8');
  } catch { /* dev mode: no built css yet */ }

  const renderInvoicePage = (inv: any, tenant: any, cust: any, opts?: { sample?: boolean }) => {
    const body = renderToStaticMarkup(
      React.createElement(InvoiceDocument, { tenant, invoice: inv, customer: cust, sample: opts?.sample })
    );
    return `<!doctype html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber} - ${tenant?.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:0}
  body{background:#f0f2f5;padding:24px;font-family:Inter,system-ui,sans-serif}
  .inv-wrap{display:flex;justify-content:center}
  ${invoiceCss}
  @media print{html,body{margin:0!important;padding:0!important;background:#fff!important}#print-host{position:static!important}#printable-invoice{margin:0 auto!important;box-shadow:none!important;border-radius:0!important}}
</style></head>
<body>
  <div class="inv-wrap"><div id="print-host">${body}</div></div>
  <div style="position:fixed;top:10px;right:10px;z-index:50"><button onclick="window.print()" style="background:#006a46;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Print / Save as PDF</button></div>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script>
</body></html>`;
  };

  app.get("/i/example", (req, res) => {
    // Clearly-labeled sample/demo invoice rendered with the SAME design as real
    // invoices (spec point 6). It is never mixed with real customer invoices.
    const tenant = store.tenants[0];
    const sampleInv = {
      invoiceNumber: "INV-SAMPLE-0001",
      customerName: "Sample Customer Sdn Bhd",
      customerAddress: "12 Jalan Demo, Taman Contoh,\n50450 Kuala Lumpur, Malaysia",
      customerPhone: "+60 12-345 6789",
      customerEmail: "sample@customer.my",
      customerTin: "C1234567890",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      hasDueDate: true,
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
      showDocTitle: true,
      docTitle: "TAX INVOICE",
      docTitleSize: 30,
    };
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.send(renderInvoicePage(sampleInv, tenant, undefined, { sample: true }));
  });

  app.get("/i/:number", (req, res) => {
    const num = String(req.params.number).toLowerCase().replace(/[^a-z0-9]/g, "");
    const inv = store.invoices.find((i) => i.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "") === num);
    if (!inv) return res.status(404).send("<h1>Invoice not found</h1>");
    const tenant = store.tenants.find((t) => t.id === inv.tenantId) || initialTenants[0];
    const cust = store.customers.find((c) => c.id === inv.customerId);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.send(renderInvoicePage({ ...inv, hasDueDate: Boolean(inv.dueDate && inv.dueDate.trim().length > 0) }, tenant, cust));
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
  app.post("/api/whatsapp/plans", (req, res) => {
    const plan = { ...req.body, id: req.body.id || `wa-${Date.now()}` };
    waPlans.push(plan);
    addAudit({ tenantId: "platform", actor: "Super Admin", action: "plan.created", detail: plan.name });
    res.status(201).json({ data: plan });
  });
  app.patch("/api/whatsapp/plans/:id", (req, res) => {
    const i = waPlans.findIndex((p) => p.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Plan not found" });
    waPlans[i] = { ...waPlans[i], ...req.body };
    addAudit({ tenantId: "platform", actor: "Super Admin", action: "plan.updated", detail: waPlans[i].name });
    res.json({ data: waPlans[i] });
  });
  app.delete("/api/whatsapp/plans/:id", (req, res) => {
    const i = waPlans.findIndex((p) => p.id === req.params.id);
    if (i >= 0) waPlans.splice(i, 1);
    save();
    res.json({ message: "Plan deleted" });
  });

  // Subscriptions (per tenant)
  app.get("/api/whatsapp/subscriptions", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waSubscriptions.filter((s) => s.tenantId === tenantId) : waSubscriptions;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/subscriptions", (req, res) => {
    const { tenantId, planId } = req.body;
    const plan = waPlans.find((p) => p.id === planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const start = new Date();
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const sub = {
      tenantId,
      planId,
      status: "active",
      price: plan.monthlyPrice,
      billingCycle: "monthly",
      subscriptionStart: start.toISOString(),
      subscriptionEnd: end.toISOString(),
      messageLimit: plan.messageLimit,
      messagesUsed: 0,
      aiLimit: plan.aiLimit,
      aiUsed: 0,
      voiceMinutesLimit: plan.voiceMinutesLimit,
      voiceMinutesUsed: 0,
      invoiceLimit: plan.invoiceLimit,
      invoicesUsed: 0,
      automationLimit: plan.automationLimit,
      automationsUsed: 0,
    };
    const existing = waSubscriptions.findIndex((s) => s.tenantId === tenantId);
    if (existing >= 0) waSubscriptions[existing] = sub; else waSubscriptions.push(sub);
    seedWhatsAppForTenant(tenantId);
    addAudit({ tenantId, actor: "Super Admin", action: "subscription.activated", detail: `Plan ${plan.name}` });
    save();
    res.status(201).json({ data: sub });
  });
  app.patch("/api/whatsapp/subscriptions/:tenantId", (req, res) => {
    const i = waSubscriptions.findIndex((s) => s.tenantId === req.params.tenantId);
    if (i === -1) return res.status(404).json({ error: "Subscription not found" });
    waSubscriptions[i] = { ...waSubscriptions[i], ...req.body };
    addAudit({ tenantId: req.params.tenantId, actor: "Super Admin", action: "subscription.updated", detail: JSON.stringify(req.body) });
    save();
    res.json({ data: waSubscriptions[i] });
  });

  // Accounts / connections
  app.get("/api/whatsapp/accounts", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waAccounts.filter((a) => a.tenantId === tenantId) : waAccounts;
    res.json({ data: list });
  });
  app.put("/api/whatsapp/accounts/:tenantId", (req, res) => {
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

  // Usage
  app.get("/api/whatsapp/usage", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waUsage.filter((u) => u.tenantId === tenantId) : waUsage;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/usage/:tenantId/increment", (req, res) => {
    const u = waUsage.find((x) => x.tenantId === req.params.tenantId);
    if (u) Object.assign(u, req.body);
    save();
    res.json({ data: u });
  });

  // Feature overrides
  app.get("/api/whatsapp/overrides", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? waOverrides.filter((o) => o.tenantId === tenantId) : waOverrides;
    res.json({ data: list });
  });
  app.post("/api/whatsapp/overrides", (req, res) => {
    const ov = { id: `ov-${Date.now()}`, date: new Date().toISOString(), ...req.body };
    waOverrides.push(ov);
    addAudit({ tenantId: ov.tenantId, actor: ov.adminActor || "Super Admin", action: ov.granted ? "feature.granted" : "feature.revoked", detail: ov.feature });
    save();
    res.status(201).json({ data: ov });
  });

  // Audit logs
  app.get("/api/whatsapp/audit", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? auditLogs.filter((a) => a.tenantId === tenantId || a.tenantId === "platform") : auditLogs;
    res.json({ data: list });
  });

  // Centralized entitlement check endpoint (backend authorization layer)
  app.get("/api/whatsapp/entitlement/:tenantId", (req, res) => {
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

  // Webhook simulation endpoint (voice -> transcription -> invoice pipeline)
  // NOTE: real WhatsApp/AI connectivity requires credentials; this endpoint
  // demonstrates the protected workflow + entitlement gating + usage tracking.
  app.post("/api/whatsapp/webhook/:tenantId", async (req, res) => {
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
    // Track usage
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
      // Admin center: only platform/admin-level events, never tenant operations.
      const list = notifications.filter((n) => n.tenantId === "platform");
      return res.json({ data: list });
    }
    const list = tenantId ? notifications.filter((n) => n.tenantId === tenantId) : notifications;
    res.json({ data: list });
  });

  app.post("/api/notifications", (req, res) => {
    const entry = { id: `ntf-${Date.now()}`, time: "just now", ...req.body };
    notifications.unshift(entry);
    if (notifications.length > 500) notifications.length = 500;
    save();
    res.status(201).json({ data: entry });
  });

  app.get("/api/activity-logs", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? activityLogs.filter((a) => a.tenantId === tenantId) : activityLogs;
    res.json({ data: list });
  });

  app.post("/api/activity-logs", (req, res) => {
    const entry = { id: `act-${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
    activityLogs.unshift(entry);
    if (activityLogs.length > 500) activityLogs.length = 500;
    save();
    res.status(201).json({ data: entry });
  });

  // Plan upgrade requests (tenant submits payment; admin verifies)
  app.get("/api/upgrade-requests", (req, res) => {
    const { tenantId } = req.query;
    const list = tenantId ? upgradeRequests.filter((r) => r.tenantId === tenantId) : upgradeRequests;
    res.json({ data: list });
  });
  app.post("/api/upgrade-requests", (req, res) => {
    const ref = `UPG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(upgradeRequests.length + 1).padStart(5, "0")}`;
    const reqEntry = {
      id: `upg-${Date.now()}`,
      reference: ref,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    upgradeRequests.unshift(reqEntry);
    notifications.unshift({
      id: `ntf-admin-${Date.now()}`,
      tenantId: "platform",
      title: "New plan upgrade request",
      desc: `${req.body.tenantName || req.body.tenantId} requested ${req.body.requestedPlanName || "a plan upgrade"} (${ref}).`,
      time: "just now",
      icon: "alert",
      link: { tab: "admin-whatsapp" },
    });
    save();
    res.status(201).json({ data: reqEntry });
  });
  app.patch("/api/upgrade-requests/:id", (req, res) => {
    const i = upgradeRequests.findIndex((r) => r.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Request not found" });
    upgradeRequests[i] = { ...upgradeRequests[i], ...req.body };
    addAudit({ tenantId: upgradeRequests[i].tenantId, actor: "Super Admin", action: "upgrade.reviewed", detail: req.body.status || "" });
    save();
    res.json({ data: upgradeRequests[i] });
  });

  // Admin payment / bank details
  app.get("/api/payment-settings", (req, res) => {
    res.json({ data: paymentSettings });
  });
  app.patch("/api/payment-settings", (req, res) => {
    Object.assign(paymentSettings, req.body);
    save();
    res.json({ data: paymentSettings });
  });

  // Sound event hook (the frontend plays sounds; this records the event server-side)
  app.post("/api/sound-events", (req, res) => {
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
