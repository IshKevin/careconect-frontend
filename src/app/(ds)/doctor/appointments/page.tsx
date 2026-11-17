'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Appointment } from '@/types/appointment';
import VideoCall from '@/components/consultation/VideoCall';
import { Button } from '@/components/ui/Button';
import { Empty, Loading, Notice, PageHeader, Section, StatusBadge, formatDate, isOpenAppointment } from '@/components/dashboard/common';

// The doctor list returns the patient under patient.profile and the status as appointmentStatus.
type DoctorAppointment = Omit<Appointment, 'patient'> & {
  patient?: { email?: string; phoneNumber?: string; profile?: { firstName?: string; lastName?: string } };
};

const patientName = (a: DoctorAppointment) => {
  const p = a.patient?.profile;
  const name = `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim();
  return name || a.patient?.email || 'Patient';
};

export default function DoctorAppointmentsPage() {
  const { user } = useAuthHooks();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // The API pages results (10 by default); ask for the maximum so the list is complete.
        const response = await api.get('/appointments/doctor-appointments', { params: { limit: 100 } });
        setAppointments(response.data.data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };
    if (user?.userType === 'doctor') fetchAppointments();
  }, [user]);

  if (!user || user.userType !== 'doctor') return null;

  const count = appointments.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={`${count} appointment${count === 1 ? '' : 's'} · join video calls from here when a visit is due.`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/doctor/schedule">Manage availability</Link>
          </Button>
        }
      />

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Section
        title="All appointments"
        description="The video call opens 15 minutes before the appointment and closes 30 minutes after it ends."
        flush
      >
        {loading ? (
          <div className="px-5"><Loading rows={4} /></div>
        ) : count === 0 ? (
          <Empty icon={CalendarX2}>No appointments found. Patients book from your open availability.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((appointment) => {
              const status = appointment.appointmentStatus ?? appointment.status;
              return (
                <li key={appointment.appointmentId} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="w-28 shrink-0 tabular-nums">
                      <p className="text-sm font-semibold text-slate-900">{formatDate(appointment.scheduledDate)}</p>
                      {appointment.scheduledTime ? (
                        <p className="text-xs text-muted-foreground">{appointment.scheduledTime.slice(0, 5)}</p>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{patientName(appointment)}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {appointment.appointmentType?.replace(/[_-]/g, ' ')}
                        {appointment.reason ? ` · ${appointment.reason}` : ''}
                      </p>
                    </div>
                    <StatusBadge value={status} />
                  </div>
                  {isOpenAppointment(status) ? <VideoCall appointmentId={appointment.appointmentId} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
