import { InvoiceStatus } from '../types';

/**
 * Live invoice payment status colors (Point 3).
 *  - Paid:   green background, white text
 *  - Unpaid: dark red background, white text
 *  - Draft:  keep current neutral design
 *  - Overdue: keep current amber design
 * Applied everywhere the invoice status appears.
 */
export function statusBadgeClass(status: InvoiceStatus): string {
  switch (status) {
    case 'Paid':
      return 'bg-[#00855a] text-white border-[#00855a]';
    case 'Unpaid':
      return 'bg-[#93000a] text-white border-[#93000a]';
    case 'Draft':
      return 'bg-[#eff4ff] text-[#545f73] border-[#bdcac0]';
    case 'Overdue':
      return 'bg-[#ffebd6] text-[#8a4100] border-[#ffebd6]';
    default:
      return 'bg-[#eff4ff] text-[#545f73] border-[#bdcac0]';
  }
}
