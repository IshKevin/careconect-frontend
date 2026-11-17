'use client';

import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { AlertTriangle, CheckCircle2, Download, FileText, RefreshCcw, Search, CreditCard, Receipt, Wallet } from 'lucide-react';
import { apiErrorMessage, downloadInvoicePdf, useInitiatePayment } from '@/hooks/usePayments';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { DataTable, Empty, Notice, PageHeader, Section, StatCard, StatusBadge, formatRwf } from '@/components/dashboard/common';

// StatusBadge has no tone for these two invoice states yet; colour them here.
const STATUS_OVERRIDE: Record<string, string | undefined> = {
  unpaid: 'bg-amber-50 text-amber-700 ring-amber-600/20 [&>span]:bg-amber-500',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20 [&>span]:bg-rose-500',
};

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

type Invoice = {
  invoiceId: string;
  invoiceNumber?: string;
  invoiceStatus?: 'pending' | 'paid' | 'cancelled';  // what the API returns
  invoiceDate?: string;  // YYYY-MM-DD
  totalAmount: number | string;
  currency?: string;
  dueDate?: string;      // ISO
  createdAt?: string;    // ISO
  status?: 'paid' | 'unpaid' | 'overdue' | string;
  paidAt?: string;       // ISO
  pdfUrl?: string;
  notes?: string;
};

