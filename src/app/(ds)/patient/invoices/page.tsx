'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Download, FileText, RefreshCcw, Search, CreditCard } from 'lucide-react';
import { apiErrorMessage, downloadInvoicePdf, useInitiatePayment } from '@/hooks/usePayments';

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

  const BRAND = '#C4E1E1';

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
  const fmtMoney = (amt: number | string, ccy?: string) => {
    const n = Number(amt);
    if (!isFinite(n)) return `${amt ?? '—'}`;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD', maximumFractionDigits: 2 }).format(n);
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

  const statusBadge = (s: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1';
    const map: Record<string, string> = {
      paid: `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`,
      unpaid: `${base} bg-amber-50 text-amber-700 ring-amber-200`,
      overdue: `${base} bg-rose-50 text-rose-700 ring-rose-200`,
      cancelled: `${base} bg-gray-100 text-gray-600 ring-gray-200`,
    };
    return <span className={map[s] ?? `${base} bg-gray-100 text-gray-700 ring-gray-200`}>{s}</span>;
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
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-3 ring-8 ring-rose-50/50">
          <FileText className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Please log in as a patient to view your invoices.</p>
        </div>
      </div>
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
          alert(apiErrorMessage(err, 'Could not start the payment. Please try again.'));
        },
      },
    );
  };

  return (
    <div
      className="p-6"
      style={{ '--brand': BRAND } as React.CSSProperties}
    >
      {/* brand ribbon */}
      <div
        className="mx-auto mb-6 h-1 max-w-6xl rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)' }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Invoices</h1>
            <p className="mt-1 text-gray-600">
              View your invoices, <span className="font-medium">{user.profile?.firstName} {user.profile?.lastName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center rounded-xl bg-[var(--brand)]/80 px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-black/10 hover:bg-[var(--brand)] disabled:opacity-60"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>
        </header>

        {/* Alerts */}
        {loading && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">Loading…</div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>
        )}

        {/* Toolbar */}
        <section className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by invoice ID or notes…"
                className="h-11 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | 'paid' | 'unpaid' | 'overdue')}
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'amount_desc' | 'amount_asc')}
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_desc">Amount ↓</option>
              <option value="amount_asc">Amount ↑</option>
            </select>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur">
          <div className="overflow-hidden rounded-2xl">
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-gray-50/70 backdrop-blur">
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Created</Th>
                    <Th>Due</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="text-right pr-4">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {/* skeletons */}
                  {loading && filtered.length === 0 && (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b">
                        <Td><div className="h-4 w-24 animate-pulse rounded bg-gray-200/70" /></Td>
                        <Td><div className="h-4 w-20 animate-pulse rounded bg-gray-200/70" /></Td>
                        <Td><div className="h-4 w-20 animate-pulse rounded bg-gray-200/70" /></Td>
                        <Td><div className="h-5 w-16 animate-pulse rounded bg-gray-200/70" /></Td>
                        <Td className="text-right"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200/70" /></Td>
                        <Td className="text-right pr-4"><div className="ml-auto h-8 w-20 animate-pulse rounded bg-gray-200/70" /></Td>
                      </tr>
                    ))
                  )}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-600">
                        No invoices found.
                      </td>
                    </tr>
                  )}

                  {!loading && filtered.map((inv, idx) => {
                    const s = deriveStatus(inv);
                    const isUnpaid = s === 'unpaid' || s === 'overdue';
                    
                    return (
                      <tr key={inv.invoiceId} className={`${idx % 2 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-[var(--brand)]/40 px-2 py-0.5 text-xs text-gray-800 ring-1 ring-[var(--brand)]/60">
                              #{inv.invoiceId?.slice(0, 8)}…
                            </span>
                            {inv.notes && <span className="truncate text-xs text-gray-500 max-w-[12rem]">{inv.notes}</span>}
                          </div>
                        </Td>
                        <Td>{fmtDate(inv.createdAt)}</Td>
                        <Td>{fmtDate(inv.dueDate)}</Td>
                        <Td className="capitalize">{statusBadge(s)}</Td>
                        <Td className="text-right font-medium">{fmtMoney(inv.totalAmount, inv.currency)}</Td>
                        <Td className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            {inv.pdfUrl ? (
                              <a
                                href={inv.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <FileText className="h-4 w-4" /> View
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-gray-700 opacity-60"
                                title="No PDF available"
                                disabled
                              >
                                <FileText className="h-4 w-4" /> View
                              </button>
                            )}
                            
                            {isUnpaid ? (
                              <button
                                type="button"
                                onClick={() => handlePay(inv)}
                                disabled={initiatePayment.isPending}
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-semibold text-gray-900 ring-1 ring-black/10 hover:bg-[#b3d8d8] shadow-sm"
                              >
                                <CreditCard className="h-4 w-4" /> Pay Now
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => downloadInvoicePdf(inv.invoiceId, inv.invoiceNumber).catch((err) => alert(apiErrorMessage(err, 'Could not download the invoice. Please try again.')))}
                                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Download className="h-4 w-4" /> Export
                              </button>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* tiny table atoms */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-sm text-gray-800 ${className}`}>{children}</td>;
}
