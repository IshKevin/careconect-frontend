'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, ClipboardList, FileHeart, Paperclip, Pill, Search, ShieldAlert } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Empty, Loading, Notice, PageHeader, Section, StatCard, StatusBadge, formatDate } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

const selectClass =
  'h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

type HistoryItem = {
  historyId: string;
  conditionName: string;
  onsetDate?: string;     // ISO
  resolutionDate?: string;
  status?: 'active' | 'resolved' | 'ongoing' | string;
  notes?: string;
  severity?: 'mild' | 'moderate' | 'severe' | string;
  attachments?: Array<{ name: string; url?: string }>;
};

export default function MedicalHistoryPage() {
  const { user } = useAuthHooks();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI-only state (doesn't change your backend behavior)
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'ongoing'>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/patient/medical-history');
        setHistory(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (err: unknown) {
        let msg = 'Failed to fetch medical history';
        if (typeof err === 'string') msg = err;
        else if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = useMemo(() => {
    let list = [...history];

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        i =>
          (i.conditionName ?? '').toLowerCase().includes(query) ||
          (i.notes ?? '').toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(i => (i.status ?? '').toLowerCase() === statusFilter);
    }
    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => +(new Date(b.onsetDate ?? 0)) - +(new Date(a.onsetDate ?? 0)));
        break;
      case 'oldest':
        list.sort((a, b) => +(new Date(a.onsetDate ?? 0)) - +(new Date(b.onsetDate ?? 0)));
        break;
      case 'name':
        list.sort((a, b) => (a.conditionName ?? '').localeCompare(b.conditionName ?? ''));
        break;
    }
    return list;
  }, [history, q, sortBy, statusFilter]);

  if (!user) return null;

  const countBy = (s: string) => history.filter(i => (i.status ?? '').toLowerCase() === s).length;

  const severityDot = (sev?: string) => {
    const v = (sev ?? '').toLowerCase();
    const c =
      v === 'severe' ? 'bg-rose-500' :
        v === 'moderate' ? 'bg-amber-500' :
          v === 'mild' ? 'bg-emerald-500' : 'bg-slate-300';
    return (
      <span className="inline-flex items-center gap-1.5 text-xs capitalize text-slate-600">
        <span className={cn('size-2 rounded-full', c)} /> {sev ?? '—'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical history"
        description="Conditions recorded by your care team, with onset and resolution dates."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/patient/allergies"><ShieldAlert /> Allergies</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/patient/medications"><Pill /> Medications</Link>
            </Button>
          </>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Records" value={loading ? '—' : history.length} icon={ClipboardList} />
        <StatCard label="Active" value={loading ? '—' : countBy('active')} icon={Activity} tone="green" />
        <StatCard label="Ongoing" value={loading ? '—' : countBy('ongoing')} icon={FileHeart} tone="amber" />
        <StatCard label="Resolved" value={loading ? '—' : countBy('resolved')} icon={CheckCircle2} tone="gray" />
      </div>

      <Section
        title="History"
        description={`Showing ${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
        flush
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conditions or notes…"
              className="pl-9"
              aria-label="Search conditions or notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'resolved' | 'ongoing')}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="ongoing">Ongoing</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
              className={selectClass}
              aria-label="Sort"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>

            {(q || statusFilter !== 'all' || sortBy !== 'newest') && (
              <Button
                variant="ghost"
                className="col-span-2 sm:col-span-1"
                onClick={() => { setQ(''); setStatusFilter('all'); setSortBy('newest'); }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-5"><Loading rows={4} /></div>
        ) : filtered.length === 0 ? (
          <Empty icon={FileHeart}>
            {history.length === 0
              ? 'No medical history found. Conditions your doctor records will appear here.'
              : 'No records match your search.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((item) => (
              <li key={item.historyId} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{item.conditionName}</h3>
                  <StatusBadge value={item.status ?? 'unknown'} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Onset {formatDate(item.onsetDate)}
                  {item.resolutionDate && <> · Resolved {formatDate(item.resolutionDate)}</>}
                </p>
                {(item.severity || item.notes) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    {severityDot(item.severity)}
                    {item.notes && <span className="line-clamp-2 max-w-prose">{item.notes}</span>}
                  </div>
                )}

                {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.attachments.map((a, idx) => (
                      <a
                        key={idx}
                        href={a.url || '#'}
                        target={a.url ? '_blank' : undefined}
                        rel={a.url ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={(e) => { if (!a.url) e.preventDefault(); }}
                      >
                        <Paperclip className="size-3.5" /> {a.name || `File ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
