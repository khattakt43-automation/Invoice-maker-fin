import express from "express";
import path from "path";
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory data store with seeded initial data
  let tenants: Tenant[] = [...initialTenants];
  let customers: Customer[] = [...initialCustomers];
  let invoices: Invoice[] = [...initialInvoices];
  let products: Product[] = [...initialProducts];
  let platformKPIs = { ...initialPlatformKPIs };
  const retainerPlans = [...initialRetainerPlans];

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
    res.status(201).json({ data: newTenant, message: "Tenant created successfully" });
  });

  app.patch("/api/tenants/:id", (req, res) => {
    const { id } = req.params;
    const index = tenants.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    tenants[index] = { ...tenants[index], ...req.body };
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
    res.status(201).json({ data: newCustomer, message: "Customer created successfully" });
  });

  app.patch("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Customer not found" });
    }

    customers[index] = { ...customers[index], ...req.body };
    res.json({ data: customers[index], message: "Customer updated successfully" });
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

    res.status(201).json({ data: newInvoice, message: "Invoice created successfully" });
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
  const PAPER = {
    "A4 (Standard)": { w: "210mm", h: "297mm", page: "A4" },
    "A5": { w: "148mm", h: "210mm", page: "A5" },
    "Letter": { w: "8.5in", h: "11in", page: "Letter" },
    "Legal": { w: "8.5in", h: "14in", page: "Legal" },
  };
  app.get("/i/:number", (req, res) => {
    const num = String(req.params.number).toLowerCase().replace(/[^a-z0-9]/g, "");
    const inv = invoices.find((i) => i.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "") === num);
    if (!inv) return res.status(404).send("<h1>Invoice not found</h1>");
    const tenant = tenants.find((t) => t.id === inv.tenantId) || initialTenants[0];
    const cust = customers.find((c) => c.id === inv.customerId);
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
    <div class="wm">${inv.status}</div>
    <div class="head">
      <div>
        <div class="brand"><div class="logo">${initials}</div><h1>${tenant.name}</h1></div>
        <div class="addr">${tenant.address || ""}</div>
        <div class="meta"><strong>SST ID:</strong> ${tenant.sstId || "—"}<br><strong>TIN:</strong> ${tenant.tin || "—"}</div>
      </div>
      <div>
        <div class="title">${tenant.invoiceTitle || "TAX INVOICE"}</div>
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
        <div class="mono"><strong>Account Name:</strong> ${tenant.name}</div>
        <div class="mono"><strong>Account No:</strong> ${tenant.bankAccount}</div>
        ${inv.notes ? `<div style="font-size:11px;color:${MUTE};font-style:italic;margin-top:6px">${inv.notes}</div>` : ""}
      </div>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span class="mono">RM ${fmt(inv.subtotal)}</span></div>
        <div class="row"><span>SST (${((inv.taxRate || 0) * 100).toFixed(0)}%):</span><span class="mono">RM ${fmt(inv.taxAmount)}</span></div>
        <div class="totaldue"><span class="lbl" style="color:${GREEN}">Total Due:</span><span class="big">RM ${fmt(inv.totalAmount)}</span></div>
      </div>
    </div>
    <div class="foot">This is a computer-generated tax invoice issued via BillLah! Cloud Invoicing. No physical signature required.</div>
  </div>
  <div class="toolbar"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.send(html);
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
