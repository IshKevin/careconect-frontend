'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DataTable, Empty, Loading, Notice, PageHeader, Section } from '@/components/dashboard/common';

import { ChevronLeft, ChevronRight, Download, RefreshCcw, ScrollText, Search } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  timestamp: string;
  userId?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  success: boolean;
  data: {
    logs: Log[];
    pagination: {
      page: number;
      limit: number;
      count: number;
    };
  };
}

interface Filters {
  startDate: string;
  endDate: string;
  page: string;
}

export default function AuditLogsPage() {
  const { user } = useAuthHooks();

  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<ApiResponse['data']['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    page: '1',
  });

  // UI-only helpers
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Fetch logs. The endpoint answers with { logs, pagination }, either at the top level or inside `data`.
  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const queryParams = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
          page: filters.page || '1',
          limit: '10',
        }).toString();

        const response = await api.get<ApiResponse | ApiResponse['data']>(`/reports/admin/activity/logs?${queryParams}`);
        const body = response.data && 'data' in response.data ? response.data.data : (response.data as ApiResponse['data'] | undefined);
        const fetchedLogs = Array.isArray(body?.logs) ? body.logs : [];
        const pg = body?.pagination ?? { page: Number(filters.page || '1'), limit: 10, count: fetchedLogs.length };

        setLogs(fetchedLogs);
        setPagination(pg);
      } catch (err: unknown) {
        setLogs([]);
        setPagination(null);
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Audit logs could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user, filters]);

  const allActions = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach(l => l?.action && set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let list = [...logs];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter(l => {
        const base = `${l.id} ${l.action} ${l.userId ?? ''}`.toLowerCase();
        const extra = Object.entries(l)
          .filter(([k]) => !['id', 'action', 'timestamp', 'userId'].includes(k))
          .map(([, v]) => JSON.stringify(v))
          .join(' ')
          .toLowerCase();
        return base.includes(q) || extra.includes(q);
      });
    }

    if (actionFilter !== 'all') {
      list = list.filter(l => l.action === actionFilter);
    }

    // Keep newest first
    list.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    return list;
  }, [logs, query, actionFilter]);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.max(1, Math.ceil(pagination.count / pagination.limit));
  }, [pagination]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: '1' });
  };

  const goPage = (p: number) => {
    if (!pagination) return;
    const safe = Math.min(Math.max(1, p), totalPages);
    setFilters({ ...filters, page: String(safe) });
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Action', 'Timestamp', 'User ID', 'Extras(JSON)'],
      ...filteredLogs.map(l => [
        l.id,
        l.action,
        new Date(l.timestamp).toISOString(),
        l.userId ?? '',
        JSON.stringify(
          Object.fromEntries(Object.entries(l).filter(([k]) => !['id', 'action', 'timestamp', 'userId'].includes(k)))
        ),
      ]),
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setQuery(''); setActionFilter('all'); setFilters({ ...filters, page: '1' }); };

  if (!user) {
    return <Empty>Please log in to view the audit logs page.</Empty>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="A record of sign-ins, account changes and admin actions."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ ...filters })} // triggers refetch; keeps same filters
              disabled={loading}
            >
              <RefreshCcw className={loading ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={exportCSV} disabled={!filteredLogs.length}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      {notice && <Notice tone="warning">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Section
        flush
        title="Activity"
        description={pagination ? `Page ${pagination.page} of ${totalPages} · Total: ${pagination.count}` : undefined}
      >
        {/* Filters toolbar */}
        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="log-start" className="text-xs text-muted-foreground">From</Label>
            <Input id="log-start" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="log-end" className="text-xs text-muted-foreground">To</Label>
            <Input id="log-end" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="log-search" className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="log-search"
                placeholder="Action, user, id or details"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  // reset page for client view
                  setFilters({ ...filters, page: '1' });
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="log-action" className="text-xs text-muted-foreground">Action</Label>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setFilters({ ...filters, page: '1' }); }}>
              <SelectTrigger id="log-action" className="w-full">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {allActions.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="ghost" onClick={clearFilters} className="justify-self-start lg:justify-self-auto">
            Clear
          </Button>
        </div>

        {loading && !logs.length ? (
          <div className="p-5"><Loading /></div>
        ) : filteredLogs.length ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <DataTable>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Time</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const extraEntries = Object.entries(log).filter(
                    ([k]) => !['id', 'action', 'timestamp', 'userId'].includes(k)
                  );
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap font-medium text-slate-900">{log.action}</td>
                      <td className="whitespace-nowrap text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="whitespace-nowrap">
                        {log.userId ? <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{log.userId}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="min-w-64">
                        {extraEntries.length ? (
                          <div className="grid gap-1">
                            {extraEntries.slice(0, 3).map(([k, v]) => (
                              <div key={k} className="text-xs text-slate-700">
                                <span className="font-medium text-slate-500">{k}:</span> <span className="break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                              </div>
                            ))}
                            {extraEntries.length > 3 && (
                              <details className="text-xs text-slate-600">
                                <summary className="cursor-pointer select-none font-medium text-brand-600">More</summary>
                                <pre className="mt-1 overflow-auto rounded-lg bg-slate-50 p-2 ring-1 ring-border">
                                  {JSON.stringify(Object.fromEntries(extraEntries), null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No extra fields</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>
        ) : (
          <Empty
            icon={ScrollText}
            action={query || actionFilter !== 'all' ? <Button variant="outline" size="sm" onClick={clearFilters}>Reset filters</Button> : undefined}
          >
            {logs.length ? 'No audit logs match your filters.' : 'No audit logs for this period.'}
          </Empty>
        )}

        {/* Pagination */}
        {pagination && filteredLogs.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing page {pagination.page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => goPage(pagination.page - 1)}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= totalPages || loading}
                onClick={() => goPage(pagination.page + 1)}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
