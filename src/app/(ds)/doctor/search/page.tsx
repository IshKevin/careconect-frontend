'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Empty, Loading, Notice, PageHeader } from '@/components/dashboard/common';

interface Patient {
  userId: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export default function SearchPatientsPage() {
  const { user } = useAuthHooks();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/provider/patients');
        const data = response.data?.data || response.data || [];
        setPatients(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('Fetch patients error:', err);
        setError('Failed to fetch patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (!user || user.userType !== 'doctor') {
    return <Notice tone="warning">Please log in as a doctor to search patients.</Notice>;
  }

  const filtered = patients.filter(p => {
    const name = `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase();
    return name.includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Patient directory" description="Find a patient in your care by name or email." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search patients"
          className="h-11 rounded-xl pl-10 shadow-[var(--shadow-card)]"
        />
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {loading ? (
        <Loading rows={4} label="Loading patients…" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <Empty
            icon={Users}
            action={
              query ? (
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
              ) : undefined
            }
          >
            {query ? 'No patients found matching your search.' : 'No patients yet. Patients appear here after they book with you.'}
          </Empty>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {patients.length} patient{patients.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((patient) => (
              <div
                key={patient.userId}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {(patient.profile?.firstName?.[0] ?? '') + (patient.profile?.lastName?.[0] ?? '') || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {patient.profile?.firstName} {patient.profile?.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
