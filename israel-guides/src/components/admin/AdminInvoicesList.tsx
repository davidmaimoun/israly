import { Link } from "@/i18n/navigation";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

export type AdminInvoiceRow = {
  id: string;
  number: string;
  guideName: string;
  clientName: string;
  amount: number;
  currency: string;
  status: string;
};

export function AdminInvoicesList({ invoices }: { invoices: AdminInvoiceRow[] }) {
  if (!invoices.length) return null;
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-stone/70">
      <table className="w-full text-sm">
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-stone/50 bg-surface last:border-0">
              <td className="p-3 font-medium text-ink">
                <Link href={`/admin/invoices/${inv.id}`} className="hover:text-primary">{inv.number}</Link>
              </td>
              <td className="p-3 text-ink-soft">{inv.guideName}</td>
              <td className="p-3 text-ink-soft">{inv.clientName}</td>
              <td className="p-3 text-ink-soft">{inv.amount.toLocaleString()} {inv.currency}</td>
              <td className="p-3 text-end"><InvoiceStatusBadge status={inv.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
