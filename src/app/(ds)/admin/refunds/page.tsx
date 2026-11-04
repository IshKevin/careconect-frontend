'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Loading, Notice, Section, StatusBadge, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Refunds</h1>
        <p className="text-sm text-gray-600">
          The admin who requests a refund cannot approve it. A second admin decides. Approved refunds are paid out in the Pesapal dashboard, then marked processed here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      <div className="max-w-md space-y-1">
        <Label htmlFor="decision-note">Decision note (optional)</Label>
        <Input id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Recorded with your decision" />
      </div>

      <Section title={`${filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)} refunds`}>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <Notice tone="error">{errorText(error, 'Refunds could not be loaded.')}</Notice>
        ) : !refunds || refunds.length === 0 ? (
          <Empty>No refunds here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.refundId}>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.invoiceId.slice(0, 8)}</TableCell>
                    <TableCell className="text-right">{formatRwf(r.amount)}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-sm">{r.reason}{r.decisionNote ? <span className="block text-xs text-gray-500">Note: {r.decisionNote}</span> : null}</TableCell>
                    <TableCell><StatusBadge value={r.status} /></TableCell>
                    <TableCell>
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={decide.isPending} onClick={() => decideRefund(r.refundId, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decideRefund(r.refundId, 'reject')}>Reject</Button>
                        </div>
                      ) : r.status === 'approved' ? (
                        <Button size="sm" disabled={processed.isPending} onClick={() => markDone(r.refundId)}>Mark processed</Button>
                      ) : r.status === 'failed' && r.failureReason ? (
                        <span className="text-xs text-rose-700">{r.failureReason}</span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>
    </div>
  );
}
