'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Search, Stethoscope, Calendar, Filter, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Empty, Notice, PageHeader } from '@/components/dashboard/common';

interface Doctor {
  doctorId: string;
  specialty: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export default function SearchDoctorsPage() {
  const { user } = useAuthHooks();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/search/doctors');
        setDoctors(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch doctors';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const specialties = useMemo(() => {
    const s = new Set(doctors.map(d => d.specialty));
    return ['All', ...Array.from(s)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => {
      const name = `${d.profile?.firstName} ${d.profile?.lastName}`.toLowerCase();
      const matchSearch = name.includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpecialty = selectedSpecialty === 'All' || d.specialty === selectedSpecialty;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a doctor"
        description="Search by name or specialty, then book a consultation in person or by video."
      />

      {/* Search and filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Doctor name or specialty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Specialty</span>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading && doctors.length === 0 ? 'Loading doctors…' : (
            <>
              <span className="font-semibold text-slate-900">{filteredDoctors.length}</span> doctor{filteredDoctors.length === 1 ? '' : 's'} found
            </>
          )}
        </p>

        {loading && doctors.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.doctorId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-raised)]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-base font-semibold text-brand-700">
                    {doctor.profile?.firstName?.[0]}{doctor.profile?.lastName?.[0]}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">Dr. {doctor.profile?.firstName} {doctor.profile?.lastName}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Stethoscope className="size-3.5 shrink-0" />
                      <span className="truncate">{doctor.specialty}</span>
                    </p>
                  </div>
                </div>

                <Button asChild className="mt-auto w-full">
                  <Link href={`/patient/appointments?doctorId=${encodeURIComponent(doctor.doctorId)}#book`}>
                    <Calendar /> Book appointment
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Empty
              icon={UserRound}
              action={
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); }}>
                  Clear all filters
                </Button>
              }
            >
              {searchQuery
                ? <>No doctors match &quot;{searchQuery}&quot;{selectedSpecialty !== 'All' ? ` in ${selectedSpecialty}` : ''}.</>
                : 'No doctors found.'}
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}
