'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatusBadge, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
import { useMarkRefundProcessed, useRefundDecision, useRefunds } from '@/hooks/useDashboards';
import type { RefundStatus } from '@/types/admin-ops';

const FILTERS: (RefundStatus | 'all')[] = ['pending', 'approved', 'processed', 'rejected', 'failed', 'all'];

export default function AdminRefundsPage() {
  const [filter, setFilter] = useState<RefundStatus | 'all'>('pending');
  const [note, setNote] = useState('');
  const { data: refunds, isLoading, error } = useRefunds(filter === 'all' ? undefined : filter);
  const decide = useRefundDecision();
  const processed = useMarkRefundProcessed();

  const decideRefund = async (refundId: string, decision: 'approve' | 'reject') => {
    try {
      const res = await decide.mutateAsync({ refundId, decision, note: note.trim() || undefined });
      toast.success(decision === 'approve' ? (res.status === 'processed' ? 'Refund processed' : 'Refund approved') : 'Refund rejected');
    } catch (err) {
      // The API refuses an admin approving their own request. Show that reason as-is.
      toast.error(errorText(err));
    }
  };

  const markDone = async (refundId: string) => {
    try {
      await processed.mutateAsync({ refundId, note: note.trim() || undefined });
      toast.success('Marked as processed');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds"
        description="The admin who requests a refund cannot approve it; a second admin decides. Approved refunds are paid out in the Pesapal dashboard, then marked processed here."
      />

      <Section
        flush
        title={`${filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)} refunds`}
        description={refunds ? `${refunds.length} refund${refunds.length === 1 ? '' : 's'}` : undefined}
      >
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize" aria-pressed={filter === f}>
                {f}
              </Button>
            ))}
          </div>
          <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 lg:w-auto">
            <Label htmlFor="decision-note" className="shrink-0 text-xs text-muted-foreground">Decision note (optional)</Label>
            <Input id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Recorded with your decision" className="h-9 sm:w-72" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5"><Loading /></div>
        ) : error ? (
          <div className="p-5"><Notice tone="error">{errorText(error, 'Refunds could not be loaded.')}</Notice></div>
        ) : !refunds || refunds.length === 0 ? (
          <Empty icon={RotateCcw}>No refunds here.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Requested</th>
                <th>Invoice</th>
                <th className="text-right">Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.refundId}>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(r.createdAt)}</td>
                  <td className="font-mono text-xs text-slate-600">{r.invoiceId.slice(0, 8)}</td>
                  <td className="whitespace-nowrap text-right font-medium text-slate-900 tabular-nums">{formatRwf(r.amount)}</td>
                  <td className="min-w-48 max-w-xs text-slate-700">
                    {r.reason}
                    {r.decisionNote ? <span className="mt-0.5 block text-xs text-muted-foreground">Note: {r.decisionNote}</span> : null}
                  </td>
                  <td><StatusBadge value={r.status} /></td>
                  <td>
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" disabled={decide.isPending} onClick={() => decideRefund(r.refundId, 'approve')}>Approve</Button>
                        <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decideRefund(r.refundId, 'reject')}>Reject</Button>
                      </div>
                    ) : r.status === 'approved' ? (
                      <Button size="sm" className="whitespace-nowrap" disabled={processed.isPending} onClick={() => markDone(r.refundId)}>Mark processed</Button>
                    ) : r.status === 'failed' && r.failureReason ? (
                      <span className="text-xs text-rose-700">{r.failureReason}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
