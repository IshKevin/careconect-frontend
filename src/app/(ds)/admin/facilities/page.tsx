'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Loading, Notice, Section, StatusBadge, errorText, formatRwf } from '@/components/dashboard/common';
import { useCreateFacility, useFacilities, useFacilitySettlement, useUpdateFacility } from '@/hooks/useDashboards';
import type { FacilityType, VerificationStatus } from '@/types/admin-ops';

const TYPES: FacilityType[] = ['hospital', 'clinic', 'private_practice', 'health_center'];
const STATUSES: VerificationStatus[] = ['pending', 'verified', 'rejected', 'suspended'];

const emptyForm = { name: '', facilityType: 'clinic' as FacilityType, registrationNumber: '', district: '', contactEmail: '', contactPhone: '' };

export default function AdminFacilitiesPage() {
  const { data: facilities, isLoading, error } = useFacilities();
  const create = useCreateFacility();
  const update = useUpdateFacility();
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<string | null>(null);
  const settlement = useFacilitySettlement(selected);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        facilityType: form.facilityType,
        registrationNumber: form.registrationNumber.trim(),
        district: form.district.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
      });
      setForm(emptyForm);
      toast.success('Facility registered (pending verification)');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const setStatus = async (facilityId: string, verificationStatus: VerificationStatus) => {
    try {
      await update.mutateAsync({ facilityId, verificationStatus });
      toast.success(`Facility ${verificationStatus}`);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Facilities</h1>
        <p className="text-sm text-gray-600">Verify a facility before assigning doctors. Settlement is calculated per facility.</p>
      </div>

      <Section title="Register a facility">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="f-name">Name</Label>
            <Input id="f-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-type">Type</Label>
            <select id="f-type" value={form.facilityType} onChange={(e) => setForm({ ...form, facilityType: e.target.value as FacilityType })} className="h-9 w-full rounded-md border bg-white px-3 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-reg">Registration number</Label>
            <Input id="f-reg" required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-district">District</Label>
            <Input id="f-district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-email">Contact email</Label>
            <Input id="f-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-phone">Contact phone</Label>
            <Input id="f-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Register facility'}</Button>
          </div>
        </form>
      </Section>

      <Section title="All facilities">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <Notice tone="error">{errorText(error, 'Facilities could not be loaded.')}</Notice>
        ) : !facilities || facilities.length === 0 ? (
          <Empty>No facilities yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reg. no.</TableHead>
                  <TableHead className="text-right">Doctors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Change status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((f) => (
                  <TableRow key={f.facilityId}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="capitalize">{f.facilityType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{f.registrationNumber}</TableCell>
                    <TableCell className="text-right">{f.doctorCount}</TableCell>
                    <TableCell><StatusBadge value={f.verificationStatus} /></TableCell>
                    <TableCell>
                      <select
                        aria-label={`Status for ${f.name}`}
                        value={f.verificationStatus}
                        disabled={update.isPending}
                        onChange={(e) => setStatus(f.facilityId, e.target.value as VerificationStatus)}
                        className="h-8 rounded-md border bg-white px-2 text-sm"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelected(f.facilityId)}>Settlement</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      {selected ? (
        <Section title="Settlement" action={<Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>}>
          {settlement.isLoading ? (
            <Loading />
          ) : settlement.error || !settlement.data ? (
            <Notice tone="error">{errorText(settlement.error, 'Settlement could not be loaded.')}</Notice>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{settlement.data.facility.name} · {settlement.data.invoicedCount} invoices</p>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div><p className="text-xs text-gray-500">Paid (gross)</p><p className="font-semibold">{formatRwf(settlement.data.paidGross)}</p></div>
                <div><p className="text-xs text-gray-500">Refunded</p><p className="font-semibold">{formatRwf(settlement.data.refunded)}</p></div>
                <div><p className="text-xs text-gray-500">Net settlable</p><p className="font-semibold">{formatRwf(settlement.data.netSettlable)}</p></div>
                <div><p className="text-xs text-gray-500">Awaiting payment</p><p className="font-semibold">{formatRwf(settlement.data.pendingInvoices)}</p></div>
              </div>
              {settlement.data.byDoctor.length > 0 ? (
                <ul className="divide-y text-sm">
                  {settlement.data.byDoctor.map((d) => (
                    <li key={d.doctorId} className="flex justify-between py-2">
                      <span className="font-mono text-xs text-gray-600">Doctor {d.doctorId.slice(0, 8)}</span>
                      <span>Net {formatRwf(d.net)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}
    </div>
  );
}
