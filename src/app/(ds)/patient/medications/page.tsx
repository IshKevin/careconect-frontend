'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Pill, Plus, Search, Trash2 } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { safeLocalStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Empty, Loading, Notice, PageHeader, Section, formatDate } from '@/components/dashboard/common';

type Frequency =
  | 'Once daily'
  | 'Twice daily'
  | 'Three times daily'
  | 'Weekly'
  | 'As needed';

interface Medication {
  medicationId: string;
  medicationName: string;
  dosage: string;         // e.g., "500 mg"
  frequency: Frequency;   // e.g., "Twice daily"
  startDate?: string;     // ISO date
  notes?: string;
}

const STORAGE_KEY = 'patient_medications_dummy';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Earlier versions of this page wrote three made-up sample medications into the browser. Drop them on load
// so a patient never sees medications they did not enter.
const OLD_SAMPLE_ENTRIES = new Set([
  'Metformin|500 mg|Take with meals',
  'Atorvastatin|20 mg|',
  'Albuterol Inhaler|2 puffs|For wheezing or shortness of breath',
]);

const FREQUENCIES: Frequency[] = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'];

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';
const labelClass = 'text-sm font-medium text-slate-700';

export default function MedicationsPage() {
  const { user } = useAuthHooks();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [draft, setDraft] = useState<Pick<Medication, 'medicationName' | 'dosage' | 'frequency' | 'startDate' | 'notes'>>({
    medicationName: '',
    dosage: '',
    frequency: 'Once daily',
    startDate: '',
    notes: '',
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Pick<Medication, 'medicationName' | 'dosage' | 'frequency' | 'startDate' | 'notes'>>({
    medicationName: '',
    dosage: '',
    frequency: 'Once daily',
    startDate: '',
    notes: '',
  });

  // Simple search
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return medications;
    return medications.filter((m) =>
      [m.medicationName, m.dosage, m.frequency, m.notes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [medications, query]);

  // Load from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Medication[] = JSON.parse(raw);
        setMedications(parsed.filter((m) => !OLD_SAMPLE_ENTRIES.has(`${m.medicationName}|${m.dosage}|${m.notes ?? ''}`)));
      }
    } catch {
      setError('Failed to load medications from local storage.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Persist on change
  useEffect(() => {
    if (!user) return;
    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
    } catch {
      // ignore write errors
    }
  }, [medications, user]);

  if (!user) return null;

  // CRUD handlers
  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.medicationName.trim()) return setError('Medication name is required.');
    if (!draft.dosage.trim()) return setError('Dosage is required.');

    const entry: Medication = {
      medicationId: makeId(),
      medicationName: draft.medicationName.trim(),
      dosage: draft.dosage.trim(),
      frequency: draft.frequency,
      startDate: draft.startDate || undefined,
      notes: draft.notes?.trim() || undefined,
    };

    setMedications((prev) => [entry, ...prev]);
    setDraft({ medicationName: '', dosage: '', frequency: 'Once daily', startDate: '', notes: '' });
  };

  const startEdit = (m: Medication) => {
    setEditingId(m.medicationId);
    setEditDraft({
      medicationName: m.medicationName,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: m.startDate ? m.startDate.slice(0, 10) : '',
      notes: m.notes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ medicationName: '', dosage: '', frequency: 'Once daily', startDate: '', notes: '' });
  };

  const saveEdit = (id: string) => {
    if (!editDraft.medicationName.trim()) return setError('Medication name is required.');
    if (!editDraft.dosage.trim()) return setError('Dosage is required.');

    setMedications((prev) =>
      prev.map((m) =>
        m.medicationId === id
          ? {
            ...m,
            medicationName: editDraft.medicationName.trim(),
            dosage: editDraft.dosage.trim(),
            frequency: editDraft.frequency,
            startDate: editDraft.startDate ? new Date(editDraft.startDate).toISOString() : undefined,
            notes: editDraft.notes?.trim() || undefined,
          }
          : m
      )
    );
    cancelEdit();
  };

  const deleteMedication = (id: string) => {
    if (!confirm('Delete this medication?')) return;
    setMedications((prev) => prev.filter((m) => m.medicationId !== id));
  };

  const frequencyOptions = FREQUENCIES.map((f) => <option key={f}>{f}</option>);

  return (
    <div className="space-y-6">
      <PageHeader title="Medications" description="Track the medicines you take, the dose and how often." />

      <Notice tone="warning">
        This list is saved in this browser only and is not yet shared with your doctors. Bring it to your appointments.
      </Notice>

      {error && <Notice tone="error">{error}</Notice>}

      {/* Create */}
      <Section title="Add a medication">
        <form onSubmit={addMedication} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className={labelClass}>Name</span>
            <Input
              type="text"
              value={draft.medicationName}
              onChange={(e) => setDraft((s) => ({ ...s, medicationName: e.target.value }))}
              placeholder="e.g., Metformin"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Dosage</span>
            <Input
              type="text"
              value={draft.dosage}
              onChange={(e) => setDraft((s) => ({ ...s, dosage: e.target.value }))}
              placeholder="e.g., 500 mg"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Frequency</span>
            <select
              value={draft.frequency}
              onChange={(e) => setDraft((s) => ({ ...s, frequency: e.target.value as Frequency }))}
              className={selectClass}
            >
              {frequencyOptions}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Start date</span>
            <Input
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraft((s) => ({ ...s, startDate: e.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className={labelClass}>Notes</span>
            <Input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Optional, e.g. take with meals"
            />
          </label>
          <div className="flex justify-end sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus /> Add medication
            </Button>
          </div>
        </form>
      </Section>

      {/* List */}
      <Section title="Your medications" description={`${filtered.length} recorded`} flush>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, dosage, frequency or note…"
              className="pl-9"
              aria-label="Search medications"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-5"><Loading /></div>
        ) : filtered.length === 0 ? (
          <Empty icon={Pill}>
            {medications.length === 0 ? 'No medications yet. Add one with the form above.' : 'No medications match your search.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const isEditing = editingId === m.medicationId;
              return (
                <li key={m.medicationId} className="px-5 py-4">
                  {!isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                          <Pill className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{m.medicationName}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{m.dosage}</span>
                          </div>
                          <p className="text-sm text-slate-700">
                            {m.frequency}
                            {m.notes ? <span className="text-muted-foreground"> · {m.notes}</span> : null}
                          </p>
                          <p className="text-xs text-muted-foreground">Started {formatDate(m.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                          <Pencil /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => deleteMedication(m.medicationId)}
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-slate-50/70 p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="grid gap-1.5 sm:col-span-2">
                          <span className={labelClass}>Name</span>
                          <Input
                            type="text"
                            value={editDraft.medicationName}
                            onChange={(e) => setEditDraft((s) => ({ ...s, medicationName: e.target.value }))}
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className={labelClass}>Dosage</span>
                          <Input
                            type="text"
                            value={editDraft.dosage}
                            onChange={(e) => setEditDraft((s) => ({ ...s, dosage: e.target.value }))}
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className={labelClass}>Frequency</span>
                          <select
                            value={editDraft.frequency}
                            onChange={(e) =>
                              setEditDraft((s) => ({ ...s, frequency: e.target.value as Frequency }))
                            }
                            className={selectClass}
                          >
                            {frequencyOptions}
                          </select>
                        </label>
                        <label className="grid gap-1.5">
                          <span className={labelClass}>Start date</span>
                          <Input
                            type="date"
                            value={editDraft.startDate}
                            onChange={(e) => setEditDraft((s) => ({ ...s, startDate: e.target.value }))}
                          />
                        </label>
                        <label className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
                          <span className={labelClass}>Notes</span>
                          <Input
                            type="text"
                            value={editDraft.notes}
                            onChange={(e) => setEditDraft((s) => ({ ...s, notes: e.target.value }))}
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(m.medicationId)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
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
