'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, Download, Link2, Receipt, Wallet } from 'lucide-react';
import api from '@/lib/api/api';
import { Button } from '@/components/ui/Button';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatCard, StatusBadge, formatDate, formatRwf } from '@/components/dashboard/common';
import { useSponsorDashboard } from '@/hooks/useDashboards';
import { apiErrorMessage, downloadInvoicePdf, useInitiatePayment } from '@/hooks/usePayments';
import { cn } from '@/lib/utils';

// Invoices of every patient the sponsor has an active link to. Paying goes through Pesapal; afterwards
// Pesapal returns the sponsor to /sponsor/invoices/return. Paying never gives access to medical records.

type InvoiceRow = {
  invoiceId: string;
  invoiceNumber: string | null;
  totalAmount: string;
  invoiceStatus: 'pending' | 'paid' | 'cancelled' | 'refunded';
  invoiceDate: string;
  paidAt: string | null;
  patientUserId: string;
  patientName: string;
};

export default function SponsorInvoicesPage() {
  const dashboard = useSponsorDashboard();
  const patients = dashboard.data?.linkedPatients ?? [];
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [payingId, setPayingId] = useState<string | null>(null);
  const pay = useInitiatePayment();

  const invoiceQueries = useQueries({
    queries: patients.map((p) => ({
      queryKey: ['sponsor', 'invoices', p.patientUserId],
      queryFn: async () => {
        const res = await api.get(`/invoice/invoices/patient/${p.patientUserId}`);
        const list = res.data?.data ?? [];
        return (Array.isArray(list) ? list : []).map((inv: Omit<InvoiceRow, 'patientUserId' | 'patientName'>) => ({
          ...inv,
          patientUserId: p.patientUserId,
          patientName: p.name,
        })) as InvoiceRow[];
      },
    })),
  });

  const loading = dashboard.isLoading || invoiceQueries.some((q) => q.isLoading);
  const failed = invoiceQueries.find((q) => q.error);

  const all = useMemo(
    () =>
      invoiceQueries
        .flatMap((q) => q.data ?? [])
        .sort((a, b) => (a.invoiceStatus === 'pending' ? 0 : 1) - (b.invoiceStatus === 'pending' ? 0 : 1) || b.invoiceDate.localeCompare(a.invoiceDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoiceQueries.map((q) => q.dataUpdatedAt).join()],
  );
  const pending = all.filter((i) => i.invoiceStatus === 'pending');
  const rows = filter === 'pending' ? pending : all;
  const dueTotal = pending.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const paidCount = all.filter((i) => i.invoiceStatus === 'paid').length;

  const onPay = (inv: InvoiceRow) => {
    setPayingId(inv.invoiceId);
    pay.mutate(
      { invoiceId: inv.invoiceId },
      {
        onSuccess: (result) => {
          window.location.href = result.redirectUrl;
        },
        onError: (err) => {
          setPayingId(null);
          toast.error(apiErrorMessage(err, 'Could not start the payment. Please try again.'));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Pay consultation bills for the relatives you sponsor. Paying never gives you access to their medical records."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Amount due" value={loading ? '—' : formatRwf(dueTotal)} icon={Wallet} tone="amber" />
        <StatCard label="Unpaid invoices" value={loading ? '—' : pending.length} icon={Receipt} tone="red" />
        <StatCard label="Paid invoices" value={loading ? '—' : paidCount} icon={CheckCircle2} tone="green" />
      </div>

      {dashboard.error || failed ? <Notice tone="error">Some invoices could not be loaded. Refresh the page to try again.</Notice> : null}

      <Section
        flush
        title="Invoices for your patients"
        description={loading ? undefined : `${patients.length} linked patient${patients.length === 1 ? '' : 's'}`}
        action={
          all.length > 0 ? (
            <div className="inline-flex rounded-lg border border-border bg-slate-50 p-0.5 text-sm">
              {(['pending', 'all'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn('rounded-md px-3 py-1.5 font-medium transition', filter === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700')}
                >
                  {v === 'pending' ? `To pay (${pending.length})` : `All (${all.length})`}
                </button>
              ))}
            </div>
          ) : null
        }
      >
        {loading ? (
          <div className="p-5"><Loading /></div>
        ) : patients.length === 0 ? (
          <Empty
            icon={Link2}
            action={<Button asChild variant="outline" size="sm"><Link href="/sponsor/links">Link a patient</Link></Button>}
          >
            You are not linked to any patient yet. Once a patient approves your link, their invoices appear here.
          </Empty>
        ) : rows.length === 0 ? (
          <Empty icon={CheckCircle2}>{filter === 'pending' ? 'Nothing to pay. All invoices are settled.' : 'No invoices yet.'}</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th className="text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.invoiceId}>
                  <td className="whitespace-nowrap font-medium text-slate-900">{inv.invoiceNumber ?? '—'}</td>
                  <td className="whitespace-nowrap text-slate-700">{inv.patientName}</td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td><StatusBadge value={inv.invoiceStatus === 'pending' ? 'unpaid' : inv.invoiceStatus} /></td>
                  <td className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">{formatRwf(inv.totalAmount)}</td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadInvoicePdf(inv.invoiceId, inv.invoiceNumber ?? undefined).catch((err) => toast.error(apiErrorMessage(err, 'Could not download the invoice.')))}
                      >
                        <Download /> PDF
                      </Button>
                      {inv.invoiceStatus === 'pending' ? (
                        <Button size="sm" onClick={() => onPay(inv)} disabled={pay.isPending}>
                          <CreditCard /> {payingId === inv.invoiceId ? 'Opening…' : 'Pay now'}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
