import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Plus,
  Trash2,
  Check,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Customer, Invoice, InvoiceItem, Product, Tenant } from '../types';
import { SendInvoiceModal } from './SendInvoiceModal';
import { generateUniqueInvoiceNumber } from '../utils/invoiceUtils';

interface InvoiceBuilderViewProps {
  tenant: Tenant;
  customers: Customer[];
  products: Product[];
  existingInvoices?: Invoice[];
  initialInvoice?: Invoice | null;
  onBack: () => void;
  returnCustomerId?: string | null;
  onInvoiceSaved: (invoice: Invoice) => void;
  onSetDefaultTitle?: (title: string, size: number) => void;
}

export const InvoiceBuilderView: React.FC<InvoiceBuilderViewProps> = ({
  tenant,
  customers,
  products,
  existingInvoices = [],
  initialInvoice,
  onBack,
  onInvoiceSaved,
  onSetDefaultTitle,
}) => {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialInvoice?.customerId || ''
  );
  const [customerName, setCustomerName] = useState(
    initialInvoice?.customerName || ''
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialInvoice?.customerEmail || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialInvoice?.customerPhone || ''
  );
  const [customerAddress, setCustomerAddress] = useState(
    initialInvoice?.customerAddress || ''
  );
  const [customerTin, setCustomerTin] = useState(
    initialInvoice?.customerTin || ''
  );

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || generateUniqueInvoiceNumber(existingInvoices)
  );
  const [date, setDate] = useState(
    initialInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [hasDueDate, setHasDueDate] = useState<boolean>(
    Boolean(initialInvoice ? initialInvoice.dueDate && initialInvoice.dueDate.trim().length > 0 : true)
  );
  const [currency, setCurrency] = useState<'MYR' | 'USD' | 'SGD'>(
    initialInvoice?.currency || 'MYR'
  );
  const [paperSize, setPaperSize] = useState<'A4 (Standard)' | 'A5' | 'Letter' | 'Legal'>(
    initialInvoice?.paperSize || 'A4 (Standard)'
  );
  const [status, setStatus] = useState<Invoice['status']>(
    initialInvoice?.status || 'Unpaid'
  );
  const [notes, setNotes] = useState(
    initialInvoice?.notes ||
      `Payment is due within 30 days. Please transfer to ${tenant.bankName} Acc: ${tenant.bankAccount} (${tenant.name}).`
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialInvoice?.paymentTerms || `Payment due in 30 days. ${tenant.bankName} Acc: ${tenant.bankAccount}`
  );

  // Per-invoice document title (header) + show/hide toggle (Point 5)
  const [docTitle, setDocTitle] = useState(initialInvoice?.docTitle || tenant.invoiceTitle || tenant.defaultDocTitle || 'Tax Invoice');
  const [showDocTitle, setShowDocTitle] = useState<boolean>(
    initialInvoice ? initialInvoice.showDocTitle !== false : true
  );
  const [docTitleSize, setDocTitleSize] = useState<number>(
    initialInvoice?.docTitleSize || tenant.defaultDocTitleSize || 30
  );
  // Notes & Payment Terms text alignment (Point 10)
  const [notesAlign, setNotesAlign] = useState<'left' | 'center' | 'right'>(
    initialInvoice?.notesAlign || 'left'
  );
  // QR code (Point 12)
  const [qrData, setQrData] = useState(initialInvoice?.qrData || '');
  const [qrSize, setQrSize] = useState<number>(initialInvoice?.qrSize || 110);
  const [qrAlign, setQrAlign] = useState<'left' | 'center' | 'right'>(
    initialInvoice?.qrAlign || 'right'
  );

  // Paper size dimensions (CSS px @96dpi) + currency formatter (Points 1 & 3)
  const PAPER: Record<string, { w: number; h: number; label: string }> = {
    'A4 (Standard)': { w: 794, h: 1123, label: '210mm × 297mm Standard' },
    'A5': { w: 559, h: 794, label: '148mm × 210mm' },
    'Letter': { w: 816, h: 1056, label: '8.5in × 11in' },
    'Legal': { w: 816, h: 1344, label: '8.5in × 14in' },
  };
  const CURRENCY_SYMBOL: Record<string, string> = { MYR: 'RM', USD: '$', SGD: 'S$', EUR: '€' };
  const fmt = (n: number) =>
    `${CURRENCY_SYMBOL[currency] || ''} ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items?.length
      ? initialInvoice.items
      : [
          {
            id: 'item-1',
            description: 'Industrial Grade Fiber Optic Cabling',
            quantity: 100,
            size: '100',
            sizeUnit: 'meter',
            unitPrice: 45.0,
            taxRate: 0.0,
            amount: 4500.0,
          },
          {
            id: 'item-2',
            description: 'Structured Network Trenching & Conduit',
            quantity: 40,
            size: '40',
            sizeUnit: 'meter',
            unitPrice: 85.0,
            taxRate: 0.0,
            amount: 3400.0,
          },
        ]
  );

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  // Sync state whenever initialInvoice or existingInvoices changes
  useEffect(() => {
    if (initialInvoice) {
      setSelectedCustomerId(initialInvoice.customerId || '');
      setCustomerName(initialInvoice.customerName || '');
      setCustomerEmail(initialInvoice.customerEmail || '');
      setCustomerPhone(initialInvoice.customerPhone || '');
      setCustomerAddress(initialInvoice.customerAddress || '');
      setCustomerTin(initialInvoice.customerTin || '');
      setInvoiceNumber(initialInvoice.invoiceNumber || generateUniqueInvoiceNumber(existingInvoices));
      setDate(initialInvoice.date || new Date().toISOString().split('T')[0]);
      setDueDate(initialInvoice.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setHasDueDate(Boolean(initialInvoice.dueDate && initialInvoice.dueDate.trim().length > 0));
      setCurrency(initialInvoice.currency || 'MYR');
      setPaperSize(initialInvoice.paperSize || 'A4 (Standard)');
      setStatus(initialInvoice.status || 'Unpaid');
      setNotes(initialInvoice.notes || '');
      setPaymentTerms(initialInvoice.paymentTerms || '');
      setDocTitle(initialInvoice.docTitle || tenant.invoiceTitle || 'Tax Invoice');
      setShowDocTitle(initialInvoice ? initialInvoice.showDocTitle !== false : true);
      setNotesAlign(initialInvoice.notesAlign || 'left');
      setQrData(initialInvoice.qrData || '');
      setQrSize(initialInvoice.qrSize || 110);
      setQrAlign(initialInvoice.qrAlign || 'right');
      if (initialInvoice.items?.length) {
        setItems(initialInvoice.items);
      }
    } else {
      // Clean slate for creating a new invoice with unique number and empty phone/inputs
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerTin('');
      setInvoiceNumber(generateUniqueInvoiceNumber(existingInvoices));
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setHasDueDate(true);
      setStatus('Unpaid');
    }
  }, [initialInvoice, existingInvoices]);

  // Auto-fill customer details when dropdown changes
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    if (!cId) {
      // When "-- Select Client to Autofill --" is selected, remove customer phone and details so user can type manually
      setCustomerPhone('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerTin('');
      return;
    }
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email);
      setCustomerPhone(found.phone);
      setCustomerAddress(found.address);
      setCustomerTin(found.tin);
    }
  };

  // Line item handlers
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Custom Cabling / Infrastructure Installation',
      quantity: 1,
      size: '1',
      sizeUnit: 'meter',
      unitPrice: 50.0,
      taxRate: 0.0,
      amount: 50.0,
    };
    setItems([...items, newItem]);
  };

  const handleAddProductPreset = (prod: Product) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: prod.name,
      quantity: 1,
      size: '1',
      sizeUnit: prod.unit as any || 'pcs',
      unitPrice: prod.unitPrice,
      taxRate: prod.taxRate,
      amount: prod.unitPrice,
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  // Totals calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const taxAmount = items.reduce(
    (acc, it) => acc + (Number(it.amount) || 0) * (Number(it.taxRate) || 0),
    0
  );
  const totalAmount = subtotal + taxAmount;

  const currentInvoiceData: Invoice = {
    id: initialInvoice?.id || `inv-${Date.now()}`,
    invoiceNumber,
    tenantId: tenant.id,
    customerId: selectedCustomerId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerTin,
    date,
    dueDate: hasDueDate ? dueDate : '',
    items,
    subtotal,
    taxRate: 0.08,
    taxAmount,
    totalAmount,
    currency,
    status,
    notes,
    paperSize,
    paymentTerms,
    docTitle,
    showDocTitle,
    docTitleSize,
    notesAlign,
    qrData,
    qrSize,
    qrAlign,
  };

  // ---- Draft auto-save (Point 4) ----
  // Continuously persists the working invoice to localStorage so navigation,
  // refresh or accidental leave never loses data. Restored on return.
  const draftKey = `billah_draft_${initialInvoice && initialInvoice.id !== 'NEW' ? initialInvoice.id : 'NEW'}`;
  const isNewDraft = !initialInvoice || initialInvoice.id === 'NEW';

  // Restore an existing autosaved draft when creating a brand-new invoice.
  useEffect(() => {
    if (!isNewDraft) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.docTitle) setDocTitle(d.docTitle);
        if (d.docTitleSize) setDocTitleSize(d.docTitleSize);
        // restore scalar fields safely
        if (d.invoiceNumber) setInvoiceNumber(d.invoiceNumber);
        if (d.customerName) setCustomerName(d.customerName);
        if (d.customerEmail) setCustomerEmail(d.customerEmail);
        if (d.customerPhone) setCustomerPhone(d.customerPhone);
        if (d.customerAddress) setCustomerAddress(d.customerAddress);
        if (d.customerTin) setCustomerTin(d.customerTin);
        if (d.date) setDate(d.date);
        if (d.dueDate) setDueDate(d.dueDate);
        if (d.notes) setNotes(d.notes);
        if (d.paymentTerms) setPaymentTerms(d.paymentTerms);
        if (d.currency) setCurrency(d.currency);
        if (d.paperSize) setPaperSize(d.paperSize);
        if (d.status) setStatus(d.status);
        if (Array.isArray(d.items) && d.items.length) setItems(d.items);
        if (d.qrData !== undefined) setQrData(d.qrData);
        if (d.qrSize) setQrSize(d.qrSize);
        if (d.notesAlign) setNotesAlign(d.notesAlign);
        if (d.showDocTitle !== undefined) setShowDocTitle(d.showDocTitle);
      }
    } catch { /* ignore corrupt draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (debounced) + on unload.
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(currentInvoiceData)); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(t);
  }, [currentInvoiceData, draftKey]);

  useEffect(() => {
    const onUnload = () => {
      try { localStorage.setItem(draftKey, JSON.stringify(currentInvoiceData)); } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInvoiceData, draftKey]);


  // Print the invoice exactly as shown in the preview (clone the live sheet, strip
  // the responsive wrapper, inject zero-margin @page so it matches the preview 1:1).
  const handlePrint = () => {
    const styleId = 'print-edge-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent =
      `@page { margin: 0 !important; size: A4; } @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } #print-host { background:#fff !important; } }`;
    const src = document.getElementById('printable-invoice');
    if (!src) { window.print(); return; }
    // IMPORTANT: remove any previously-injected print host (e.g. if afterprint
    // never fired on a prior print). Otherwise stale clones stack and the
    // browser prints MULTIPLE copies of the invoice. (Bug #1.)
    const existing = document.getElementById('print-host');
    if (existing) existing.remove();
    const clone = src.cloneNode(true) as HTMLElement;
    clone.setAttribute('id', 'printable-invoice-clone');
    clone.style.transform = 'none';
    clone.style.transformOrigin = 'top left';
    clone.style.width = '794px';
    clone.style.maxWidth = '794px';
    clone.style.position = 'static';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    const host = document.createElement('div');
    host.id = 'print-host';
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '0';
    host.style.width = '100%';
    host.style.background = '#fff';
    host.style.zIndex = '2147483647';
    // Even if afterprint never fires (e.g. print cancelled), the host must not
    // trap pointer events or block the app UI underneath.
    host.style.pointerEvents = 'none';
    host.appendChild(clone);
    document.body.appendChild(host);
    const cleanup = () => {
      const h = document.getElementById('print-host');
      if (h) h.remove();
      document.removeEventListener('afterprint', cleanup);
      window.removeEventListener('focus', cleanup);
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(fallback);
    };
    const onVisibility = () => { if (!document.hidden) cleanup(); };
    // Fallback: if afterprint never fires, still remove the host so it can't
    // block the app or stack up on the next print.
    const fallback = setTimeout(cleanup, 60000);
    document.addEventListener('afterprint', cleanup);
    // When the print dialog is closed (printed OR cancelled) the window regains
    // focus / becomes visible again — clear the overlay immediately so the user
    // returns to the Create Invoice screen instead of a frozen print page.
    window.addEventListener('focus', cleanup);
    document.addEventListener('visibilitychange', onVisibility);
    setTimeout(() => { window.print(); }, 60);
  };

  const handleSaveInvoice = async (printAfter = false) => {
    setIsSaving(true);
    const isExisting = Boolean(
      initialInvoice?.id && initialInvoice.id !== 'NEW'
    );
    try {
      const res = await fetch(
        isExisting ? `/api/invoices/${initialInvoice!.id}` : '/api/invoices',
        {
          method: isExisting ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentInvoiceData),
        }
      );
      const data = await res.json();
      onInvoiceSaved(data.data || currentInvoiceData);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
      // Auto-return to the originating page (e.g. back to the customer)
      if (!printAfter) {
        setTimeout(() => onBack(), 350);
      } else {
        handlePrint();
      }
    } catch (err) {
      onInvoiceSaved(currentInvoiceData);
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSavedBanner(true);
      if (printAfter) handlePrint();
      else setTimeout(() => onBack(), 350);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="invoice-builder-container" className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#bdcac0]/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            id="back-to-invoices-btn"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-[#bdcac0]/60 hover:bg-[#eff4ff] text-[#545f73] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight flex items-center gap-2.5">
              <span>{initialInvoice ? `Edit Invoice: ${initialInvoice.invoiceNumber}` : 'Create New Invoice'}</span>
              {initialInvoice && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Editing Mode
                </span>
              )}
            </h2>
            <p className="text-xs lg:text-sm text-[#545f73]">
              Malaysian SST Compliant Tax Invoice & Live A4 Print Sheet
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleSaveInvoice(false)}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-[#006a46] hover:bg-[#00855a] border border-[#006a46] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : initialInvoice ? 'Save Changes' : 'Save Invoice'}</span>
          </button>

          <button
            onClick={() => handleSaveInvoice(true)}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-[#bdcac0] rounded-xl hover:bg-[#eff4ff] transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-[#006a46] rounded-xl hover:bg-[#00855a] transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share & Send</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>✓ Invoice {invoiceNumber} saved successfully to cloud ledger.</span>
        </div>
      )}

      {/* Main Grid: Form Left, A4 Live Sheet Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Editor Form (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Document Settings */}
          <div className="bg-white p-5 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a46] flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Document Settings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
                >
                  <option value="MYR">MYR (RM)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
                >
                  <option value="A4 (Standard)">A4 (Standard)</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>

            {/* Invoice Header & Document Title (Point 5) */}
            <div className="space-y-2 border-t border-[#bdcac0]/40 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#545f73] uppercase">Document Title (Header)</label>
                <label className="flex items-center gap-2 text-[11px] text-[#545f73] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDocTitle}
                    onChange={(e) => setShowDocTitle(e.target.checked)}
                    className="w-4 h-4 accent-[#006a46]"
                  />
                  Show on invoice
                </label>
              </div>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Tax Invoice / Commercial Invoice / Receipt"
                className="w-full bg-[#f4f8ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
              />
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#545f73]">Size</span>
                  <input
                    type="range"
                    min={16}
                    max={72}
                    value={docTitleSize}
                    onChange={(e) => setDocTitleSize(Number(e.target.value))}
                    className="w-28 accent-[#006a46]"
                  />
                  <span className="text-[11px] font-mono text-[#0b1c30] w-10">{docTitleSize}px</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSetDefaultTitle?.(docTitle, docTitleSize)}
                  className="text-[11px] font-semibold text-[#006a46] border border-[#00855a]/30 px-2.5 py-1 rounded-lg hover:bg-[#00855a]/5 transition-colors cursor-pointer"
                  title="Save this title & size as the permanent default for future invoices"
                >
                  Set as Default
                </button>
              </div>
              {tenant.defaultDocTitle && (
                <p className="text-[10px] text-[#006a46]">
                  Default: <strong>{tenant.defaultDocTitle}</strong>{tenant.defaultDocTitleSize ? ` (${tenant.defaultDocTitleSize}px)` : ''}
                </p>
              )}
            </div>

            {/* Notes & Payment Terms alignment (Point 10) */}
            <div className="space-y-1 border-t border-[#bdcac0]/40 pt-3">
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">Notes / Payment Terms Alignment</label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setNotesAlign(a)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                      notesAlign === a
                        ? 'bg-[#006a46] text-white border-[#006a46]'
                        : 'bg-[#f8f9ff] text-[#0b1c30] border-[#bdcac0]'
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code (Point 12) */}
            <div className="space-y-2 border-t border-[#bdcac0]/40 pt-3">
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">QR Code</label>
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="QR content (URL, text, payment link...)"
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#545f73] uppercase mb-1">Size (px)</label>
                  <input
                    type="number"
                    min={60}
                    max={300}
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#545f73] uppercase mb-1">Align</label>
                  <select
                    value={qrAlign}
                    onChange={(e) => setQrAlign(e.target.value as any)}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-semibold text-[#0b1c30] outline-none"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Metadata */}
          <div className="bg-white p-5 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a46] flex items-center gap-1.5">
              <Building className="w-4 h-4" /> Client & Invoicing Details
            </h3>

            {/* Customer Name Input Field & Quick Pick */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. MegaCorp Malaysia Sdn Bhd"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-xs font-semibold text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1 flex justify-between items-center">
                  <span>Quick Autofill from Saved Clients</span>
                  <span className="text-[10px] text-[#006a46] font-semibold">Auto-fills phone, email, TIN & address</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-medium text-[#0b1c30] outline-none cursor-pointer"
                >
                  <option value="">-- Select Client to Autofill --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Customer Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+60 12-345 6789"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-mono text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="finance@client.com.my"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-mono font-semibold text-[#0b1c30] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Customer TIN
                </label>
                <input
                  type="text"
                  value={customerTin}
                  onChange={(e) => setCustomerTin(e.target.value)}
                  placeholder="C1234567890"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs font-mono text-[#0b1c30] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none"
                />
              </div>

              {/* Due Date with Button to add or remove */}
              <div>
                {hasDueDate ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-semibold text-[#545f73] uppercase">
                        Due Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setHasDueDate(false)}
                        className="text-[10px] text-[#ba1a1a] hover:underline flex items-center gap-0.5"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                      Due Date (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setHasDueDate(true);
                        if (!dueDate) {
                          setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full py-2 px-3 border border-dashed border-[#006a46] text-[#006a46] rounded-lg text-xs font-semibold hover:bg-[#eff4ff] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" /> + Add Due Date
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#545f73] uppercase mb-1">
                Client Billing Address
              </label>
              <textarea
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Billing address..."
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none resize-none font-mono"
              ></textarea>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="bg-white p-5 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a46] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Line Items & Pricing
              </h3>

              {/* Presets dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[#006a46] bg-[#eff4ff] px-2.5 py-1 rounded-md hover:bg-[#d5e0f8] flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Quick Add Product
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-white border border-[#bdcac0]/60 rounded-xl shadow-xl p-2 hidden group-hover:block z-30">
                  <div className="text-[10px] font-bold text-[#545f73] uppercase px-2 py-1">Catalog Items</div>
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProductPreset(p)}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-[#eff4ff] text-[#0b1c30] flex justify-between items-center"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono text-[11px] text-[#006a46] font-bold">RM {p.unitPrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Product catalog datalist for quick suggestions */}
              <datalist id="catalog-products-datalist">
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    RM {p.unitPrice} / {p.unit} ({p.category})
                  </option>
                ))}
              </datalist>

              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#f8f9ff] border border-[#bdcac0]/50 space-y-2 relative group"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] text-[#545f73] uppercase font-semibold">
                        Item Name / Description (Type manually or pick suggestion)
                      </label>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      list="catalog-products-datalist"
                      value={item.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleItemChange(item.id, 'description', val);
                        // Auto-fill price if matched exactly
                        const matched = products.find((p) => p.name.toLowerCase() === val.toLowerCase());
                        if (matched) {
                          handleItemChange(item.id, 'unitPrice', matched.unitPrice);
                          handleItemChange(item.id, 'sizeUnit', matched.unit);
                          handleItemChange(item.id, 'taxRate', matched.taxRate);
                        }
                      }}
                      placeholder="e.g. Fiber Optical Cabling / Security Audit"
                      className="w-full bg-white border border-[#bdcac0]/60 rounded-lg p-2 text-xs font-medium text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46]"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#545f73] uppercase font-semibold">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        className="w-full bg-white border border-[#bdcac0]/60 rounded-md p-1.5 text-xs font-mono text-[#0b1c30]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#545f73] uppercase font-semibold">Unit</label>
                      <select
                        value={item.sizeUnit || 'unit'}
                        onChange={(e) => handleItemChange(item.id, 'sizeUnit', e.target.value)}
                        className="w-full bg-white border border-[#bdcac0]/60 rounded-md p-1.5 text-xs font-medium text-[#0b1c30] outline-none cursor-pointer"
                      >
                        <option value="unit">unit</option>
                        <option value="meter">meter</option>
                        <option value="sq">sq</option>
                        <option value="ft">ft</option>
                        <option value="hr">hr</option>
                        <option value="pcs">pcs</option>
                        <option value="month">month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#545f73] uppercase font-semibold">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-white border border-[#bdcac0]/60 rounded-md p-1.5 text-xs font-mono text-[#0b1c30]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#545f73] uppercase font-semibold">Tax Rate</label>
                      <select
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(item.id, 'taxRate', Number(e.target.value))}
                        className="w-full bg-white border border-[#bdcac0]/60 rounded-md p-1.5 text-xs text-[#0b1c30]"
                      >
                        <option value={0}>0% Tax (Default)</option>
                        <option value={0.08}>8% SST</option>
                        <option value={0.06}>6% Service Tax</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 border border-dashed border-[#006a46] text-[#006a46] rounded-xl text-xs font-semibold hover:bg-[#00855a]/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + Add Line Item
            </button>
          </div>

          {/* Notes & Bank details */}
          <div className="bg-white p-5 rounded-2xl border border-[#bdcac0]/60 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a46]">Notes & Payment Terms</h3>
            <div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2 text-xs text-[#0b1c30] outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live A4 Printable Sheet (7 Cols) */}
        <div className="xl:col-span-7 sticky top-20">
          <div className="text-center mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#545f73]">Live A4 Paper Sheet Preview</span>
            <span className="text-[11px] font-mono text-[#006a46] font-semibold bg-[#eff4ff] px-2 py-0.5 rounded">
              {PAPER[paperSize]?.label || '210mm × 297mm Standard'}
            </span>
          </div>

          {/* THE PRINTABLE SHEET */}
          <div
            id="printable-invoice"
            className="bg-white rounded-xl border border-[#bdcac0] shadow-2xl p-8 sm:p-12 text-[#0b1c30] font-sans relative overflow-hidden transition-all"
            style={{
              width: PAPER[paperSize]?.w ? `${PAPER[paperSize].w}px` : '794px',
              minHeight: PAPER[paperSize]?.h ? `${PAPER[paperSize].h}px` : '842px',
              maxWidth: '100%',
            }}
          >
            {/* Status watermark */}
            <div className="absolute right-12 top-24 pointer-events-none select-none opacity-10 font-mono text-7xl font-black uppercase transform rotate-12 border-8 border-current px-6 py-2 rounded-2xl text-[#006a46]">
              {status}
            </div>

            {/* Header: Tenant Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[#0b1c30]/15 pb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {tenant.logoUrl || tenant.customerLogoUrl ? (
                    <div
                      className="p-1 bg-white rounded-lg border border-[#bdcac0]/50 shadow-2xs flex items-center justify-center overflow-hidden"
                      style={{
                        height: `${tenant.logoHeight || 48}px`,
                        maxWidth: `${(tenant.logoHeight || 48) * 3.5}px`,
                      }}
                    >
                      <img
                        src={tenant.logoUrl || tenant.customerLogoUrl}
                        alt={tenant.name}
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#00855a] text-white flex items-center justify-center font-bold text-sm">
                      {tenant.initials}
                    </div>
                  )}
                  <h1 className="text-xl font-extrabold tracking-tight text-[#0b1c30]">
                    {tenant.name}
                  </h1>
                </div>
                <p className="text-xs text-[#545f73] leading-relaxed max-w-sm whitespace-pre-line">
                  {tenant.address}
                </p>
                <div className="mt-2 text-xs font-mono text-[#3e4942] space-y-0.5">
                  <p><strong>SST ID:</strong> {tenant.sstId}</p>
                  <p><strong>TIN:</strong> {tenant.tin}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                {showDocTitle && (
                  <span
                    className="font-black tracking-wider text-[#006a46] uppercase block"
                    style={{ fontSize: `${docTitleSize}px`, lineHeight: 1.1 }}
                  >
                    {docTitle || tenant.invoiceTitle || 'TAX INVOICE'}
                  </span>
                )}
                <p className="text-sm font-mono font-bold text-[#0b1c30] mt-1">{invoiceNumber}</p>
                <div className="text-xs text-[#545f73] mt-2 space-y-0.5">
                  <p><strong>Date:</strong> {date}</p>
                  {hasDueDate && dueDate ? (
                    <p><strong>Due Date:</strong> {dueDate}</p>
                  ) : (
                    <p className="text-[#545f73]"><strong>Due Date:</strong> Due Upon Receipt</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billed To Section */}
            <div className="py-6 border-b border-[#0b1c30]/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] block mb-1">
                  BILLED TO
                </span>
                <p className="font-bold text-sm text-[#0b1c30]">{customerName}</p>
                <p className="text-xs text-[#545f73] whitespace-pre-line mt-1 leading-relaxed">
                  {customerAddress}
                </p>
                <div className="text-xs font-mono text-[#3e4942] mt-1 space-y-0.5">
                  {customerPhone && <p><strong>Tel/WhatsApp:</strong> {customerPhone}</p>}
                  {customerEmail && <p><strong>Email:</strong> {customerEmail}</p>}
                  {customerTin && <p><strong>TIN:</strong> {customerTin}</p>}
                </div>
              </div>

              <div className="sm:text-right flex flex-col justify-end">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#545f73] block mb-1">
                  PAYMENT STATUS
                </span>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                      status === 'Paid'
                        ? 'bg-[#00855a]/15 text-[#006a46]'
                        : status === 'Unpaid'
                        ? 'bg-amber-100 text-amber-900'
                        : status === 'Overdue'
                        ? 'bg-red-100 text-red-900'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#0b1c30] text-[11px] font-bold tracking-wider text-[#0b1c30] uppercase">
                    <th className="py-2.5 px-2">Item Description</th>
                    <th className="py-2.5 px-2 text-center">Qty / Size</th>
                    <th className="py-2.5 px-2 text-right">Unit Price ({currency})</th>
                    <th className="py-2.5 px-2 text-center">SST</th>
                    <th className="py-2.5 px-2 text-right">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bdcac0]/40 text-xs">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-3 px-2 font-medium text-[#0b1c30]">{it.description}</td>
                      <td className="py-3 px-2 text-center font-mono text-[#545f73]">
                        {it.quantity} {it.sizeUnit || ''}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[#0b1c30]">
                        {fmt(it.unitPrice)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-[#545f73]">
                        {it.taxRate > 0 ? `${(it.taxRate * 100).toFixed(0)}%` : '0%'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-[#0b1c30]">
                        {fmt(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total Summary */}
            <div className="border-t-2 border-[#0b1c30]/20 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
              {/* Bank & Remittance instructions */}
              <div className="sm:max-w-xs text-xs space-y-1.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[#545f73] block">
                  Remittance Instructions
                </span>
                <p className="font-mono text-xs text-[#0b1c30]">
                  <strong>Bank:</strong> {tenant.bankName}
                </p>
                <p className="font-mono text-xs text-[#0b1c30]">
                  <strong>Account Name:</strong> {tenant.bankTitle || tenant.name}
                </p>
                <p className="font-mono text-xs text-[#0b1c30]">
                  <strong>Account No:</strong> {tenant.bankAccount}
                </p>
                <p className="text-[11px] text-[#545f73] italic pt-1 leading-relaxed" style={{ textAlign: notesAlign }}>
                  {notes}
                </p>
              </div>

              {/* Total calculations block */}
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-[#545f73]">
                  <span>Subtotal:</span>
                  <span className="font-mono text-[#0b1c30]">
                    {fmt(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#545f73]">
                  <span>SST ({taxAmount > 0 ? 8 : 0}%):</span>
                  <span className="font-mono text-[#0b1c30]">
                    {fmt(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-[#006a46] text-[#006a46]">
                  <span className="text-sm font-bold uppercase tracking-wider">Total Due:</span>
                  <span className="font-mono text-xl font-black">
                    {fmt(totalAmount)}
                  </span>
                </div>
              </div>

            </div>

              {/* QR Code block (full sheet width so alignment reaches true edges) */}
              {qrData && (
                <div
                  className="mt-4 w-full"
                  style={{
                    display: 'flex',
                    justifyContent:
                      qrAlign === 'left' ? 'flex-start' : qrAlign === 'center' ? 'center' : 'flex-end',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`}
                    alt="QR Code"
                    style={{ width: qrSize, height: qrSize }}
                    className="border border-[#bdcac0] rounded"
                  />
                </div>
              )}

            {/* Footer Signoff */}
            <div className="mt-12 pt-6 border-t border-[#bdcac0]/40 text-center text-[10px] text-[#545f73] font-mono">
              This is a computer-generated tax invoice issued via BillLah! Cloud Invoicing. No physical signature required.
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <SendInvoiceModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        invoice={currentInvoiceData}
      />
    </div>
  );
};
