'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatCard, StatusBadge, errorText, formatRwf } from '@/components/dashboard/common';
import { useCreateFacility, useFacilities, useFacilitySettlement, useUpdateFacility } from '@/hooks/useDashboards';
import type { FacilityType, VerificationStatus } from '@/types/admin-ops';

const TYPES: FacilityType[] = ['hospital', 'clinic', 'private_practice', 'health_center'];
const STATUSES: VerificationStatus[] = ['pending', 'verified', 'rejected', 'suspended'];

// Native select styled like the ui Input.
const NATIVE_SELECT =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm capitalize shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50';
const LABEL = 'text-sm font-medium text-slate-700';

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
      <PageHeader
        title="Facilities"
        description="Verify a facility before assigning doctors. Settlement is calculated per facility."
      />

      <Section title="Register a facility" description="New facilities start as pending until verified.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="f-name" className={LABEL}>Name</Label>
            <Input id="f-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-type" className={LABEL}>Type</Label>
            <select id="f-type" value={form.facilityType} onChange={(e) => setForm({ ...form, facilityType: e.target.value as FacilityType })} className={NATIVE_SELECT}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-reg" className={LABEL}>Registration number</Label>
            <Input id="f-reg" required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-district" className={LABEL}>District</Label>
            <Input id="f-district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-email" className={LABEL}>Contact email</Label>
            <Input id="f-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-phone" className={LABEL}>Contact phone</Label>
            <Input id="f-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <div className="flex justify-end sm:col-span-2 lg:col-span-3">
            <Button className="w-full sm:w-auto" type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Register facility'}</Button>
          </div>
        </form>
      </Section>

      <Section flush title="All facilities" description={facilities ? `${facilities.length} registered` : undefined}>
        {isLoading ? (
          <div className="px-5 py-3"><Loading /></div>
        ) : error ? (
          <div className="p-5"><Notice tone="error">{errorText(error, 'Facilities could not be loaded.')}</Notice></div>
        ) : !facilities || facilities.length === 0 ? (
          <Empty icon={Building2}>No facilities yet.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Reg. no.</th>
                <th className="text-right">Doctors</th>
                <th>Status</th>
                <th>Change status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f.facilityId} className={selected === f.facilityId ? 'bg-brand-50/60' : undefined}>
                  <td className="whitespace-nowrap font-medium text-slate-900">{f.name}</td>
                  <td className="whitespace-nowrap capitalize text-slate-700">{f.facilityType.replace(/_/g, ' ')}</td>
                  <td className="whitespace-nowrap text-slate-700">{f.registrationNumber}</td>
                  <td className="text-right tabular-nums text-slate-700">{f.doctorCount}</td>
                  <td className="whitespace-nowrap"><StatusBadge value={f.verificationStatus} /></td>
                  <td>
                    <select
                      aria-label={`Status for ${f.name}`}
                      value={f.verificationStatus}
                      disabled={update.isPending}
                      onChange={(e) => setStatus(f.facilityId, e.target.value as VerificationStatus)}
                      className={cn(NATIVE_SELECT, "h-8 min-w-34")}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(f.facilityId);
                        setTimeout(() => document.getElementById('facility-settlement')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                      }}
                    >
                      Settlement
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>

      {selected ? (
        <div id="facility-settlement" className="scroll-mt-20">
        <Section
          title="Settlement"
          description={settlement.data ? `${settlement.data.facility.name} · ${settlement.data.invoicedCount} invoices` : undefined}
          action={<Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X /> Close</Button>}
        >
          {settlement.isLoading ? (
            <Loading />
          ) : settlement.error || !settlement.data ? (
            <Notice tone="error">{errorText(settlement.error, 'Settlement could not be loaded.')}</Notice>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Paid (gross)" value={formatRwf(settlement.data.paidGross)} tone="green" />
                <StatCard label="Refunded" value={formatRwf(settlement.data.refunded)} tone="violet" />
                <StatCard label="Net settlable" value={formatRwf(settlement.data.netSettlable)} tone="blue" />
                <StatCard label="Awaiting payment" value={formatRwf(settlement.data.pendingInvoices)} tone="amber" />
              </div>
              {settlement.data.byDoctor.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-700">By doctor</h4>
                  <ul className="divide-y divide-border rounded-xl border border-border text-sm">
                    {settlement.data.byDoctor.map((d) => (
                      <li key={d.doctorId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className="font-mono text-xs text-muted-foreground">Doctor {d.doctorId.slice(0, 8)}</span>
                        <span className="tabular-nums text-slate-900">Net {formatRwf(d.net)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Section>
        </div>
      ) : null}
    </div>
  );
}
