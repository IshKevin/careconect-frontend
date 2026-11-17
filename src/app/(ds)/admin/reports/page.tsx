'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  DataTable, Empty, Loading, Notice, PageHeader, Section, StatCard, StatusBadge, formatDate, formatRwf,
} from '@/components/dashboard/common';
import { Activity, ChevronLeft, ChevronRight, Clock, FileText, Wallet } from 'lucide-react';

interface Report {
  id: string;
  type: string;
  createdAt: string;
  [key: string]: unknown;
}

interface ApiResponse {
  success: boolean;
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: string;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Filters {
  startDate: string;
  endDate: string;
  groupBy?: string;
  page: string;
}

type Row = Record<string, unknown>;

const REPORT_LABELS: Record<string, string> = {
  activityLogs: 'Activity logs',
  appointments: 'Appointments',
  invoices: 'Invoices',
  financial: 'Financial',
  clinical: 'Clinical',
  userActivity: 'New users',
  systemPerformance: 'System performance',
};

// The report endpoints answer with plain objects such as { trends: [...] }, { summaries: [...] },
// { logs: [...] } or a set of totals. These helpers turn that payload into rows and stat cards.
const ROW_KEYS = ['trends', 'summaries', 'logs'] as const;
const LABEL_KEYS = ['bucket', 'type', 'status'] as const;
const VALUE_KEYS = ['count', 'total'] as const;

const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const isAmountKey = (key: string) => /amount|revenue/i.test(key);

const formatCell = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (isAmountKey(key)) return formatRwf(value as string);
  if (key === 'bucket') return formatDate(String(value));
  if (typeof value === 'object') return JSON.stringify(value);
  const n = Number(value);
  return typeof value !== 'boolean' && Number.isFinite(n) && String(value).trim() !== '' ? n.toLocaleString() : String(value);
};

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function ReportsPage() {
  const { user } = useAuthHooks();
  const [reports, setReports] = useState<Report[]>([]);
  const [payload, setPayload] = useState<Row | null>(null);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>('appointments');
  const [filters, setFilters] = useState<Filters>({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'month',
    page: '1',
  });

  const reportEndpoints: Record<string, string> = useMemo(() => ({
    activityLogs: '/reports/admin/activity/logs',
    appointments: '/reports/admin/reports/appointments',
    invoices: '/reports/admin/reports/invoices',
    financial: '/reports/admin/reports/financial',
    clinical: '/reports/admin/reports/clinical',
    userActivity: '/reports/admin/reports/user-activity',
    systemPerformance: '/reports/admin/reports/system-performance',
  }), []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...(filters.groupBy && { groupBy: filters.groupBy }),
          page: filters.page || '1',
          limit: '50',
        }).toString();
        const endpoint = reportEndpoints[reportType] || reportEndpoints.appointments;
        const response = await api.get<ApiResponse>(`${endpoint}?${query}`);
        setReports(Array.isArray(response.data.data) ? response.data.data : []);
        setPagination(response.data.pagination || null);
        setPayload(response.data && typeof response.data === 'object' ? (response.data as unknown as Row) : null);
      } catch (err: unknown) {
        let msg = 'Failed to fetch reports';
        if (typeof err === 'string') msg = err;
        else if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
        setReports([]);
        setPayload(null);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReports();
  }, [user, reportType, filters, reportEndpoints]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value, page: '1' }));
    if (name === 'reportType') setReportType(value);
  };

  // Rows (for the chart and table) and totals (for stat cards) read from the report payload.
  const view = useMemo(() => {
    if (!payload) return { rows: [] as Row[], totals: [] as { key: string; value: unknown }[], generatedAt: null as string | null };
    const source = (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload) as Row;
    const rowKey = ROW_KEYS.find((k) => Array.isArray(source[k]));
    const rows = rowKey ? (source[rowKey] as Row[]) : [];
    const totals = rowKey
      ? []
      : Object.entries(source)
        .filter(([k]) => !['success', 'generatedAt', 'pagination', 'message'].includes(k))
        .map(([key, value]) => ({ key, value }));
    return { rows, totals, generatedAt: typeof source.generatedAt === 'string' ? source.generatedAt : null };
  }, [payload]);

  const columns = useMemo(() => (view.rows[0] ? Object.keys(view.rows[0]) : []), [view.rows]);
  const labelKey = LABEL_KEYS.find((k) => columns.includes(k));
  const valueKey = VALUE_KEYS.find((k) => columns.includes(k));
  const chartData = useMemo(
    () => (labelKey && valueKey
      ? view.rows.map((r) => ({ label: labelKey === 'bucket' ? formatDate(String(r[labelKey])) : String(r[labelKey] ?? '—'), value: Number(r[valueKey] ?? 0) }))
      : []),
    [view.rows, labelKey, valueKey],
  );

  if (!user) return <Empty>Please log in to view the reports page.</Empty>;

  const title = REPORT_LABELS[reportType] ?? reportType;
  const hasContent = reports.length > 0 || view.rows.length > 0 || view.totals.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Appointment, invoice, financial and user activity reports for a date range."
      />

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="report-type" className="text-xs text-muted-foreground">Report</Label>
          <Select
            value={reportType}
            onValueChange={(v) => handleFilterChange('reportType', v)}
          >
            <SelectTrigger id="report-type" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(reportEndpoints).map(key => (
                <SelectItem key={key} value={key}>{REPORT_LABELS[key] ?? key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="report-start" className="text-xs text-muted-foreground">From</Label>
          <Input
            id="report-start"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="report-end" className="text-xs text-muted-foreground">To</Label>
          <Input
            id="report-end"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Section title={title}><Loading /></Section>
      ) : !hasContent ? (
        !error && (
          <Section title={title}>
            <Empty icon={FileText}>No reports found for the selected filters.</Empty>
          </Section>
        )
      ) : reports.length > 0 ? (
        <Section flush title={title} description={pagination ? `Total: ${pagination.total}` : undefined}>
          <DataTable>
            <thead>
              <tr>
                <th>Type</th>
                <th>Created</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="whitespace-nowrap font-medium text-slate-900">{report.type}</td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(report.createdAt)}</td>
                  <td className="min-w-64">
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                      {JSON.stringify(report, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {pagination && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.pages} · Total: {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => setFilters({ ...filters, page: (pagination.page - 1).toString() })}
                >
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => setFilters({ ...filters, page: (pagination.page + 1).toString() })}
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Section>
      ) : view.totals.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {view.totals.map(({ key, value }) => {
              if (value && typeof value === 'object') {
                const v = value as { amount?: string; count?: number | string };
                return (
                  <StatCard
                    key={key}
                    label={humanize(key)}
                    value={v.amount !== undefined ? formatRwf(v.amount) : formatCell('count', v.count)}
                    hint={v.amount !== undefined && v.count !== undefined ? `${Number(v.count).toLocaleString()} invoice${Number(v.count) === 1 ? '' : 's'}` : undefined}
                    icon={Wallet}
                    tone={key === 'paid' ? 'green' : key === 'pending' ? 'amber' : key === 'cancelled' ? 'red' : 'gray'}
                  />
                );
              }
              if (key === 'status') {
                return <StatCard key={key} label="Status" value={<StatusBadge value={String(value)} className="text-sm" />} icon={Activity} tone="green" />;
              }
              if (key === 'uptimeSeconds') {
                return <StatCard key={key} label="Uptime" value={formatUptime(Number(value))} icon={Clock} tone="blue" />;
              }
              return <StatCard key={key} label={humanize(key)} value={formatCell(key, value)} />;
            })}
          </div>
          {view.generatedAt ? (
            <p className="text-xs text-muted-foreground">Generated {new Date(view.generatedAt).toLocaleString()}</p>
          ) : null}
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <Section title={title} description={valueKey === 'total' ? 'New accounts per period' : 'Count per group'}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis fontSize={11} allowDecimals={false} width={40} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: 'rgb(148 163 184 / 0.12)' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-raised)', fontSize: 12 }}
                    />
                    <Bar dataKey="value" name={valueKey ? humanize(valueKey) : 'Value'} fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          <Section flush title={chartData.length > 0 ? 'Breakdown' : title} description={`${view.rows.length} row${view.rows.length === 1 ? '' : 's'}`}>
            <DataTable>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} className={c === labelKey || c === 'status' ? undefined : 'text-right'}>{c === 'bucket' ? 'Period' : humanize(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td
                        key={c}
                        className={c === labelKey || c === 'status' ? 'whitespace-nowrap font-medium text-slate-900' : 'whitespace-nowrap text-right tabular-nums text-slate-700'}
                      >
                        {c === 'status' && typeof row[c] === 'string' ? <StatusBadge value={row[c] as string} /> : formatCell(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Section>
        </>
      )}

      <span className="sr-only" aria-live="polite">{loading ? 'Loading report' : ''}</span>
    </div>
  );
}
