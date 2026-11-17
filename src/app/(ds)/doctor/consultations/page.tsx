'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, FileText, NotebookPen } from 'lucide-react';
import api from '@/lib/api/api';
import { useAuthHooks } from '@/hooks/useAuth';
import { useCreateConsultation } from '@/hooks/useConsultation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Empty, Loading, Notice, PageHeader, Section, errorText, formatDate } from '@/components/dashboard/common';

// Consultation notes are written after an appointment is completed (one record per appointment).
// This page used to show hard-coded patients and kept notes in browser cookies; it now uses the API.

type PersonName = { firstName?: string | null; lastName?: string | null };

interface CompletedAppointment {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  patient?: { email?: string; profile?: PersonName };
}

interface ConsultationRow {
  consultationId: string;
  appointmentId: string;
  patientId: string;
  notes: string | null;
  createdAt: string;
  appointment?: { appointmentType?: string; scheduledDate?: string; scheduledTime?: string };
  patient?: { email?: string; profile?: PersonName };
}

const nameOf = (p?: { email?: string; profile?: PersonName }) =>
  `${p?.profile?.firstName ?? ''} ${p?.profile?.lastName ?? ''}`.trim() || p?.email || 'Patient';

const selectClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

export default function ConsultationsPage() {
  const { user } = useAuthHooks();
  const qc = useQueryClient();
  const createConsultation = useCreateConsultation();
  const [appointmentId, setAppointmentId] = useState('');
  const [notes, setNotes] = useState('');

  const consultationsQuery = useQuery({
    queryKey: ['doctor', 'consultations'],
    queryFn: async () => {
      const res = await api.get('/consultation/consultations', { params: { limit: 100 } });
      const body = res.data?.data ?? res.data;
      return (Array.isArray(body) ? body : body?.consultations ?? []) as ConsultationRow[];
    },
    enabled: user?.userType === 'doctor',
  });

  const appointmentsQuery = useQuery({
    queryKey: ['doctor', 'appointments', 'completed'],
    queryFn: async () => {
      const res = await api.get('/appointments/doctor-appointments', { params: { appointmentStatus: 'completed', limit: 100 } });
      return (res.data?.data ?? []) as CompletedAppointment[];
    },
    enabled: user?.userType === 'doctor',
  });

  const consultations = useMemo(
    () => [...(consultationsQuery.data ?? [])].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [consultationsQuery.data],
  );

  // Completed appointments that do not have notes yet.
  const awaitingNotes = useMemo(() => {
    const done = new Set(consultations.map((c) => c.appointmentId));
    return (appointmentsQuery.data ?? []).filter((a) => !done.has(a.appointmentId));
  }, [appointmentsQuery.data, consultations]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appt = awaitingNotes.find((a) => a.appointmentId === appointmentId);
    if (!appt || !notes.trim()) return;
    try {
      await createConsultation.mutateAsync({
        appointmentId: appt.appointmentId,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        notes: notes.trim(),
      });
      toast.success(`Consultation notes saved for ${nameOf(appt.patient)}`);
      setAppointmentId('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['doctor', 'consultations'] });
    } catch (err) {
      toast.error(errorText(err, 'The consultation could not be saved.'));
    }
  };

  if (!user || user.userType !== 'doctor') return null;

  const loading = consultationsQuery.isLoading || appointmentsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="Write clinical notes for completed appointments and review your past consultations."
        actions={
          <Button variant="outline" asChild>
            <Link href="/doctor/appointments">Appointments</Link>
          </Button>
        }
      />

      {consultationsQuery.error || appointmentsQuery.error ? (
        <Notice tone="error">{errorText(consultationsQuery.error ?? appointmentsQuery.error, 'Consultations could not be loaded.')}</Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Section
          className="lg:col-span-2 lg:self-start"
          title="New consultation notes"
          description="Notes can be added once an appointment is marked completed."
        >
          {loading ? (
            <Loading rows={3} />
          ) : awaitingNotes.length === 0 ? (
            <Empty icon={NotebookPen}>No completed appointments are waiting for notes.</Empty>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="appointment" className="text-sm font-medium text-slate-700">Appointment</label>
                <select
                  id="appointment"
                  required
                  className={selectClass}
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                >
                  <option value="">Select a completed appointment</option>
                  {awaitingNotes.map((a) => (
                    <option key={a.appointmentId} value={a.appointmentId}>
                      {nameOf(a.patient)} · {formatDate(a.scheduledDate)} {a.scheduledTime?.slice(0, 5)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">Clinical notes</label>
                <Textarea
                  id="notes"
                  required
                  rows={6}
                  className="min-h-36"
                  placeholder="Chief complaint, findings, diagnosis, prescription and follow-up…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={createConsultation.isPending || !appointmentId || !notes.trim()}>
                {createConsultation.isPending ? 'Saving…' : 'Save consultation'}
              </Button>
            </form>
          )}
        </Section>

        <Section
          className="lg:col-span-3"
          title="Past consultations"
          description={`${consultations.length} on record`}
          flush
        >
          {consultationsQuery.isLoading ? (
            <div className="px-5"><Loading rows={4} /></div>
          ) : consultations.length === 0 ? (
            <Empty icon={ClipboardList}>No consultations yet. Notes you save appear here.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {consultations.map((c) => (
                <li key={c.consultationId} className="flex gap-3 px-5 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-slate-900">{nameOf(c.patient)}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatDate(c.appointment?.scheduledDate ?? c.createdAt)}
                      </p>
                    </div>
                    {c.appointment?.appointmentType ? (
                      <p className="text-xs capitalize text-muted-foreground">{c.appointment.appointmentType.replace(/_/g, ' ')}</p>
                    ) : null}
                    <p className="mt-1.5 whitespace-pre-line break-words text-sm text-slate-700">{c.notes || 'No notes.'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