export default function InvoicesPage() {
  const { user } = useAuthHooks();
  const initiatePayment = useInitiatePayment();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/invoice/invoices/patient/${user.userId}`);
        const data = res.data?.data || res.data || [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch invoices';
        setError(message);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [user]);

  // helpers (Must be above any early return if used in hooks, or just kept in the component scope)
  // Invoices are in RWF unless the API says otherwise (this used to fall back to USD).
  const fmtMoney = (amt: number | string, ccy?: string) => {
    const n = Number(amt);
    if (!isFinite(n)) return `${amt ?? '—'}`;
    if (!ccy || ccy.toUpperCase() === 'RWF') return formatRwf(n);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy, maximumFractionDigits: 2 }).format(n);
  };
  
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');
  
  const deriveStatus = (inv: Invoice) => {
    const s = (inv.invoiceStatus ?? inv.status ?? '').toLowerCase();
    if (s === 'paid') return 'paid';
    if (s === 'cancelled') return 'cancelled';
    if (inv.paidAt) return 'paid';
    const due = inv.dueDate ? new Date(inv.dueDate) : null;
    if (due && due.getTime() < Date.now()) return 'overdue';
    return 'unpaid';
  };

  const filtered = useMemo(() => {
    let rows = [...invoices];
    const query = q.trim().toLowerCase();
    if (query) {
      rows = rows.filter(r =>
        (r.invoiceId ?? '').toLowerCase().includes(query) ||
        (r.notes ?? '').toLowerCase().includes(query)
      );
    }
    if (status !== 'all') {
      rows = rows.filter(r => deriveStatus(r) === status);
    }
    switch (sortBy) {
      case 'newest':
        rows.sort((a, b) => +(new Date(b.createdAt ?? b.dueDate ?? 0)) - +(new Date(a.createdAt ?? a.dueDate ?? 0)));
        break;
      case 'oldest':
        rows.sort((a, b) => +(new Date(a.createdAt ?? a.dueDate ?? 0)) - +(new Date(b.createdAt ?? b.dueDate ?? 0)));
        break;
      case 'amount_desc':
        rows.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
        break;
      case 'amount_asc':
        rows.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
        break;
    }
    return rows;
  }, [invoices, q, status, sortBy]);

  // early return AFTER hooks
  if (!user || user.userType !== 'patient') {
    return (
      <Notice tone="error">Please log in as a patient to view your invoices.</Notice>
    );
  }

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoice/invoices/patient/${user.userId}`);
      const data = res.data?.data || res.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to refresh invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (inv: Invoice) => {
    initiatePayment.mutate(
      { invoiceId: inv.invoiceId },
      {
        onSuccess: (result) => {
          window.location.href = result.redirectUrl;
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err, 'Could not start the payment. Please try again.'));
        },
      },
    );
  };

  const summary = invoices.reduce(
    (acc, inv) => {
      const s = deriveStatus(inv);
      if (s === 'unpaid' || s === 'overdue') {
        acc.open += 1;
        acc.due += Number(inv.totalAmount) || 0;
      }
      if (s === 'overdue') acc.overdue += 1;
      if (s === 'paid') acc.paid += 1;
      return acc;
    },
    { open: 0, due: 0, overdue: 0, paid: 0 },
  );
  const dash = loading && invoices.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Pay your consultation bills securely and download receipts."
        actions={
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className={loading ? 'animate-spin' : undefined} /> Refresh
          </Button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Amount due" value={dash ? '—' : formatRwf(summary.due)} icon={Wallet} tone="amber" />
        <StatCard label="Unpaid" value={dash ? '—' : summary.open} hint="invoices to pay" icon={Receipt} tone="blue" />
        <StatCard label="Overdue" value={dash ? '—' : summary.overdue} hint="past the due date" icon={AlertTriangle} tone="red" />
        <StatCard label="Paid" value={dash ? '—' : summary.paid} icon={CheckCircle2} tone="green" />
      </div>

      <Section title="All invoices" description={`${filtered.length} shown`} flush>
        {/* Toolbar */}
        <div className="grid grid-cols-2 gap-2 border-b border-border p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by invoice ID or notes…"
              className="pl-9"
              aria-label="Search invoices"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | 'paid' | 'unpaid' | 'overdue')}
            className={selectClass}
            aria-label="Filter by status"
          >
            <option value="all">All status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'amount_desc' | 'amount_asc')}
            className={selectClass}
            aria-label="Sort"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_desc">Amount: high to low</option>
            <option value="amount_asc">Amount: low to high</option>
          </select>
        </div>

        {!loading && filtered.length === 0 ? (
          <Empty icon={Receipt}>
            {invoices.length === 0 ? 'No invoices yet. Invoices for your consultations will appear here.' : 'No invoices match your filters.'}
          </Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Created</th>
                <th>Due</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 &&
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j}><div className="h-4 w-20 animate-pulse rounded bg-slate-100" /></td>
                    ))}
                  </tr>
                ))}

              {!loading && filtered.map((inv) => {
                const s = deriveStatus(inv);
                const isUnpaid = s === 'unpaid' || s === 'overdue';

                return (
                  <tr key={inv.invoiceId}>
                    <td>
                      <p className="whitespace-nowrap font-medium text-slate-900">
                        {inv.invoiceNumber ?? `#${inv.invoiceId?.slice(0, 8)}…`}
                      </p>
                      {inv.notes && <p className="max-w-[14rem] truncate text-xs text-muted-foreground">{inv.notes}</p>}
                    </td>
                    <td className="whitespace-nowrap text-slate-600">{fmtDate(inv.createdAt)}</td>
                    <td className="whitespace-nowrap text-slate-600">{fmtDate(inv.dueDate)}</td>
                    <td><StatusBadge value={s} className={STATUS_OVERRIDE[s]} /></td>
                    <td className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">{fmtMoney(inv.totalAmount, inv.currency)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {inv.pdfUrl ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <FileText /> View
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" title="No PDF available" disabled>
                            <FileText /> View
                          </Button>
                        )}

                        {isUnpaid ? (
                          <Button size="sm" onClick={() => handlePay(inv)} disabled={initiatePayment.isPending}>
                            <CreditCard /> Pay now
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoicePdf(inv.invoiceId, inv.invoiceNumber).catch((err) => toast.error(apiErrorMessage(err, 'Could not download the invoice. Please try again.')))}
                          >
                            <Download /> Export
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
