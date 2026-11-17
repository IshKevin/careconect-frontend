'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Scale } from 'lucide-react';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatusBadge, errorText, formatDate } from '@/components/dashboard/common';
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
      <PageHeader
        title="Payment reconciliation"
        description="Compares payments, invoices and refunds, and re-checks pending payments with Pesapal."
        actions={
          <Button onClick={start} disabled={run.isPending}>
            <RefreshCw className={run.isPending ? 'size-4 animate-spin' : 'size-4'} />
            {run.isPending ? 'Running…' : 'Run reconciliation'}
          </Button>
        }
      />

      <Section flush title="Past runs" description="Select a run to see its findings.">
        {isLoading ? (
          <div className="p-5"><Loading /></div>
        ) : error ? (
          <div className="p-5"><Notice tone="error">{errorText(error, 'Runs could not be loaded.')}</Notice></div>
        ) : !runs || runs.length === 0 ? (
          <Empty icon={Scale}>No runs yet. Run one to check the latest payments.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Started</th>
                <th>Triggered by</th>
                <th className="text-right">Payments checked</th>
                <th className="text-right">Resolved</th>
                <th className="text-right">Findings</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.runId} className={selected === r.runId ? 'bg-brand-50/60 hover:bg-brand-50/60' : undefined}>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(r.startedAt)}</td>
                  <td className="whitespace-nowrap text-xs text-slate-600">{r.triggeredBy === 'schedule' ? 'Schedule' : <span className="font-mono">{r.triggeredBy.slice(0, 8)}</span>}</td>
                  <td className="text-right tabular-nums">{r.checkedTransactions}</td>
                  <td className="text-right tabular-nums">{r.resolvedCount}</td>
                  <td className={r.mismatchCount > 0 ? 'text-right font-medium text-amber-700 tabular-nums' : 'text-right tabular-nums'}>{r.mismatchCount}</td>
                  <td><StatusBadge value={r.status} /></td>
                  <td className="text-right">
                    <Button variant={selected === r.runId ? 'secondary' : 'outline'} size="sm" onClick={() => setSelected(r.runId)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>

      {selected ? (
        <Section flush title="Findings" description={detail.data ? `Run started ${formatDate(detail.data.startedAt)}` : undefined}>
          {detail.isLoading ? (
            <div className="p-5"><Loading /></div>
          ) : detail.error || !detail.data ? (
            <div className="p-5"><Notice tone="error">{errorText(detail.error, 'Run could not be loaded.')}</Notice></div>
          ) : detail.data.findings.length === 0 ? (
            <div className="p-5"><Notice tone="success">No mismatches in this run.</Notice></div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {detail.data.findings.map((f, i) => (
                  <tr key={`${f.type}-${f.reference}-${i}`}>
                    <td className="whitespace-nowrap"><StatusBadge value={f.type.replace(/_/g, ' ')} /></td>
                    <td className="font-mono text-xs text-slate-600">{f.reference}</td>
                    <td className="min-w-56 text-slate-700">{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Section>
      ) : null}
    </div>
  );
}
