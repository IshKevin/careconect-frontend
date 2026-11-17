'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Empty, Loading, Notice, PageHeader, Section, errorText, formatDate } from '@/components/dashboard/common';
import { useAddAllergy, useAllergies, useDeleteAllergy, useUpdateAllergy } from '@/hooks/usePatient';
import type { Allergy, AllergenType, CreateAllergyRequest, Severity } from '@/types/patient';
import { cn } from '@/lib/utils';

// Allergies are stored on the server (GET/POST/PUT/DELETE /patient/allergies), so the patient's doctor sees them too.

const TYPES: { value: AllergenType; label: string }[] = [
  { value: 'drug', label: 'Medicine' },
  { value: 'food', label: 'Food' },
  { value: 'environmental', label: 'Environment (pollen, dust…)' },
  { value: 'other', label: 'Other' },
];
const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe', 'critical'];

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: 'bg-rose-100 text-rose-800 ring-rose-600/30',
  severe: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  moderate: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  mild: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';
const labelClass = 'text-sm font-medium text-slate-700';

type Draft = { allergenName: string; allergenType: AllergenType; reactionSeverity: Severity; symptoms: string; treatmentNotes: string };
const EMPTY: Draft = { allergenName: '', allergenType: 'drug', reactionSeverity: 'mild', symptoms: '', treatmentNotes: '' };

const toDraft = (a: Allergy): Draft => ({
  allergenName: a.allergenName,
  allergenType: a.allergenType,
  reactionSeverity: a.reactionSeverity ?? 'mild',
  symptoms: a.symptoms ?? '',
  treatmentNotes: a.treatmentNotes ?? '',
});

const toRequest = (d: Draft): CreateAllergyRequest => ({
  allergenName: d.allergenName.trim(),
  allergenType: d.allergenType,
  reactionSeverity: d.reactionSeverity,
  symptoms: d.symptoms.trim(),
  treatmentNotes: d.treatmentNotes.trim(),
});

function AllergyFields({ draft, onChange, idPrefix }: { draft: Draft; onChange: (d: Draft) => void; idPrefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>Allergic to *</label>
        <Input id={`${idPrefix}-name`} required maxLength={255} placeholder="e.g. Penicillin" value={draft.allergenName} onChange={(e) => onChange({ ...draft, allergenName: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-type`} className={labelClass}>Type</label>
        <select id={`${idPrefix}-type`} className={selectClass} value={draft.allergenType} onChange={(e) => onChange({ ...draft, allergenType: e.target.value as AllergenType })}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-severity`} className={labelClass}>Severity</label>
        <select id={`${idPrefix}-severity`} className={cn(selectClass, 'capitalize')} value={draft.reactionSeverity} onChange={(e) => onChange({ ...draft, reactionSeverity: e.target.value as Severity })}>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-symptoms`} className={labelClass}>Reaction</label>
        <Input id={`${idPrefix}-symptoms`} placeholder="e.g. Rash, swelling" value={draft.symptoms} onChange={(e) => onChange({ ...draft, symptoms: e.target.value })} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor={`${idPrefix}-notes`} className={labelClass}>Notes</label>
        <Textarea id={`${idPrefix}-notes`} rows={2} placeholder="Treatment or anything your doctor should know (optional)" value={draft.treatmentNotes} onChange={(e) => onChange({ ...draft, treatmentNotes: e.target.value })} />
      </div>
    </div>
  );
}

export default function AllergiesPage() {
  const { data: allergies = [], isLoading, error, refetch } = useAllergies();
  const add = useAddAllergy();
  const update = useUpdateAllergy();
  const remove = useDeleteAllergy();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allergies;
    return allergies.filter((a) =>
      [a.allergenName, a.symptoms, a.treatmentNotes, a.reactionSeverity, a.allergenType].some((v) => (v ?? '').toLowerCase().includes(q)),
    );
  }, [allergies, query]);

  const severeCount = allergies.filter((a) => a.reactionSeverity === 'severe' || a.reactionSeverity === 'critical').length;

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.allergenName.trim()) return;
    add.mutate(toRequest(draft), {
      onSuccess: () => {
        setDraft(EMPTY);
        toast.success('Allergy added to your health record');
      },
      onError: (err) => toast.error(errorText(err, 'The allergy could not be saved.')),
    });
  };

  const onSave = (id: string) => {
    if (!editDraft.allergenName.trim()) return;
    update.mutate(
      { id, data: toRequest(editDraft) },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success('Allergy updated');
        },
        onError: (err) => toast.error(errorText(err, 'The change could not be saved.')),
      },
    );
  };

  const onDelete = (a: Allergy) => {
    if (!window.confirm(`Remove "${a.allergenName}" from your allergies?`)) return;
    remove.mutate(a.allergyId, {
      onSuccess: () => toast.success('Allergy removed'),
      onError: (err) => toast.error(errorText(err, 'The allergy could not be removed.')),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allergies"
        description="Keep your allergies up to date. Your doctor sees this list before every consultation."
      />

      <Section title="Add an allergy" description="Medicines, foods or anything else you react to.">
        <form onSubmit={onAdd} className="space-y-4">
          <AllergyFields draft={draft} onChange={setDraft} idPrefix="new" />
          <div className="flex justify-end">
            <Button type="submit" disabled={add.isPending || !draft.allergenName.trim()}>
              <Plus /> {add.isPending ? 'Saving…' : 'Add allergy'}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        flush
        title="Your allergies"
        description={isLoading ? undefined : `${allergies.length} recorded${severeCount ? ` · ${severeCount} severe` : ''}`}
        action={
          allergies.length > 0 ? (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Search allergies" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
          ) : null
        }
      >
        {isLoading ? (
          <div className="p-5"><Loading /></div>
        ) : error ? (
          <div className="p-5">
            <Notice tone="error">
              {errorText(error, 'Your allergies could not be loaded.')}{' '}
              <button className="font-medium underline" onClick={() => refetch()}>Try again</button>
            </Notice>
          </div>
        ) : allergies.length === 0 ? (
          <Empty icon={ShieldAlert}>No allergies recorded. If you have none, you can leave this empty.</Empty>
        ) : filtered.length === 0 ? (
          <Empty icon={Search}>No allergies match “{query}”.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((a) => {
              const editing = editingId === a.allergyId;
              const severity = a.reactionSeverity ?? 'mild';
              return (
                <li key={a.allergyId} className="px-5 py-4">
                  {editing ? (
                    <div className="space-y-4">
                      <AllergyFields draft={editDraft} onChange={setEditDraft} idPrefix={`edit-${a.allergyId}`} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button onClick={() => onSave(a.allergyId)} disabled={update.isPending || !editDraft.allergenName.trim()}>
                          {update.isPending ? 'Saving…' : 'Save changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{a.allergenName}</p>
                          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset', SEVERITY_CLASS[severity])}>{severity}</span>
                          <span className="text-xs text-muted-foreground">{TYPES.find((t) => t.value === a.allergenType)?.label ?? a.allergenType}</span>
                          {a.verifiedByDoctor ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700"><BadgeCheck className="size-3.5" /> Confirmed by your doctor</span>
                          ) : null}
                        </div>
                        {a.symptoms ? <p className="text-sm text-slate-600">Reaction: {a.symptoms}</p> : null}
                        {a.treatmentNotes ? <p className="text-sm text-slate-600">{a.treatmentNotes}</p> : null}
                        {a.createdAt ? <p className="text-xs text-muted-foreground">Added {formatDate(a.createdAt)}</p> : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(a.allergyId); setEditDraft(toDraft(a)); }}>
                          <Pencil /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(a)} disabled={remove.isPending}>
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
