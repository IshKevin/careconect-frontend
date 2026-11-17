'use client';

import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared building blocks for every dashboard page. Use these instead of page-specific colours and cards,
// so the whole app keeps one look: PageHeader at the top, StatCard rows, Section cards, StatusBadge,
// Notice for messages, Loading and Empty states.

// Money is shown in RWF with thousands separators. Amounts arrive as strings from the API.
export const formatRwf = (amount: string | number | null | undefined) => {
  const n = Number(amount ?? 0);
  return `RWF ${Number.isFinite(n) ? n.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : '0'}`;
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Error text from an axios error or a thrown string.
export const errorText = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  const e = error as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
  return e?.response?.data?.message ?? e?.response?.data?.error?.message ?? (typeof error === 'string' ? error : e?.message) ?? fallback;
};

/** An appointment that can still be joined, rescheduled or cancelled (not finished or called off). */
export const isOpenAppointment = (status: string | null | undefined) =>
  !['completed', 'cancelled', 'no_show', 'rescheduled'].includes((status ?? '').toLowerCase());

type Tone = 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'gray';

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  green: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  blue: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  amber: { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  red: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  violet: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-500' },
  gray: { badge: 'bg-slate-50 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' },
};

const STATUS_TONE: Record<string, Tone> = {
  pending: 'amber',
  pending_verification: 'amber',
  in_progress: 'amber',
  active: 'green',
  verified: 'green',
  paid: 'green',
  processed: 'green',
  completed: 'green',
  approved: 'blue',
  scheduled: 'blue',
  confirmed: 'blue',
  rescheduled: 'violet',
  refunded: 'violet',
  revoked: 'red',
  rejected: 'red',
  failed: 'red',
  suspended: 'red',
  cancelled: 'red',
  no_show: 'red',
  inactive: 'gray',
  unpaid: 'amber',
  overdue: 'red',
  ongoing: 'amber',
  resolved: 'gray',
};

export function StatusBadge({ value, className }: { value: string | null | undefined; className?: string }) {
  const key = (value ?? '').toLowerCase().replace(/\s+/g, '_');
  const tone = TONE_CLASSES[STATUS_TONE[key] ?? 'gray'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset', tone.badge, className)}>
      <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden />
      {(value ?? 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

/** Title block at the top of a page. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const ICON_TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  gray: 'bg-brand-50 text-brand-600',
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'gray',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn('grid size-9 place-items-center rounded-xl', ICON_TONE[tone])}>
            <Icon className="size-[18px]" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  flush = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** true: no inner padding (for tables that run edge to edge). */
  flush?: boolean;
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'error' | 'success' | 'warning'; children: ReactNode; className?: string }) {
  const tones = {
    info: { box: 'border-sky-200 bg-sky-50 text-sky-900', icon: Info, iconClass: 'text-sky-500' },
    error: { box: 'border-rose-200 bg-rose-50 text-rose-900', icon: AlertCircle, iconClass: 'text-rose-500' },
    success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2, iconClass: 'text-emerald-500' },
    warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert, iconClass: 'text-amber-500' },
  }[tone];
  const Icon = tones.icon;
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', tones.box, className)} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', tones.iconClass)} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Skeleton rows while data loads. */
export function Loading({ label = 'Loading…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-3 py-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

export function Empty({ children, icon: Icon = Inbox, action }: { children: ReactNode; icon?: ComponentType<{ className?: string }>; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-6" />
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

/** Consistent table styling: wrap a <table> in this. */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-px overflow-x-auto">
      <table className="w-full text-left text-sm [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr:hover]:bg-slate-50/70 [&_td]:px-5 [&_td]:py-3 [&_td]:align-middle [&_th]:bg-slate-50/80 [&_th]:px-5 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500">
        {children}
      </table>
    </div>
  );
}
