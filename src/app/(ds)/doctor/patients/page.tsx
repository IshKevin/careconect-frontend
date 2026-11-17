'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, formatDate } from '@/components/dashboard/common';

interface Patient {
  userId: string;
  email: string;
  phoneNumber?: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
  appointmentCount?: number;
  lastVisit?: string | null;
}

export default function PatientsPage() {
  const { user } = useAuthHooks();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await api.get('/provider/patients');
        setPatients(response.data.data);
      } catch (err: unknown) {
        let msg = 'Failed to fetch patients';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (!user) return null;

  const list = patients as Patient[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Everyone who has booked an appointment with you."
        actions={
          <Button variant="outline" asChild>
            <Link href="/doctor/search"><Search /> Search patients</Link>
          </Button>
        }
      />

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Section title="Your patients" description={loading ? undefined : `${list.length} patient${list.length === 1 ? '' : 's'}`} flush>
        {loading ? (
          <div className="px-5"><Loading rows={4} label="Loading patients…" /></div>
        ) : error ? null : list.length === 0 ? (
          <Empty icon={Users}>No patients yet. Patients appear here after they book an appointment with you.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th className="text-right">Visits</th>
                <th>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {list.map((patient) => (
                <tr key={patient.userId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {(patient.profile?.firstName?.[0] ?? '') + (patient.profile?.lastName?.[0] ?? '') || '?'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {patient.profile?.firstName} {patient.profile?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{patient.phoneNumber || 'N/A'}</td>
                  <td className="text-right tabular-nums">{patient.appointmentCount ?? '—'}</td>
                  <td className="whitespace-nowrap">{formatDate(patient.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
