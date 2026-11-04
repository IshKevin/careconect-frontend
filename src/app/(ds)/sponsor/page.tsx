'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/dashboard/common';
import { Empty, Loading, Notice, Section, StatCard, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
import { useSponsorDashboard } from '@/hooks/useDashboards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SponsorDashboardPage() {
  const { data, isLoading, error, refetch } = useSponsorDashboard();

  if (isLoading) return <Loading />;
  if (error || !data) {
    return (
      <Notice tone="error">
        {errorText(error, 'The dashboard could not be loaded.')}{' '}
        <Button variant="link" className="px-1" onClick={() => refetch()}>Try again</Button>
      </Notice>
    );
  }

  const { summary } = data.invoices;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sponsor dashboard</h1>
          <p className="text-sm text-gray-600">Book and pay for care for the patients you support.</p>
        </div>
        <Link href="/sponsor/links"><Button>Manage patient links</Button></Link>
      </div>

      <Notice>
        Payments never give access to medical records. Medical information is shared only when the patient grants it from their own account.
      </Notice>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Linked patients" value={data.linkedPatients.length} />
        <StatCard label="Waiting for approval" value={data.pendingRequests.length} hint="Patients must approve requests" />
        <StatCard label="Unpaid invoices" value={summary.pendingCount} hint={formatRwf(summary.pendingAmount)} />
        <StatCard label="Paid invoices" value={summary.paidCount} hint={formatRwf(summary.paidAmount)} />
      </div>

      <Section title="Linked patients">
        {data.linkedPatients.length === 0 ? (
          <Empty>No linked patients yet. Request a link with the patient&apos;s email address.</Empty>
        ) : (
          <ul className="divide-y">
            {data.linkedPatients.map((p) => (
              <li key={p.linkId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs capitalize text-gray-500">{p.relationship}</p>
                </div>
                <span className="text-xs text-gray-600">
                  {p.medicalAccessGranted ? 'Medical access granted by patient' : 'No medical access'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {data.pendingRequests.length > 0 ? (
        <Section title="Requests waiting for the patient">
          <ul className="divide-y">
            {data.pendingRequests.map((r) => (
              <li key={r.linkId} className="flex items-center justify-between py-2 text-sm">
                <span>{r.patientName}</span>
                <span className="text-gray-500">Requested {formatDate(r.requestedAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Upcoming appointments">
        {data.upcomingAppointments.length === 0 ? (
          <Empty>No upcoming appointments for your patients.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingAppointments.map((a) => (
                  <TableRow key={a.appointmentId}>
                    <TableCell>{a.patientName}</TableCell>
                    <TableCell>{a.doctorName}</TableCell>
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

      <Section title="Recent invoices">
        {data.invoices.recent.length === 0 ? (
          <Empty>No invoices for your patients yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.recent.map((inv) => (
                  <TableRow key={inv.invoiceId}>
                    <TableCell>{inv.invoiceNumber ?? '—'}</TableCell>
                    <TableCell>{inv.patientName}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="text-right">{formatRwf(inv.totalAmount)}</TableCell>
                    <TableCell><StatusBadge value={inv.invoiceStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <Section title="Recent payments">
        {data.recentPayments.length === 0 ? (
          <Empty>No completed payments yet.</Empty>
        ) : (
          <ul className="divide-y text-sm">
            {data.recentPayments.map((p) => (
              <li key={p.txRef} className="flex items-center justify-between py-2">
                <span>{p.patientName} · {formatDate(p.completedAt)}</span>
                <span className="font-medium">{formatRwf(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
