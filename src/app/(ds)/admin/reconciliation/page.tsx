'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Loading, Notice, Section, StatusBadge, errorText, formatDate } from '@/components/dashboard/common';
import { useReconciliationRun, useReconciliationRuns, useRunReconciliation } from '@/hooks/useDashboards';

export default function AdminReconciliationPage() {
  const { data: runs, isLoading, error } = useReconciliationRuns();
  const run = useRunReconciliation();
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useReconciliationRun(selected);

  const start = async () => {
    try {
      const res = await run.mutateAsync();
      setSelected(res.runId);
      toast.success(`Run complete: ${res.mismatchCount} finding(s)`);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment reconciliation</h1>
          <p className="text-sm text-gray-600">Compares payments, invoices and refunds, and re-checks pending payments with Pesapal.</p>
        </div>
        <Button onClick={start} disabled={run.isPending}>{run.isPending ? 'Running…' : 'Run reconciliation'}</Button>
      </div>

      <Section title="Past runs">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <Notice tone="error">{errorText(error, 'Runs could not be loaded.')}</Notice>
        ) : !runs || runs.length === 0 ? (
          <Empty>No runs yet. Run one to check the latest payments.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Triggered by</TableHead>
                  <TableHead className="text-right">Payments checked</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Findings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.runId} className={selected === r.runId ? 'bg-sky-50' : undefined}>
                    <TableCell>{formatDate(r.startedAt)}</TableCell>
                    <TableCell className="text-xs">{r.triggeredBy === 'schedule' ? 'Schedule' : r.triggeredBy.slice(0, 8)}</TableCell>
                    <TableCell className="text-right">{r.checkedTransactions}</TableCell>
                    <TableCell className="text-right">{r.resolvedCount}</TableCell>
                    <TableCell className="text-right">{r.mismatchCount}</TableCell>
                    <TableCell><StatusBadge value={r.status} /></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelected(r.runId)}>View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      {selected ? (
        <Section title="Findings">
          {detail.isLoading ? (
            <Loading />
          ) : detail.error || !detail.data ? (
            <Notice tone="error">{errorText(detail.error, 'Run could not be loaded.')}</Notice>
          ) : detail.data.findings.length === 0 ? (
            <Notice tone="success">No mismatches in this run.</Notice>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.data.findings.map((f, i) => (
                    <TableRow key={`${f.type}-${f.reference}-${i}`}>
                      <TableCell><StatusBadge value={f.type.replace(/_/g, ' ')} /></TableCell>
                      <TableCell className="font-mono text-xs">{f.reference}</TableCell>
                      <TableCell className="whitespace-normal text-sm">{f.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>
      ) : null}
    </div>
  );
}
