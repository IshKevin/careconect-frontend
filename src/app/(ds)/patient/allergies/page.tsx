'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { safeLocalStorage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Empty, Loading, Notice, PageHeader, Section, formatDate } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

type Severity = 'Mild' | 'Moderate' | 'Severe';

interface Allergy {
  allergyId: string;
  allergenName: string;
  reactionSeverity: Severity;
  notes?: string;
  recordedAt: string; // ISO date
}

const STORAGE_KEY = 'patient_allergies_dummy';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Earlier versions of this page wrote three made-up sample allergies into the browser. Drop them on load
// so a patient never sees allergies they did not enter.
const OLD_SAMPLE_ENTRIES = new Set([
  'Penicillin|Anaphylaxis reported in 2018.',
  'Peanuts|Hives & swelling; carries antihistamine.',
  'Pollen|Seasonal rhinitis, springtime.',
]);

const SEVERITY_CLASS: Record<Severity, string> = {
  Severe: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Moderate: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Mild: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';
const labelClass = 'text-sm font-medium text-slate-700';

export default function AllergiesPage() {
  const { user } = useAuthHooks();
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state (create)
  const [newAllergy, setNewAllergy] = useState<Pick<Allergy, 'allergenName' | 'reactionSeverity' | 'notes'>>({
    allergenName: '',
    reactionSeverity: 'Mild',
    notes: '',
  });

  // edit state: which id is being edited + inline draft
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Pick<Allergy, 'allergenName' | 'reactionSeverity' | 'notes'>>({
    allergenName: '',
    reactionSeverity: 'Mild',
    notes: '',
  });

  // simple search filter (optional UX nicety)
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allergies;
    return allergies.filter(
      (a) =>
        a.allergenName.toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q) ||
        a.reactionSeverity.toLowerCase().includes(q)
    );
  }, [allergies, query]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Allergy[] = JSON.parse(raw);
        setAllergies(parsed.filter((a) => !OLD_SAMPLE_ENTRIES.has(`${a.allergenName}|${a.notes ?? ''}`)));
      }
    } catch {
      setError('Failed to load allergies from local storage.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Persist to localStorage whenever allergies change
  useEffect(() => {
    if (!user) return;
    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(allergies));
    } catch {
      // ignore write errors
    }
  }, [allergies, user]);

  if (!user) return null;

  const addAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newAllergy.allergenName.trim()) {
      setError('Allergen name is required.');
      return;
    }
    const entry: Allergy = {
      allergyId: makeId(),
      allergenName: newAllergy.allergenName.trim(),
      reactionSeverity: newAllergy.reactionSeverity,
      notes: newAllergy.notes?.trim(),
      recordedAt: new Date().toISOString(),
    };
    setAllergies((prev) => [entry, ...prev]);
    setNewAllergy({ allergenName: '', reactionSeverity: 'Mild', notes: '' });
  };

  const startEdit = (row: Allergy) => {
    setEditingId(row.allergyId);
    setEditDraft({
      allergenName: row.allergenName,
      reactionSeverity: row.reactionSeverity,
      notes: row.notes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ allergenName: '', reactionSeverity: 'Mild', notes: '' });
  };

  const saveEdit = (id: string) => {
    if (!editDraft.allergenName.trim()) {
      setError('Allergen name is required.');
      return;
    }
    setAllergies((prev) =>
      prev.map((a) =>
        a.allergyId === id
          ? {
            ...a,
            allergenName: editDraft.allergenName.trim(),
            reactionSeverity: editDraft.reactionSeverity,
            notes: editDraft.notes?.trim(),
          }
          : a
      )
    );
    cancelEdit();
  };

  const deleteAllergy = (id: string) => {
    if (!confirm('Delete this allergy?')) return;
    setAllergies((prev) => prev.filter((a) => a.allergyId !== id));
  };

  const severityBadge = (sev: Severity) => (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', SEVERITY_CLASS[sev] ?? SEVERITY_CLASS.Mild)}>
      {sev}
    </span>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Allergies" description="Keep a list of what you are allergic to and how severe the reaction is." />

      <Notice tone="warning">
        This list is saved in this browser only and is not yet shared with your doctors. Always tell your doctor about serious allergies.
      </Notice>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create */}
        <Section title="Add an allergy" className="h-fit">
          <form onSubmit={addAllergy} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className={labelClass}>Allergen</span>
              <Input
                type="text"
                value={newAllergy.allergenName}
                onChange={(e) => setNewAllergy((s) => ({ ...s, allergenName: e.target.value }))}
                placeholder="e.g., Penicillin"
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Severity</span>
              <select
                value={newAllergy.reactionSeverity}
                onChange={(e) => setNewAllergy((s) => ({ ...s, reactionSeverity: e.target.value as Severity }))}
                className={selectClass}
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Notes</span>
              <Input
                type="text"
                value={newAllergy.notes}
                onChange={(e) => setNewAllergy((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Optional, e.g. the reaction you had"
              />
            </label>

            <Button type="submit" className="w-full">
              <Plus /> Add allergy
            </Button>
          </form>
        </Section>

        {/* List */}
        <div className="lg:col-span-2">
          <Section
            title="Your allergies"
            description={`${filtered.length} recorded`}
            flush
          >
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by allergen, note or severity…"
                  className="pl-9"
                  aria-label="Search allergies"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-5"><Loading /></div>
            ) : filtered.length === 0 ? (
              <Empty icon={ShieldAlert}>
                {allergies.length === 0 ? 'No allergies yet. Add one with the form.' : 'No allergies match your search.'}
              </Empty>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((a) => {
                  const isEditing = editingId === a.allergyId;
                  return (
                    <li key={a.allergyId} className="px-5 py-4">
                      {!isEditing ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-slate-900">{a.allergenName}</p>
                              {severityBadge(a.reactionSeverity)}
                            </div>
                            {a.notes && <p className="text-sm text-slate-700">{a.notes}</p>}
                            <p className="text-xs text-muted-foreground">Added {formatDate(a.recordedAt)}</p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                              <Pencil /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => deleteAllergy(a.allergyId)}
                            >
                              <Trash2 /> Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border bg-slate-50/70 p-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <label className="grid gap-1.5">
                              <span className={labelClass}>Allergen</span>
                              <Input
                                type="text"
                                value={editDraft.allergenName}
                                onChange={(e) => setEditDraft((s) => ({ ...s, allergenName: e.target.value }))}
                              />
                            </label>
                            <label className="grid gap-1.5">
                              <span className={labelClass}>Severity</span>
                              <select
                                value={editDraft.reactionSeverity}
                                onChange={(e) =>
                                  setEditDraft((s) => ({
                                    ...s,
                                    reactionSeverity: e.target.value as Severity,
                                  }))
                                }
                                className={selectClass}
                              >
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                              </select>
                            </label>
                            <label className="grid gap-1.5">
                              <span className={labelClass}>Notes</span>
                              <Input
                                type="text"
                                value={editDraft.notes}
                                onChange={(e) => setEditDraft((s) => ({ ...s, notes: e.target.value }))}
                              />
                            </label>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(a.allergyId)}>Save</Button>
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
      </div>
    </div>
  );
}
