'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Loading, Notice, Section, StatCard, StatusBadge, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
import { useAuthHooks } from '@/hooks/useAuth';
import { useProviderDashboard } from '@/hooks/useDashboards';

export default function DoctorDashboardPage() {
  const { user } = useAuthHooks();
  const { data, isLoading, error, refetch } = useProviderDashboard();

  if (isLoading) return <Loading />;
  if (error || !data) {
    return (
      <Notice tone="error">
        {errorText(error, 'Your dashboard could not be loaded.')}{' '}
        <Button variant="link" className="px-1" onClick={() => refetch()}>Try again</Button>
      </Notice>
    );
  }

  const { doctor, appointments, invoices } = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome{user?.profile?.firstName ? `, Dr. ${user.profile.lastName ?? user.profile.firstName}` : ''}
          </h1>
          <p className="text-sm text-gray-600">{doctor.specialty ?? 'Clinical practice'} · your practice at a glance</p>
        </div>
        <Link href="/doctor/appointments"><Button variant="outline">All appointments</Button></Link>
      </div>

      {doctor.facility === null ? (
        <Notice tone="warning">You are not yet assigned to a verified facility. Payments for your consultations are settled through a facility, so ask your administrator to link you.</Notice>
      ) : doctor.facility.verificationStatus !== 'verified' ? (
        <Notice tone="warning">Your facility {doctor.facility.name ? `(${doctor.facility.name})` : ''} is {doctor.facility.verificationStatus ?? 'not verified'}.</Notice>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today" value={appointments.today} hint="Scheduled or in progress" />
        <StatCard label="Next 7 days" value={appointments.nextSevenDays} />
        <StatCard label="Completed" value={appointments.completed} hint={`${appointments.noShow} no-show · ${appointments.cancelled} cancelled`} />
        <StatCard label="Patients" value={data.patients.total} hint={`${data.consultations.total} consultations`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="Paid revenue" value={formatRwf(invoices.paidAmount)} hint={`${invoices.paidCount} invoices`} />
        <StatCard label="Awaiting payment" value={formatRwf(invoices.pendingAmount)} hint={`${invoices.pendingCount} invoices`} />
        <StatCard label="Refunded" value={formatRwf(invoices.refundedAmount)} />
      </div>

      <Section title="Facility">
        {doctor.facility ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-gray-900">{doctor.facility.name ?? 'Facility'}</span>
            <StatusBadge value={doctor.facility.verificationStatus} />
          </div>
        ) : (
          <Empty>No facility assigned.</Empty>
        )}
      </Section>

      <Section title="Upcoming appointments">
        {data.upcomingAppointments.length === 0 ? (
          <Empty>No upcoming appointments.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingAppointments.map((a) => (
                  <TableRow key={a.appointmentId}>
                    <TableCell>{a.patientName}</TableCell>
                    <TableCell>{formatDate(a.scheduledDate)} · {a.scheduledTime.slice(0, 5)}</TableCell>
                    <TableCell className="capitalize">{a.appointmentType.replace(/_/g, ' ')}</TableCell>
                    <TableCell><StatusBadge value={a.appointmentStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>
    </div>
  );
}
