'use client';

import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Loading, Notice, Section, StatCard, StatusBadge, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
import { useAdminDashboard } from '@/hooks/useDashboards';

const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);

const ChartCard = ({ title, data }: { title: string; data: { label: string; value: number }[] }) => (
  <Section title={title}>
    {data.length === 0 ? (
      <Empty>No data in this period.</Empty>
    ) : (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" fontSize={11} tickLine={false} />
            <YAxis fontSize={11} allowDecimals={false} width={36} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </Section>
);

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();

  if (isLoading) return <Loading />;
  if (error || !data) {
    return (
      <Notice tone="error">
        {errorText(error, 'Metrics could not be loaded.')}{' '}
        <Button variant="link" className="px-1" onClick={() => refetch()}>Try again</Button>
      </Notice>
    );
  }

  const invoiceTotal = sum(Object.fromEntries(Object.entries(data.invoices.byStatus).map(([k, v]) => [k, v.count])));
  const appointmentsToday = data.appointments.daily.find((d) => d.date === new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' }))?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Operations dashboard</h1>
          <p className="text-sm text-gray-600">Live counts from the platform. Rwanda time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/refunds"><Button variant="outline">Refund queue</Button></Link>
          <Link href="/admin/facilities"><Button variant="outline">Facilities</Button></Link>
          <Link href="/admin/reconciliation"><Button variant="outline">Reconciliation</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={data.users.total} hint={`${data.users.newLast30Days} new in 30 days`} />
        <StatCard label="Unverified emails" value={data.users.unverifiedEmails} hint={`${data.users.suspended} suspended accounts`} />
        <StatCard label="Appointments today" value={appointmentsToday} />
        <StatCard label="Invoices" value={invoiceTotal} hint={`${data.invoices.byStatus.pending?.count ?? 0} unpaid`} />
        <StatCard label="Refunds awaiting decision" value={data.refunds.pendingApprovals} />
        <StatCard label="Active sponsor links" value={data.sponsorship.byStatus.active ?? 0} hint={`${data.sponsorship.activeWithMedicalAccess} with medical access`} />
        <StatCard label="Facilities to review" value={data.facilities.byStatus.pending ?? 0} />
        <StatCard
          label="Reconciliation mismatches"
          value={data.reconciliation?.mismatchCount ?? '—'}
          hint={data.reconciliation ? `Last run ${formatDate(data.reconciliation.lastRunAt)}` : 'No run yet'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Appointments, last 14 days" data={data.appointments.daily.map((d) => ({ label: d.date.slice(5), value: d.count }))} />
        <ChartCard title="Paid revenue, last 30 days (RWF)" data={data.invoices.revenueDaily.map((d) => ({ label: d.date.slice(5), value: Number(d.amount) }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Users by type">
          <Table>
            <TableBody>
              {Object.entries(data.users.byType).map(([type, n]) => (
                <TableRow key={type}>
                  <TableCell className="capitalize">{type.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-right font-medium">{n}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Money">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.invoices.byStatus).map(([status, v]) => (
                <TableRow key={`inv-${status}`}>
                  <TableCell>Invoices</TableCell>
                  <TableCell><StatusBadge value={status} /></TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                  <TableCell className="text-right">{formatRwf(v.amount)}</TableCell>
                </TableRow>
              ))}
              {Object.entries(data.payments.byStatus).map(([status, v]) => (
                <TableRow key={`pay-${status}`}>
                  <TableCell>Payments</TableCell>
                  <TableCell><StatusBadge value={status} /></TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                  <TableCell className="text-right">{formatRwf(v.amount)}</TableCell>
                </TableRow>
              ))}
              {Object.entries(data.refunds.byStatus).map(([status, v]) => (
                <TableRow key={`ref-${status}`}>
                  <TableCell>Refunds</TableCell>
                  <TableCell><StatusBadge value={status} /></TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                  <TableCell className="text-right">{formatRwf(v.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>

      <Section
        title="Facilities waiting for verification"
        action={<Link href="/admin/facilities"><Button variant="link" className="px-0">Open facilities</Button></Link>}
      >
        {data.facilities.toReview.length === 0 ? (
          <Empty>Nothing waiting for review.</Empty>
        ) : (
          <ul className="divide-y text-sm">
            {data.facilities.toReview.map((f) => (
              <li key={f.facilityId} className="flex items-center justify-between py-2">
                <span className="font-medium">{f.name}</span>
                <span className="capitalize text-gray-500">{f.facilityType.replace(/_/g, ' ')} · {formatDate(f.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
