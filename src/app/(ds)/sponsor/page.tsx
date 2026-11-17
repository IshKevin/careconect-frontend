'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Hourglass,
  Receipt,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DataTable,
  Empty,
  Loading,
  Notice,
  PageHeader,
  Section,
  StatCard,
  StatusBadge,
  errorText,
  formatDate,
  formatRwf,
} from '@/components/dashboard/common';
import { useSponsorDashboard } from '@/hooks/useDashboards';
import { cn } from '@/lib/utils';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export default function SponsorDashboardPage() {
  const { data, isLoading, error, refetch } = useSponsorDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sponsor dashboard" description="Book and pay for care for the patients you support." />
        <Loading rows={4} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Notice tone="error">
        {errorText(error, 'The dashboard could not be loaded.')}{' '}
        <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>Try again</Button>
      </Notice>
    );
  }

  const { summary } = data.invoices;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsor dashboard"
        description="Book and pay for care for the patients you support."
        actions={
          <Button asChild>
            <Link href="/sponsor/links"><UserPlus /> Manage patient links</Link>
          </Button>
        }
      />

      <Notice>
        Payments never give access to medical records. Medical information is shared only when the patient grants it from their own account.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Linked patients" value={data.linkedPatients.length} icon={Users} tone="blue" />
        <StatCard label="Waiting for approval" value={data.pendingRequests.length} hint="Patients must approve requests" icon={Hourglass} tone="amber" />
        <StatCard label="Unpaid invoices" value={summary.pendingCount} hint={formatRwf(summary.pendingAmount)} icon={Wallet} tone="red" />
        <StatCard label="Paid invoices" value={summary.paidCount} hint={formatRwf(summary.paidAmount)} icon={CheckCircle2} tone="green" />
      </div>

      <Section
        title="Linked patients"
        description="People you can book and pay for."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sponsor/links">Link a patient</Link>
          </Button>
        }
      >
        {data.linkedPatients.length === 0 ? (
          <Empty
            icon={Users}
            action={
              <Button size="sm" asChild>
                <Link href="/sponsor/links"><UserPlus /> Link a patient</Link>
              </Button>
            }
          >
            No linked patients yet. Request a link with the patient&apos;s email address.
          </Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.linkedPatients.map((p) => (
              <li key={p.linkId} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div>
                    <p className="truncate font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{p.relationship}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs',
                      p.medicalAccessGranted ? 'text-emerald-700' : 'text-muted-foreground',
                    )}
                  >
                    {p.medicalAccessGranted ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
                    {p.medicalAccessGranted ? 'Medical access granted by patient' : 'No medical access'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {data.pendingRequests.length > 0 ? (
        <Section title="Requests waiting for the patient" flush>
          <ul className="divide-y divide-border">
            {data.pendingRequests.map((r) => (
              <li key={r.linkId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-medium text-slate-900">{r.patientName}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  Requested {formatDate(r.requestedAt)}
                  <StatusBadge value="pending" />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Upcoming appointments" flush>
        {data.upcomingAppointments.length === 0 ? (
          <Empty icon={CalendarDays}>No upcoming appointments for your patients.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcomingAppointments.map((a) => (
                <tr key={a.appointmentId}>
                  <td className="font-medium text-slate-900">{a.patientName}</td>
                  <td>{a.doctorName}</td>
                  <td className="whitespace-nowrap tabular-nums">{formatDate(a.scheduledDate)} · {a.scheduledTime.slice(0, 5)}</td>
                  <td className="capitalize">{a.appointmentType.replace(/_/g, ' ')}</td>
                  <td><StatusBadge value={a.appointmentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section title="Recent invoices" className="lg:col-span-3" flush>
          {data.invoices.recent.length === 0 ? (
            <Empty icon={Receipt}>No invoices for your patients yet.</Empty>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.recent.map((inv) => (
                  <tr key={inv.invoiceId}>
                    <td className="whitespace-nowrap font-medium text-slate-900">{inv.invoiceNumber ?? '—'}</td>
                    <td>{inv.patientName}</td>
                    <td className="whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">{formatRwf(inv.totalAmount)}</td>
                    <td><StatusBadge value={inv.invoiceStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Section>

        <Section title="Recent payments" className="lg:col-span-2" flush>
          {data.recentPayments.length === 0 ? (
            <Empty icon={CreditCard}>No completed payments yet.</Empty>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {data.recentPayments.map((p) => (
                <li key={p.txRef} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.patientName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.completedAt)}</p>
                  </div>
                  <span className="whitespace-nowrap font-medium tabular-nums text-slate-900">{formatRwf(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
