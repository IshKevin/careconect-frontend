'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  FileText,
  HandCoins,
  HeartHandshake,
  MailWarning,
  RotateCcw,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/Button';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatCard, StatusBadge, errorText, formatDate, formatRwf } from '@/components/dashboard/common';
import { useAdminDashboard } from '@/hooks/useDashboards';

const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);

const ChartCard = ({
  title,
  description,
  data,
  color,
  valueFormatter,
}: {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  color: string;
  valueFormatter?: (v: number) => string;
}) => (
  <Section title={title} description={description}>
    {data.length === 0 ? (
      <Empty>No data in this period.</Empty>
    ) : (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} tickMargin={6} />
            <YAxis
              fontSize={11}
              allowDecimals={false}
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b' }}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(v) => [valueFormatter ? valueFormatter(Number(v)) : String(v), title]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-raised)', fontSize: 12 }}
              labelStyle={{ color: '#64748b' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </Section>
);

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();

  const header = (
    <PageHeader
      title="Operations dashboard"
      description="Live counts from the platform. Rwanda time."
      actions={
        <>
          <Button variant="outline" asChild><Link href="/admin/refunds">Refund queue</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/facilities">Facilities</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/reconciliation">Reconciliation</Link></Button>
        </>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Loading rows={4} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="space-y-6">
        {header}
        <Notice tone="error">
          {errorText(error, 'Metrics could not be loaded.')}{' '}
          <Button variant="link" className="h-auto p-0 align-baseline" onClick={() => refetch()}>Try again</Button>
        </Notice>
      </div>
    );
  }

  const invoiceTotal = sum(Object.fromEntries(Object.entries(data.invoices.byStatus).map(([k, v]) => [k, v.count])));
  const appointmentsToday = data.appointments.daily.find((d) => d.date === new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' }))?.count ?? 0;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={data.users.total} hint={`${data.users.newLast30Days} new in 30 days`} icon={Users} />
        <StatCard label="Unverified emails" value={data.users.unverifiedEmails} hint={`${data.users.suspended} suspended accounts`} icon={MailWarning} tone="amber" />
        <StatCard label="Appointments today" value={appointmentsToday} icon={CalendarCheck} tone="blue" />
        <StatCard label="Invoices" value={invoiceTotal} hint={`${data.invoices.byStatus.pending?.count ?? 0} unpaid`} icon={FileText} tone="violet" />
        <StatCard label="Refunds awaiting decision" value={data.refunds.pendingApprovals} icon={RotateCcw} tone="amber" />
        <StatCard label="Active sponsor links" value={data.sponsorship.byStatus.active ?? 0} hint={`${data.sponsorship.activeWithMedicalAccess} with medical access`} icon={HeartHandshake} tone="green" />
        <StatCard label="Facilities to review" value={data.facilities.byStatus.pending ?? 0} icon={Building2} tone="blue" />
        <StatCard
          label="Reconciliation mismatches"
          value={data.reconciliation?.mismatchCount ?? '—'}
          hint={data.reconciliation ? `Last run ${formatDate(data.reconciliation.lastRunAt)}` : 'No run yet'}
          icon={data.reconciliation?.mismatchCount ? AlertTriangle : HandCoins}
          tone={data.reconciliation?.mismatchCount ? 'red' : 'gray'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Appointments"
          description="Last 14 days"
          color="var(--chart-1)"
          data={data.appointments.daily.map((d) => ({ label: d.date.slice(5), value: d.count }))}
        />
        <ChartCard
          title="Paid revenue"
          description="Last 30 days, RWF"
          color="var(--chart-2)"
          valueFormatter={formatRwf}
          data={data.invoices.revenueDaily.map((d) => ({ label: d.date.slice(5), value: Number(d.amount) }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section flush title="Users by type">
          <DataTable>
            <thead>
              <tr>
                <th>Type</th>
                <th className="text-right">Users</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.users.byType).map(([type, n]) => (
                <tr key={type}>
                  <td className="capitalize text-slate-700">{type.replace(/_/g, ' ')}</td>
                  <td className="text-right font-medium tabular-nums text-slate-900">{n}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Section>

        <Section flush title="Money" description="Invoices, payments and refunds by status" className="lg:col-span-2">
          <DataTable>
            <thead>
              <tr>
                <th>Area</th>
                <th>Status</th>
                <th className="text-right">Count</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.invoices.byStatus).map(([status, v]) => (
                <tr key={`inv-${status}`}>
                  <td className="text-slate-700">Invoices</td>
                  <td><StatusBadge value={status} /></td>
                  <td className="text-right tabular-nums">{v.count}</td>
                  <td className="whitespace-nowrap text-right tabular-nums">{formatRwf(v.amount)}</td>
                </tr>
              ))}
              {Object.entries(data.payments.byStatus).map(([status, v]) => (
                <tr key={`pay-${status}`}>
                  <td className="text-slate-700">Payments</td>
                  <td><StatusBadge value={status} /></td>
                  <td className="text-right tabular-nums">{v.count}</td>
                  <td className="whitespace-nowrap text-right tabular-nums">{formatRwf(v.amount)}</td>
                </tr>
              ))}
              {Object.entries(data.refunds.byStatus).map(([status, v]) => (
                <tr key={`ref-${status}`}>
                  <td className="text-slate-700">Refunds</td>
                  <td><StatusBadge value={status} /></td>
                  <td className="text-right tabular-nums">{v.count}</td>
                  <td className="whitespace-nowrap text-right tabular-nums">{formatRwf(v.amount)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Section>
      </div>

      <Section
        flush
        title="Facilities waiting for verification"
        action={<Button variant="link" className="h-auto px-0" asChild><Link href="/admin/facilities">Open facilities</Link></Button>}
      >
        {data.facilities.toReview.length === 0 ? (
          <Empty icon={Building2}>Nothing waiting for review.</Empty>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {data.facilities.toReview.map((f) => (
              <li key={f.facilityId} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="font-medium text-slate-900">{f.name}</span>
                <span className="capitalize text-muted-foreground">{f.facilityType.replace(/_/g, ' ')} · {formatDate(f.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
