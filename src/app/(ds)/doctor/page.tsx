'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
import { useAuthHooks } from '@/hooks/useAuth';
import { useProviderDashboard } from '@/hooks/useDashboards';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// Local calendar date as YYYY-MM-DD, to match the API's scheduledDate.
const todayKey = () => new Date().toLocaleDateString('en-CA');

const typeLabel = (t: string) => t.replace(/_/g, ' ');

export default function DoctorDashboardPage() {
  const { user } = useAuthHooks();
  const { data, isLoading, error, refetch } = useProviderDashboard();

  const name = user?.profile?.lastName || user?.profile?.firstName;
  const title = `${greeting()}${name ? `, Dr. ${name}` : ''}`;

  if (isLoading) {
    return (
      <div>
        <PageHeader title={title} description="Loading your practice overview…" />
        <Loading rows={4} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <PageHeader title={title} />
        <Notice tone="error">
          {errorText(error, 'Your dashboard could not be loaded.')}{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>Try again</Button>
        </Notice>
      </div>
    );
  }

  const { doctor, appointments, invoices } = data;
  const today = todayKey();
  const todays = data.upcomingAppointments.filter((a) => a.scheduledDate?.slice(0, 10) === today);
  const later = data.upcomingAppointments.filter((a) => a.scheduledDate?.slice(0, 10) !== today);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={`${doctor.specialty ?? 'Clinical practice'} · here is your day at a glance`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/doctor/schedule"><CalendarDays /> My schedule</Link>
            </Button>
            <Button asChild>
              <Link href="/doctor/appointments">All appointments <ArrowRight /></Link>
            </Button>
          </>
        }
      />

      {doctor.facility === null ? (
        <Notice tone="warning">
          You are not yet assigned to a verified facility. Payments for your consultations are settled through a facility, so ask your administrator to link you.
        </Notice>
      ) : doctor.facility.verificationStatus !== 'verified' ? (
        <Notice tone="warning">
          Your facility {doctor.facility.name ? `(${doctor.facility.name})` : ''} is {doctor.facility.verificationStatus ?? 'not verified'}.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={appointments.today} hint="Scheduled or in progress" icon={CalendarClock} tone="blue" />
        <StatCard label="Next 7 days" value={appointments.nextSevenDays} hint="Upcoming appointments" icon={CalendarDays} tone="violet" />
        <StatCard
          label="Awaiting payment"
          value={formatRwf(invoices.pendingAmount)}
          hint={`${invoices.pendingCount} invoice${invoices.pendingCount === 1 ? '' : 's'}`}
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Completed"
          value={appointments.completed}
          hint={`${appointments.noShow} no-show · ${appointments.cancelled} cancelled`}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          className="lg:col-span-2"
          title="Today's appointments"
          description={formatDate(today)}
          flush
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/doctor/appointments">View all</Link>
            </Button>
          }
        >
          {todays.length === 0 ? (
            <Empty
              icon={CalendarCheck}
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/doctor/schedule">Review your availability</Link>
                </Button>
              }
            >
              No appointments today. Patients can book any open slot in your weekly schedule.
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {todays.map((a) => (
                <li key={a.appointmentId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <div className="flex w-16 shrink-0 flex-col items-start">
                    <span className="text-base font-semibold tabular-nums text-slate-900">{a.scheduledTime.slice(0, 5)}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> today
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{a.patientName}</p>
                    <p className="text-xs capitalize text-muted-foreground">{typeLabel(a.appointmentType)}</p>
                  </div>
                  <StatusBadge value={a.appointmentStatus} />
                  {a.appointmentStatus !== 'cancelled' ? (
                    <Button size="sm" asChild>
                      <Link href="/doctor/appointments">Open</Link>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Facility">
            {doctor.facility ? (
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate font-medium text-slate-900">{doctor.facility.name ?? 'Facility'}</p>
                  <StatusBadge value={doctor.facility.verificationStatus} />
                </div>
              </div>
            ) : (
              <Empty icon={Building2}>No facility assigned. Ask your administrator to link you to one.</Empty>
            )}
          </Section>

          <Section title="Practice">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /> Patients</dt>
                <dd className="font-medium tabular-nums text-slate-900">{data.patients.total}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground"><Stethoscope className="size-4" /> Consultations</dt>
                <dd className="font-medium tabular-nums text-slate-900">{data.consultations.total}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Paid revenue</dt>
                <dd className="text-right font-medium tabular-nums text-slate-900">
                  {formatRwf(invoices.paidAmount)}
                  <span className="block text-xs font-normal text-muted-foreground">{invoices.paidCount} invoices</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Refunded</dt>
                <dd className="font-medium tabular-nums text-slate-900">{formatRwf(invoices.refundedAmount)}</dd>
              </div>
            </dl>
          </Section>
        </div>
      </div>

      <Section title="Coming up" description="Your next appointments after today" flush>
        {later.length === 0 ? (
          <Empty icon={CalendarDays}>No other upcoming appointments.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {later.map((a) => (
                <tr key={a.appointmentId}>
                  <td className="font-medium text-slate-900">{a.patientName}</td>
                  <td className="whitespace-nowrap tabular-nums">{formatDate(a.scheduledDate)} · {a.scheduledTime.slice(0, 5)}</td>
                  <td className="capitalize">{typeLabel(a.appointmentType)}</td>
                  <td><StatusBadge value={a.appointmentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
