import React from 'react';

// Single source of truth for the invoice visual design.
// Used by BOTH the live builder preview (client) and the server-rendered
// /i/:number + /i/example routes (SSR) so the downloaded PDF is pixel-identical
// to what the user sees on screen. Defensive against missing tenant/invoice fields.

const GREEN = '#006a46';
const GREEN_DARK = '#00855a';
const DARK = '#0b1c30';
const MUTE = '#545f73';
const BORDER = '#bdcac0';

const PAPER: Record<string, { w: number; h: number; page: string }> = {
  'A4 (Standard)': { w: 794, h: 1123, page: 'A4' },
  A5: { w: 559, h: 794, page: 'A5' },
  Letter: { w: 816, h: 1056, page: 'Letter' },
  Legal: { w: 816, h: 1344, page: 'Legal' },
};

export interface InvoiceDocData {
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  hasDueDate?: boolean;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerTin?: string;
  status?: string;
  currency?: string;
  items?: any[];
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  taxRate?: number;
  notes?: string;
  notesAlign?: 'left' | 'center' | 'right';
  paperSize?: string;
  qrData?: string;
  qrAlign?: 'left' | 'center' | 'right';
  qrSize?: number;
  showDocTitle?: boolean;
  docTitle?: string;
  docTitleSize?: number;
}

interface Props {
  tenant: any;
  invoice: InvoiceDocData;
  customer?: any;
  sample?: boolean;
}

