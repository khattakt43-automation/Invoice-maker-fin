import { Invoice } from '../types';

/**
 * Generates a guaranteed unique invoice number against existing invoices.
 * Format: INV-YYYY-XXXX (e.g., INV-2026-1043)
 */
export const generateUniqueInvoiceNumber = (existingInvoices: Invoice[] = []): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  let maxSeq = 1040;
  existingInvoices.forEach((inv) => {
    if (!inv.invoiceNumber) return;
    // Match any sequence number in formats like INV-2026-1042 or INV-1042
    const match = inv.invoiceNumber.match(/(?:INV-)?(?:\d{4}-)?(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Ensure candidate is unique across all invoices
  while (
    existingInvoices.some(
      (i) => i.invoiceNumber?.trim().toLowerCase() === candidate.toLowerCase()
    )
  ) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
};
