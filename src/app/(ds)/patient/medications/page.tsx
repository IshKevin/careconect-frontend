'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Pill, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Empty, Loading, Notice, PageHeader, Section, StatCard, errorText, formatDate } from '@/components/dashboard/common';
import { useAddMedication, useDeleteMedication, useMedications, useUpdateMedication } from '@/hooks/usePatient';
import type { CreateMedicationRequest, Medication, MedicationRoute } from '@/types/patient';
import { cn } from '@/lib/utils';

// Medications are stored on the server (GET/POST/PUT/DELETE /patient/medications), so the patient's doctor sees them too.

const ROUTES: { value: MedicationRoute; label: string }[] = [
  { value: 'oral', label: 'By mouth' },
  { value: 'injection', label: 'Injection' },
  { value: 'topical', label: 'On the skin' },
  { value: 'inhalation', label: 'Inhaled' },
  { value: 'other', label: 'Other' },
];

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';
const labelClass = 'text-sm font-medium text-slate-700';

type Draft = { medicationName: string; dosage: string; frequency: string; route: MedicationRoute; startDate: string; endDate: string; isActive: boolean };
const EMPTY: Draft = { medicationName: '', dosage: '', frequency: '', route: 'oral', startDate: '', endDate: '', isActive: true };

const day = (v?: string | null) => (v ? v.slice(0, 10) : '');

const toDraft = (m: Medication): Draft => ({
  medicationName: m.medicationName,
  dosage: m.dosage ?? '',
  frequency: m.frequency ?? '',
  route: m.route ?? 'oral',
  startDate: day(m.startDate),
  endDate: day(m.endDate),
  isActive: m.isActive,
});

// New entries leave empty optional fields out; edits send '' so the server clears them.
const toRequest = (d: Draft, forEdit: boolean): CreateMedicationRequest => {
  const opt = (v: string) => (v.trim() ? v.trim() : forEdit ? '' : undefined);
  return {
    medicationName: d.medicationName.trim(),
    dosage: opt(d.dosage),
    frequency: opt(d.frequency),
    route: d.route,
    startDate: opt(d.startDate),
    endDate: opt(d.endDate),
    isActive: d.isActive,
  };
};

