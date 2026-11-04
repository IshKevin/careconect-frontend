'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Search, Users, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';

interface Patient {
  userId: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

const BRAND = '#C4E1E1';

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
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-3 ring-8 ring-rose-50/50">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Please log in as a doctor to search patients.</p>
        </div>
      </div>
    );
  }

  const filtered = patients.filter(p => {
    const name = `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase();
    return name.includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="p-6" style={{ '--brand': BRAND } as React.CSSProperties}>
      <div className="mx-auto mb-6 h-1 max-w-5xl rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)' }} aria-hidden />

      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Patient Directory</h1>
          <p className="mt-1 text-gray-600">Search for patients in your network.</p>
        </header>

        <section className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-12 w-full rounded-2xl border-black/10 pl-10 shadow-sm focus-visible:ring-[var(--brand)]"
          />
        </section>

        {loading && <p className="text-center text-gray-500 py-10 italic">Loading patients...</p>}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!loading && filtered.map((patient) => (
            <Card key={patient.userId} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--brand)]/30 text-gray-800 font-bold ring-1 ring-[var(--brand)]/50">
                  {patient.profile?.firstName?.[0]}{patient.profile?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.profile?.firstName} {patient.profile?.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{patient.email}</p>
                </div>
                <div className="text-emerald-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <Users className="h-10 w-10 text-gray-200" />
            <p className="text-gray-500">No patients found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}