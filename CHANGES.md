# Changes Made So Far — BillLah! Invoice Maker

This document is a running record of every change, fix, feature, and important
update made to the system. It is updated each time a change is completed so we
can track previous work and revert/restore functionality if something is lost.

---

## 2026-08-23 — 12-Point Invoice System Update

### Implemented / Fixed
1. **Paper Size** — Invoice sheet now responds to A4 / A5 / Letter / Legal (dimensions + on-screen label). All sizes work in preview and print.
2. **Print / PDF fidelity** — Replaced raw `window.print()` with a clone-to-`#print-host` approach so the printed/PDF invoice matches the on-screen preview exactly (layout, spacing, fonts, colors, tables, headers). Added zero-margin `@page` print CSS.
3. **Currency** — Removed hardcoded "RM" in totals/unit/amount. All money now renders through `fmt()` using the selected currency (MYR / USD / SGD / EUR) symbol + code, everywhere on the invoice.
4. **Templates → Admin** — Invoice Maker Templates section added under Super Admin area, marked **Draft**, publishing disabled (coming soon).
5. **Invoice Header & Document Title** — Added per-invoice Document Title (Tax Invoice / Commercial Invoice / Receipt / custom) with a show/hide toggle on the Create Invoice page.
6. **Delete actions** — Added Delete Customer and Delete Invoice buttons, each with a confirmation modal. Added `DELETE /api/customers/:id` and `DELETE /api/invoices/:id` server routes.
7. **Mobile burger menu** — Sidebar is now an off-canvas drawer on mobile (`<lg`); TopAppBar shows a burger button that toggles it; content area uses `lg:ml-64`.
8. **Tenant Admin profile** — Profile tab is now editable (admin name, email, phone) with a profile picture / logo upload.
9. **Help & Support** — Renamed "Resources"/"Support" to **Help & Support**. Support modal now shows Phone `+923333212222`, Email `Khattakt41@gmail.com`, WhatsApp `+923333212222`, a Send Email form (mailto), and a WhatsApp button.
10. **Notes & Payment Terms alignment** — Added Left / Center / Right alignment controls; reflected in preview and print.
11. **Changes Made So Far** — This tracking document + in-app "Changes Made So Far" view.
12. **QR Code component** — Added QR data field with size + Left/Center/Right alignment; renders in preview, print, and PDF (via qrserver API).
13. **Template data-field fixes (re-applied)** — SST label dynamic `SST ({taxAmount>0?8:0}%)`; Bank Account Title (`bankTitle`) on Tenant + seed data + tenant modals + template "Account Name" line.

---