export function InvoiceDocument({ tenant, invoice, customer, sample }: Props) {
  const safeTenant = tenant || {};
  const cur = invoice.currency || safeTenant.currency || 'RM';
  const fmt = (n: number) =>
    (n ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paper = PAPER[invoice.paperSize as keyof typeof PAPER] || PAPER['A4 (Standard)'];
  const status = invoice.status || 'Unpaid';
  const initials = safeTenant.initials || (safeTenant.name ? safeTenant.name.slice(0, 2).toUpperCase() : 'IN');
  const logo = safeTenant.logoUrl || safeTenant.customerLogoUrl;

  const rows = (invoice.items || []).map((it, i) => {
    const amt = it.amount != null && it.amount !== 0 ? it.amount : Number(it.quantity || 1) * Number(it.unitPrice || 0);
    return (
      <tr key={i} className="border-b divide-y" style={{ borderColor: 'rgba(189,202,192,.4)' }}>
        <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 600, color: DARK }}>{it.description}</td>
        <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'center', fontFamily: 'monospace', color: MUTE }}>
          {it.quantity} {it.sizeUnit || ''}
        </td>
        <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', fontFamily: 'monospace', color: DARK }}>
          {fmt(it.unitPrice)}
        </td>
        <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'center', fontFamily: 'monospace', color: MUTE }}>
          {it.taxRate > 0 ? `${(it.taxRate * 100).toFixed(0)}%` : '0%'}
        </td>
        <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: DARK }}>
          {fmt(amt)}
        </td>
      </tr>
    );
  });

  const statusColor =
    status === 'Paid'
      ? { bg: 'rgba(0,133,90,.15)', color: GREEN }
      : status === 'Unpaid'
      ? { bg: '#fef3c7', color: '#92400e' }
      : status === 'Overdue'
      ? { bg: '#fee2e2', color: '#991b1b' }
      : { bg: '#f3f4f6', color: '#374151' };

  const billLines = [
    invoice.customerAddress,
    invoice.customerPhone && `Tel/WhatsApp: ${invoice.customerPhone}`,
    invoice.customerEmail && `Email: ${invoice.customerEmail}`,
    invoice.customerTin && `TIN: ${invoice.customerTin}`,
  ]
    .filter(Boolean)
    .join('\n');

  const notesAlign = invoice.notesAlign || 'left';
  const qrSize = invoice.qrSize || 110;

  return (
    <div
      id="printable-invoice"
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
        padding: 48,
        color: DARK,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        width: paper.w,
        minHeight: paper.h,
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {sample && (
        <div
          style={{
            background: '#fff7ed',
            color: '#9a3412',
            border: '1px solid #fdba74',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          SAMPLE / DEMO INVOICE — not a real transaction. For demonstration only.
        </div>
      )}

      {/* Status watermark */}
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 96,
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.08,
          fontFamily: 'monospace',
          fontSize: 72,
          fontWeight: 900,
          textTransform: 'uppercase',
          transform: 'rotate(12deg)',
          border: `8px solid ${GREEN}`,
          padding: '8px 16px',
          borderRadius: 16,
          color: GREEN,
        }}
      >
        {status}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid rgba(11,28,48,.15)`, paddingBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {logo ? (
              <img src={logo} alt={safeTenant.name} style={{ height: 48, maxWidth: 168, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: GREEN_DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                {initials}
              </div>
            )}
            <h1 style={{ fontSize: 20, fontWeight: 800, color: DARK, margin: 0 }}>{safeTenant.name}</h1>
          </div>
          <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.6, maxWidth: 320, whiteSpace: 'pre-line', margin: '4px 0' }}>
            {safeTenant.address || ''}
          </p>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#3e4942', lineHeight: 1.6 }}>
            <div>
              <strong>SST ID:</strong> {safeTenant.sstId || '—'}
            </div>
            <div>
              <strong>TIN:</strong> {safeTenant.tin || '—'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 200 }}>
          {invoice.showDocTitle && (
            <div
              style={{
                fontWeight: 900,
                letterSpacing: 1,
                color: GREEN,
                textTransform: 'uppercase',
                fontSize: invoice.docTitleSize || 30,
                lineHeight: 1.1,
              }}
            >
              {invoice.docTitle || safeTenant.invoiceTitle || 'TAX INVOICE'}
            </div>
          )}
          <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: DARK, marginTop: 4 }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: MUTE, marginTop: 8, lineHeight: 1.6 }}>
            <div>
              <strong>Date:</strong> {invoice.date}
            </div>
            {invoice.hasDueDate && invoice.dueDate ? (
              <div>
                <strong>Due Date:</strong> {invoice.dueDate}
              </div>
            ) : (
              <div style={{ color: MUTE }}>
                <strong>Due Date:</strong> Due Upon Receipt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billed To */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid rgba(11,28,48,.1)`, padding: '24px 0', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: MUTE, marginBottom: 4 }}>Billed To</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{invoice.customerName || (customer && customer.name) || '—'}</div>
          <div style={{ fontSize: 12, color: MUTE, whiteSpace: 'pre-line', marginTop: 4, lineHeight: 1.6 }}>{billLines}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: MUTE, marginBottom: 4 }}>Payment Status</div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              letterSpacing: 1,
              background: statusColor.bg,
              color: statusColor.color,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Items table */}
      <div style={{ padding: '24px 0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${DARK}`, textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: DARK }}>
              <th style={{ padding: '10px 8px' }}>Item Description</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty / Size</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price ({cur})</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>SST</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total ({cur})</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      {/* Totals + remittance */}
      <div style={{ borderTop: `2px solid rgba(11,28,48,.2)`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: MUTE, marginBottom: 4 }}>Remittance Instructions</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: DARK }}>
            <div>
              <strong>Bank:</strong> {safeTenant.bankName || '—'}
            </div>
            <div>
              <strong>Account Name:</strong> {safeTenant.bankTitle || safeTenant.name || '—'}
            </div>
            <div>
              <strong>Account No:</strong> {safeTenant.bankAccount || '—'}
            </div>
            {invoice.notes && (
              <div style={{ fontSize: 11, color: MUTE, fontStyle: 'italic', marginTop: 6, lineHeight: 1.6, textAlign: notesAlign }}>{invoice.notes}</div>
            )}
          </div>
        </div>
        <div style={{ width: 256, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTE, marginBottom: 8 }}>
            <span>Subtotal:</span>
            <span style={{ fontFamily: 'monospace', color: DARK }}>{cur} {fmt(invoice.subtotal || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTE, marginBottom: 8 }}>
            <span>SST ({(invoice.taxAmount > 0 ? 8 : 0)}%):</span>
            <span style={{ fontFamily: 'monospace', color: DARK }}>{cur} {fmt(invoice.taxAmount || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `2px solid ${GREEN}`, paddingTop: 8, color: GREEN }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total Due:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900 }}>{cur} {fmt(invoice.totalAmount || 0)}</span>
          </div>
        </div>
      </div>

      {/* QR */}
      {invoice.qrData && (
        <div style={{ marginTop: 16, width: '100%', display: 'flex', justifyContent: invoice.qrAlign === 'center' ? 'center' : invoice.qrAlign === 'right' ? 'flex-end' : 'flex-start' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(invoice.qrData)}`} alt="QR Code" style={{ width: qrSize, height: qrSize, border: `1px solid ${BORDER}`, borderRadius: 6 }} />
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid rgba(189,202,192,.4)`, textAlign: 'center', fontSize: 10, color: MUTE, fontFamily: 'monospace' }}>
        This is a computer-generated tax invoice issued via BillLah! Cloud Invoicing. No physical signature required.
      </div>
    </div>
  );
}