function MedicationFields({ draft, onChange, idPrefix }: { draft: Draft; onChange: (d: Draft) => void; idPrefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>Medicine *</label>
        <Input id={`${idPrefix}-name`} required maxLength={255} placeholder="e.g. Amoxicillin" value={draft.medicationName} onChange={(e) => onChange({ ...draft, medicationName: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-dosage`} className={labelClass}>Dose</label>
        <Input id={`${idPrefix}-dosage`} maxLength={100} placeholder="e.g. 500 mg" value={draft.dosage} onChange={(e) => onChange({ ...draft, dosage: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-frequency`} className={labelClass}>How often</label>
        <Input id={`${idPrefix}-frequency`} maxLength={100} placeholder="e.g. Twice a day" value={draft.frequency} onChange={(e) => onChange({ ...draft, frequency: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-route`} className={labelClass}>Taken</label>
        <select id={`${idPrefix}-route`} className={selectClass} value={draft.route} onChange={(e) => onChange({ ...draft, route: e.target.value as MedicationRoute })}>
          {ROUTES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-start`} className={labelClass}>Started</label>
        <Input id={`${idPrefix}-start`} type="date" value={draft.startDate} onChange={(e) => onChange({ ...draft, startDate: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-end`} className={labelClass}>Ends</label>
        <Input id={`${idPrefix}-end`} type="date" min={draft.startDate || undefined} value={draft.endDate} onChange={(e) => onChange({ ...draft, endDate: e.target.value })} />
      </div>
      <label className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Switch checked={draft.isActive} onCheckedChange={(v) => onChange({ ...draft, isActive: v })} aria-label="Currently taking" />
        <span className="text-sm text-slate-700">I am currently taking this medicine</span>
      </label>
    </div>
  );
}

export default function MedicationsPage() {
  const { data: medications = [], isLoading, error, refetch } = useMedications();
  const add = useAddMedication();
  const update = useUpdateMedication();
  const remove = useDeleteMedication();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [query, setQuery] = useState('');
  const [show, setShow] = useState<'active' | 'all'>('active');

  const active = medications.filter((m) => m.isActive);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return medications
      .filter((m) => show === 'all' || m.isActive)
      .filter((m) => !q || [m.medicationName, m.dosage, m.frequency].some((v) => (v ?? '').toLowerCase().includes(q)));
  }, [medications, query, show]);

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.medicationName.trim()) return;
    add.mutate(toRequest(draft, false), {
      onSuccess: () => {
        setDraft(EMPTY);
        toast.success('Medicine added to your health record');
      },
      onError: (err) => toast.error(errorText(err, 'The medicine could not be saved.')),
    });
  };

  const onSave = (id: string) => {
    if (!editDraft.medicationName.trim()) return;
    update.mutate(
      { id, data: toRequest(editDraft, true) },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success('Medicine updated');
        },
        onError: (err) => toast.error(errorText(err, 'The change could not be saved.')),
      },
    );
  };

  const toggleActive = (m: Medication) =>
    update.mutate(
      { id: m.medicationId, data: { isActive: !m.isActive } },
      {
        onSuccess: () => toast.success(m.isActive ? 'Marked as stopped' : 'Marked as current'),
        onError: (err) => toast.error(errorText(err, 'The change could not be saved.')),
      },
    );

  const onDelete = (m: Medication) => {
    if (!window.confirm(`Remove "${m.medicationName}" from your medications?`)) return;
    remove.mutate(m.medicationId, {
      onSuccess: () => toast.success('Medicine removed'),
      onError: (err) => toast.error(errorText(err, 'The medicine could not be removed.')),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Medications" description="The medicines you take. Your doctor sees this list before every consultation." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Currently taking" value={isLoading ? '—' : active.length} icon={Pill} tone="green" />
        <StatCard label="Stopped" value={isLoading ? '—' : medications.length - active.length} icon={Pill} tone="gray" />
        <StatCard label="On your record" value={isLoading ? '—' : medications.length} icon={Pill} tone="blue" />
      </div>

      <Section title="Add a medicine" description="Include medicines from other doctors and anything you buy at the pharmacy.">
        <form onSubmit={onAdd} className="space-y-4">
          <MedicationFields draft={draft} onChange={setDraft} idPrefix="new" />
          <div className="flex justify-end">
            <Button type="submit" disabled={add.isPending || !draft.medicationName.trim()}>
              <Plus /> {add.isPending ? 'Saving…' : 'Add medicine'}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        flush
        title="Your medicines"
        action={
          medications.length > 0 ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="inline-flex rounded-lg border border-border bg-slate-50 p-0.5 text-sm">
                {(['active', 'all'] as const).map((v) => (
                  <button key={v} onClick={() => setShow(v)} className={cn('rounded-md px-3 py-1.5 font-medium transition', show === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700')}>
                    {v === 'active' ? 'Current' : 'All'}
                  </button>
                ))}
              </div>
              <div className="relative sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input aria-label="Search medicines" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          ) : null
        }
      >
        {isLoading ? (
          <div className="p-5"><Loading /></div>
        ) : error ? (
          <div className="p-5">
            <Notice tone="error">
              {errorText(error, 'Your medicines could not be loaded.')}{' '}
              <button className="font-medium underline" onClick={() => refetch()}>Try again</button>
            </Notice>
          </div>
        ) : medications.length === 0 ? (
          <Empty icon={Pill}>No medicines recorded yet.</Empty>
        ) : filtered.length === 0 ? (
          <Empty icon={Search}>{query ? `No medicines match “${query}”.` : 'No current medicines. Choose “All” to see stopped ones.'}</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const editing = editingId === m.medicationId;
              const details = [m.dosage, m.frequency, ROUTES.find((r) => r.value === m.route)?.label].filter(Boolean).join(' · ');
              return (
                <li key={m.medicationId} className={cn('px-5 py-4', !m.isActive && !editing && 'bg-slate-50/60')}>
                  {editing ? (
                    <div className="space-y-4">
                      <MedicationFields draft={editDraft} onChange={setEditDraft} idPrefix={`edit-${m.medicationId}`} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button onClick={() => onSave(m.medicationId)} disabled={update.isPending || !editDraft.medicationName.trim()}>
                          {update.isPending ? 'Saving…' : 'Save changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', m.isActive ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-400')}>
                          <Pill className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn('font-medium', m.isActive ? 'text-slate-900' : 'text-slate-500')}>{m.medicationName}</p>
                            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', m.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-500 ring-slate-500/20')}>
                              {m.isActive ? 'Current' : 'Stopped'}
                            </span>
                          </div>
                          {details ? <p className="text-sm text-slate-600">{details}</p> : null}
                          {m.startDate || m.endDate ? (
                            <p className="text-xs text-muted-foreground">
                              {m.startDate ? `Since ${formatDate(m.startDate)}` : ''}
                              {m.startDate && m.endDate ? ' · ' : ''}
                              {m.endDate ? `Until ${formatDate(m.endDate)}` : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => toggleActive(m)} disabled={update.isPending}>
                          {m.isActive ? 'Mark stopped' : 'Mark current'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(m.medicationId); setEditDraft(toDraft(m)); }}>
                          <Pencil /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(m)} disabled={remove.isPending}>
                          <Trash2 /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