## Earlier (pre-12-point) fixes (carried over)
- Vercel invoice template swapped into `~/Invoice-Maker` serving on :3000.
- Invoice Maker server runs as `node dist/server.cjs` (real API + frontend).
- Olivia Textile site deployed via nginx + SSL on port 3003 (https://oliviatextile.my).
- SST field shows dynamic rate; Bank Account Title field added.

---

## Build & Verification Notes
- All 12 points implemented and verified end-to-end via Playwright (desktop + mobile 390x844):
  - App mounts with zero console/page errors.
  - Paper sizes drive sheet dims; Currency MYR/USD/SGD/EUR render everywhere (no hardcoded RM).
  - Print clones the live sheet so output == preview; QR renders; doc-title toggle works.
  - Delete Customer/Invoice confirm + API routes work; mobile burger opens/closes drawer;
    Super Admin Templates (Draft, publish disabled) + Changes Made views reachable.
  - Notes alignment left/center/right reflected in preview.
- Root-cause bugs fixed during this round:
  - `History` from lucide-react collided with the browser global `History` constructor → app crashed on mount. Renamed import to `HistoryIcon`.
  - Stale hardcoded `#mobile-menu-btn` + `#mobile-backdrop` in `index.html` (z-60) intercepted clicks and did nothing → removed; mobile nav now handled by React TopAppBar burger + SideNavBar drawer.
  - SideNavBar mobile overlay intercepted nav clicks → moved overlay to a sibling (z-40) of the aside (z-50).

---

## Invoice Management follow-up (Tax Invoices → Invoices + UX)
- Header renamed **"Tax Invoices" → "Invoices"** in InvoicesListView.
- **Pagination** added to Invoices and Customers lists: 20 rows/page with prev/next + numbered pages (windowed, ellipsis). Kicks in automatically when >20 rows.
- **Bulk select + bulk delete**: checkbox per row + "select all on page" in the header; a bulk-action bar with "Delete Selected" (calls DELETE per id, syncs customer recentInvoices). Implemented for both invoices and customers (customer bulk delete also drops that customer's invoices).
- **Download / Save-as-PDF** per invoice: a Download button in the Invoices list Action column AND in each customer's Recent Invoices row. Opens a clean printable window and triggers print (save as PDF).
- **Edit from a customer's Recent Invoices no longer duplicates**: server gained `PUT /api/invoices/:id` (replaces existing, syncs customer recentInvoices). Builder now PUTs when editing an existing saved invoice (sentinel id `'NEW'` = create). New invoices-for-customer use `id:'NEW'`.
- **Back-context memory**: `returnTab` + `returnCustomerId` state in App. Editing/saving an invoice (whether from the Invoices list or a customer) auto-routes back to where it was launched (save calls `onBack()` ~350ms after success). Editing from a customer returns to that exact customer (CustomersView auto-opens `openCustomerId`).
- **Recent Invoices actions** now include Edit (returns to customer), Download, Send (Share modal), and the customer Delete button is also in that row.
- Verified end-to-end via Playwright: rename, pagination (page 2), bulk delete (2→1), edit-from-customer (invCount 2→2, no dup), auto-return to correct customer, download/send buttons present, zero console errors.

## message.txt spec — 12 invoice points + WhatsApp monetization architecture
Implemented from message.txt (doc_title_default, doc_title_size, status_colors, draft_autosave, help_nav_dedup, notification_sounds+nav, user_logs, monthly_statement, status_sections, financial_summary, notification_click_nav, whatsapp_monetization).

Invoice features
- Doc Title default + size: InvoiceBuilderView title input + Set as Default button to tenant.defaultDocTitle/defaultDocTitleSize (persisted via PATCH /api/tenants/:id, survives restart). Size selector (Small/Standard/Medium/Large = 36/52/68/88px) drives preview font-size. types.ts gained Tenant.defaultDocTitle/Size and Invoice.docTitleSize.
- Status colors: centralized src/utils/invoiceStatus.ts statusBadgeClass() — Paid = dark-red bg/white (rgb(147,0,10)), Unpaid = dark-red, Draft/Overdue kept. Applied to Invoices list select and Customers recent-invoice badges (shared util, no duplication).
- Draft autosave: InvoiceBuilderView debounced (500ms) localStorage draft keyed billah_draft_<id> (id or NEW); restored on mount for unsaved invoices; cleared on save.
- Help nav dedup: left Help & Support removed from SideNavBar; right standalone button retained.
- Sounds + notifications: src/utils/sound.ts synthesizes notification/invoiceCreated/invoiceDeleted via Web Audio (no binary assets). soundsEnabled persisted in localStorage, toggle in Tenant Settings. TopAppBar notifications clickable to handleNotificationNavigate(link) routes to tab + opens invoice/customer; plays sound on click + on invoice create/delete.
- User Logs: SideNavBar Changes Made replaced by User Logs to UserLogsView (fed by new GET /api/activity-logs). New AppActivityLog/UserActivityLog types; App logs activity on create/delete.
- Customer modules: CustomersView drawer gained Monthly Statement (10), Invoices-by-Status sections (11), Financial Summary (12).

WhatsApp monetization (admin-controllable, no code changes for pricing)
- src/services/whatsappEntitlement.ts: centralized feature/limit/suspension logic; Basic plan to voice_transcription denied, etc. Admin changes flow through API only.
- Server: in-memory stores + routes /api/whatsapp/plans, /subscriptions, /accounts, /usage, /entitlement/:tenant/:feature, /status/:tenant, /suspend, /reactivate, webhook stub. Multi-tenant (filtered by tenantId). GET /api/tenants gained PATCH support for defaults.
- WhatsAppTenantView (entitlement-gated features) and WhatsAppAdminView (plans CRUD, pricing, suspend/reactivate, feature toggles, usage, audit) added. Voice/AI/automation are demo-mode (honest placeholder — real Meta/webhook needs provider credentials).

Critical bug fixed during verification
- New tab views (user-logs/whatsapp/admin-whatsapp) rendered blank when placed AFTER the role-gated fragments in main. Moved them to the TOP of main (before the business/super-admin fragments) — they now render reliably. ViewErrorBoundary was added then removed (not needed). handleUpdateTenant changed PUT to PATCH to match the existing server route.

Verification: full Playwright E2E (no errors) confirmed all 12 points: doc default E2E Default persisted + 4 size options, status bg rgb(147,0,10), draft autosave survived navigate-away, help-left removed / help-right present, sounds toggle present, notification-click navigation, user-logs/whatsapp/admin-whatsapp views all render, customer statement/status/financial modules present. Server live at http://169.58.152.117:3000.

---

## 2026-08-24 — 4-Document Master Spec (persistence + notifications + landing + reporting + plan upgrade)

### CRITICAL FIX — Data Persistence (spec points 14-21, "tenants disappearing")
**Root cause:** the server kept ALL business data (tenants, customers, invoices, products, plans, WhatsApp, notifications, upgrade requests, payment settings) in in-memory arrays seeded from static data. Every server restart reset everything → tenants "disappeared". There was no database.

**Fix:** added `src/server/db.ts` — a write-through JSON store (`data/store.json`).
- Seeds once from the existing mock data, then persists every mutation to disk (write-through on create/update/delete).
- Every read re-loads from disk, so restarts preserve all data.
- No native deps required (sqlite was not installed); uses `fs` + `JSON`.
- Verified: created Test A + Test B tenants, killed the server, restarted — both still present (count persisted). Repeated across multiple restarts. Refresh/navigation never deletes data.

### Context-Aware Notifications (spec points 1-3)
- TopAppBar notifications now fetch from `/api/notifications` instead of a hardcoded array.
- **Tenant role** → only that tenant's notifications (isolated by `tenantId`).
- **Super Admin role** → `?scope=platform` returns only platform/admin-level events (e.g. "New tenant created", upgrade requests). Tenant operational notifications are NOT shown in the admin center.
- Server auto-creates an admin notification when a tenant is created.

### Tenant Default Landing Page (spec point 1 of landing doc)
- `handleSignIn` now routes `business_admin` to **Create Invoice** (`#invoice-builder-container`); admin unchanged (admin-overview). Verified via E2E: tenant login lands on the invoice builder.

### Monthly Statement (spec points 4-5)
- Date defaults to the **current system date** (`new Date()`), never hard-coded.
- Month selector offers the **last 12 months** (system-date based) plus any months that actually have invoice data. No fake statement data for empty months.

### Example / Preview Invoice (spec point 6)
- New `GET /i/example` server route renders a clearly-labeled **SAMPLE / DEMO INVOICE** using the SAME template as real invoices (never mixed with real data).
- "Example Invoice" button added to the Invoices list header (opens `/i/example`).

### Invoice Preview = PDF (spec points 7-8)
- Extracted invoice HTML into a single `renderInvoiceHtml()` helper used by BOTH `/i/:number` and `/i/example` → one source of truth.
- InvoicesListView "Download" now opens the same server-rendered branded invoice (Save as PDF) — no more divergent inline template. Paper size (A4 default) respected; currency dynamic (not hardcoded RM).

### Plan / WhatsApp Monetization Help Text (spec points 9-13)
- `WhatsAppAdminView` Plans editor now shows info icons + concise explanations for every complex setting: Message Limit, AI Limit, Voice Min Limit (one-way customer to transcription, no voice reply), Invoice Limit, Automation Limit, Max Numbers. Wording matches the actual implementation.

### Tenant Plan Upgrade + Payment + Admin Verification (spec points 21-40)
- New `TenantPlanView` (`#tenant-plan-view`, "My Plan" nav item): shows current plan + live usage bars, available upgrade plans (from admin config), admin bank/QR payment details, and a payment-submission form (amount, txn id, date, proof). Submitting creates an upgrade request (status `pending`).
- Admin: new **Requests** tab in WhatsApp Monetization shows all upgrade requests with Approve/Reject. Approving/rejecting PATCHes the request; tenant sees the status ("Pending verification" / approved / rejected). Voice remains one-way.
- Server: `/api/upgrade-requests` (GET/POST/PATCH) persisted; admin notification on new request.

### Tenant Reporting (spec points 7-16 of reporting doc)
- Rewrote `ReportsView` from SST/customs-focused to a **business report** using the tenant's REAL invoice data (tenant-isolated):
  - Summary cards: Total Sales, Collected, Outstanding, Overdue + invoice counts by status.
  - Date-range filters: Today / Yesterday / This Week / Last Week / This Month / Last Month / This Quarter / Last Quarter / This Year / Last Year / All Time (system-date based, not hard-coded).
  - Grouping: day / week / month / quarter / year with a sales-trend bar chart.
  - Top Customers + Top Products.
  - **Export CSV** and **Export PDF** buttons (respect current range/filters; open a printable report window).
  - No tax/customs/LHDN content (matches the business scope).

### Responsive UI (spec points 4-24 of mobile doc)
- Sidebar already an off-canvas drawer on `<lg` with burger toggle (from prior round).
- Made Create-Invoice item/form grids responsive: `grid-cols-3` to `grid-cols-2 sm:grid-cols-3`; `grid-cols-2` blocks to `grid-cols-1 sm:grid-cols-2` so two-column forms stack on mobile. Main container uses `min-w-0` to prevent flex overflow; wide tables wrapped in `overflow-x-auto`.

### Build & Verification
- `npm run build` clean (frontend 976kb, server 63.6kb). No console/page errors in E2E.
- Playwright E2E (1280x900) confirmed: tenant lands on Create Invoice; My Plan view with real admin plans; business Reports with CSV/PDF export and no SST content; super-admin role switch; plan editor help text; admin Plan Upgrade Requests tab; example invoice SAMPLE label.
- Persistence verified at API + restart level (tenants survive kill/restart repeatedly).

### NOT YET DONE / honest gaps
- Push to GitHub is **blocked**: no `ghp_`/PAT token present in this environment. Code is committed locally (unpushed) — awaiting a classic repo-scoped PAT to push to `khattakt43-automation/Invoice-maker-fin`.
- WhatsApp live Meta/AI connectivity remains a demo workflow (requires provider credentials); entitlement + usage tracking is real.
- Admin "Payment Settings" (bank/QR) UI: server route + data model exist (`/api/payment-settings`); a dedicated admin Settings form was not added this round (payment details currently default empty until configured).

---

## 2026-08-24 — Tenant login landing + refresh page retention

User requests:
1. **Tenant login always lands on Create Invoice** — `handleSignIn` already set `activeTab='create-invoice'`
   for `business_admin`; now that state is persisted so it survives a refresh too.
2. **Refresh keeps the user on the same page** — added session persistence:

**Changes (`src/App.tsx`):**
- `currentRole` / `activeTab` initializers now read the last session from `sessionStorage`
  (`billah_session_v1`) so a refresh restores the exact page + role the user was on.
- A `useEffect` re-persists `{role, tenantId, tab}` to `sessionStorage` on every change
  (navigation, login, role switch, impersonate, invoice open).
- `loadData` restores the active tenant from the saved `tenantId` (falls back to first tenant).
- Verified via Playwright: tenant login → Create Invoice; navigating to Customers then refresh
  keeps the user on Customers (not dashboard); active tenant correctly restored.

**Cleanup:** removed the stray test tenant `NullCur Test Co` (currency:null) directly from
`data/store.json`. It had become `tenants[0]` and was the broken tenant shown in the user's
screenshot. First tenant is now `Admin Note Test Co`. (Note: the currency-normalization db fix
from the reverted round is intentionally NOT reapplied — only the requested login/refresh behavior
was changed here.)

## Multi-tenant isolation + settings persistence (root-cause fixes)

Investigated and fixed two critical multi-tenant bugs from the master prompt.

### Bug 1 — Refresh switched to another tenant (root cause: `useRef(() => ...)`)
`useRef` does NOT lazy-initialize — `useRef(() => {...})` stored the *function* as
`.current`, not the saved tenant id. After a refresh `tenantIdRef.current` was a function
(truthy but not an id), so `loadData` fell back to `tenants[0]`. Also the active tenant was
restored from a `sessionStorage` value that the mount-time persist effect could clobber with
`initialTenants[0]`.
Fix:
- Derive the saved tenant id via `useState` lazy init, pass to `useRef` (`App.tsx`).
- `loadData` now restores the EXACT authorized tenant from `tenantIdRef` (the one chosen at
  login) and NEVER defaults to `tenants[0]`. If there is no saved session it leaves the
  tenant unselected so the auth screen handles it.
- `handleSignIn`/`handleImpersonateTenant`/`handleSwitchRole` set `tenantIdRef.current`;
  `handleLogout` clears it (no stale reuse).
- `loadData` now scopes `/api/invoices` and `/api/customers` by `?tenantId=...`; the
  invoice-saved customer re-fetch is also scoped. Dashboard/Reports now only show the
  logged-in tenant's data (real isolation, not just frontend filtering).

### Bug 2 — Tenant settings / logo disappeared after logout/login (root cause: 413)
`app.use(express.json())` had the default **100kb** body limit. A base64 logo PNG exceeds it,
so the PATCH returned **413 Payload Too Large** and was silently swallowed — the logo never
reached the server. On logout/login the server returned the tenant without the logo.
Fix:
- Raised body-parser limit to 25mb (`express.json({ limit: '25mb' })`).
- `TenantSettingsView.handleSave` now checks the PATCH response and shows a real
  **"Save failed"** banner on HTTP error instead of always claiming success (spec 16).
- Added a sync effect so the settings form always reflects the latest server record after a
  save / refresh (spec 17) — fixes the case where a fast refresh showed stale initial state.

Verified via Playwright + API:
- Login as non-first tenant → refresh → stays on that tenant (no switch to tenants[0]).
- Switch tenant → refresh → stays on new tenant.
- Tenant A refresh never loads Tenant B; invoices/customers API are scoped by tenantId.
- Save invoice title → refresh → persists; logout/login → persists.
- Upload base64 logo → refresh → logo persists (written to store.json).
- Cross-tenant isolation: Acme invoices are all tenantId=Acme; Maya all tenantId=Maya.
