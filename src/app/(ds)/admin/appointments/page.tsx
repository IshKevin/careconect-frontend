'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, Search } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { get } from '@/lib/api/api';
import { safeLocalStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatusBadge } from '@/components/dashboard/common';

interface Appointment {
  appointmentId: string;
  scheduledDate: string;
  reason: string;
  status: string;
  patientName?: string;
  doctorName?: string;
}

// Shape returned by GET /appointments/ (admin list).
interface ApiAppointment {
  appointmentId: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  appointmentType?: string | null;
  appointmentStatus?: string | null;
  reason?: string | null;
  status?: string | null;
  patient?: { profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  doctor?: { firstName?: string | null; lastName?: string | null } | null;
}

interface AppointmentsResponse {
  data: ApiAppointment[];
  pagination?: { total: number | string };
}

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'] as const;
type StatusFilter = 'all' | (typeof STATUS_OPTIONS)[number];

const fullName = (first?: string | null, last?: string | null) => {
  const n = `${first ?? ''} ${last ?? ''}`.trim();
  return n || undefined;
};

const toAppointment = (a: ApiAppointment): Appointment => ({
  appointmentId: a.appointmentId,
  scheduledDate: a.scheduledTime ? `${a.scheduledDate}T${a.scheduledTime}` : a.scheduledDate,
  reason: a.reason ?? (a.appointmentType ? a.appointmentType.replace(/_/g, ' ') : ''),
  status: a.appointmentStatus ?? a.status ?? '',
  patientName: fullName(a.patient?.profile?.firstName, a.patient?.profile?.lastName),
  doctorName: fullName(a.doctor?.firstName, a.doctor?.lastName),
});

export default function AdminAppointmentsPage() {
  const { user } = useAuthHooks();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // UI state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'soonest' | 'latest' | 'patient' | 'doctor'>('soonest');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setApiError('User not authenticated. Please log in.');
        return;
      }
      if (user.userType !== 'admin') {
        setApiError('Access denied. Admin privileges required.');
        return;
      }

      setLoading(true);
      setApiError(null);

      try {
        const token = safeLocalStorage.getItem('accessToken');
        if (!token) throw new Error('No access token found. Please log in again.');

        const data = await get<AppointmentsResponse>('/appointments/', { params: { limit: 100 } });
        const list = Array.isArray(data?.data) ? data.data : [];
        setAppointments(list.map(toAppointment));
        const t = Number(data?.pagination?.total);
        setTotal(Number.isFinite(t) ? t : null);
      } catch (err: unknown) {
        console.error('Error fetching appointments:', err);
        setAppointments([]);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setApiError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const filtered = useMemo(() => {
    let list = [...appointments];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter(a => {
        const base = `${a.appointmentId} ${a.reason} ${a.patientName ?? ''} ${a.doctorName ?? ''}`.toLowerCase();
        return base.includes(q);
      });
    }

    if (statusFilter !== 'all') list = list.filter(a => (a.status || '').toLowerCase() === statusFilter);

    switch (sortBy) {
      case 'soonest':
        list.sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
        break;
      case 'latest':
        list.sort((a, b) => +new Date(b.scheduledDate) - +new Date(a.scheduledDate));
        break;
      case 'patient':
        list.sort((a, b) => (a.patientName ?? '').localeCompare(b.patientName ?? ''));
        break;
      case 'doctor':
        list.sort((a, b) => (a.doctorName ?? '').localeCompare(b.doctorName ?? ''));
        break;
    }
    return list;
  }, [appointments, query, statusFilter, sortBy]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportCSV = () => {
    const rows = [
      ['Appointment ID', 'Scheduled Date', 'Reason', 'Status', 'Patient', 'Doctor'],
      ...filtered.map(a => {
        const d = new Date(a.scheduledDate);
        return [
          a.appointmentId,
          Number.isNaN(d.getTime()) ? a.scheduledDate : d.toISOString(),
          a.reason,
          a.status,
          a.patientName ?? '',
          a.doctorName ?? '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <Notice tone="info">Please log in to view the appointments.</Notice>;
  }

  const header = (
    <PageHeader
      title="All appointments"
      description={`Every booking on the platform${total !== null ? ` · ${total} in total` : ''}.`}
      actions={
        <Button type="button" variant="outline" onClick={exportCSV} disabled={loading || filtered.length === 0}>
          <Download /> Export CSV
        </Button>
      }
    />
  );

  if (apiError && !appointments.length && !loading) {
    return (
      <div className="space-y-6">
        {header}
        <Notice tone="error">
          <p className="font-medium">Appointments could not be loaded</p>
          <p className="mt-0.5">{apiError}</p>
        </Notice>
      </div>
    );
  }

  const hasFilters = statusFilter !== 'all' || !!query;

  return (
    <div className="space-y-6">
      {header}

      {apiError && appointments.length > 0 && <Notice tone="error">{apiError}</Notice>}
      {total !== null && total > appointments.length && (
        <Notice tone="info">Showing the first {appointments.length} of {total} appointments.</Notice>
      )}

      <Section
        flush
        title="Appointments"
        description={loading ? 'Loading…' : `${filtered.length} shown`}
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find by patient, doctor, reason, or ID…"
              className="pl-9"
              aria-label="Search appointments"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'soonest' | 'latest' | 'patient' | 'doctor')}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Sort appointments">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soonest">Soonest</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="patient">Patient A–Z</SelectItem>
                <SelectItem value="doctor">Doctor A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-3"><Loading rows={6} /></div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={CalendarDays}
            action={hasFilters ? (
              <Button variant="outline" size="sm" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Reset filters</Button>
            ) : undefined}
          >
            {hasFilters ? 'No appointments match your filters. Try changing the search or status filter.' : 'No appointments yet.'}
          </Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Scheduled</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Reason</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.appointmentId}>
                  <td className="whitespace-nowrap font-medium text-slate-900">{formatDate(a.scheduledDate)}</td>
                  <td className="whitespace-nowrap text-slate-700">{a.patientName ?? '—'}</td>
                  <td className="whitespace-nowrap text-slate-700">{a.doctorName ?? '—'}</td>
                  <td className="whitespace-nowrap"><StatusBadge value={a.status || 'pending'} /></td>
                  <td className="max-w-[320px] truncate capitalize text-slate-700" title={a.reason}>{a.reason || '—'}</td>
                  <td className="whitespace-nowrap font-mono text-xs text-muted-foreground" title={a.appointmentId}>{a.appointmentId.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
