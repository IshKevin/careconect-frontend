'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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

const BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  active: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  verified: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  processed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  completed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  approved: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  scheduled: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  confirmed: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  refunded: 'bg-violet-100 text-violet-800 ring-1 ring-violet-200',
  revoked: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  rejected: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  failed: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  suspended: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  cancelled: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const key = (value ?? '').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${BADGE[key] ?? 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}>
      {(value ?? 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success' | 'warning'; children: ReactNode }) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-6 text-center text-sm text-gray-500">{label}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-sm text-gray-500">{children}</p>;
}
