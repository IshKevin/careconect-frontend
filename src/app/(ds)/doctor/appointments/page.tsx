'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Appointment } from '@/types/appointment';
import VideoCall from '@/components/consultation/VideoCall';

export default function DoctorAppointmentsPage() {
  const { user } = useAuthHooks();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const response = await api.get('/appointments/doctor-appointments');
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

  return (
    <div className="min-h-screen bg-[#F8FAFA] p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b pb-4 mb-6"
          style={{ borderColor: '#C4E1E1' }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Doctor&apos;s Appointments
            </h1>
            <p className="text-gray-600">
              Manage your appointments,{' '}
              <span className="font-semibold text-gray-800">
                Dr. {user.profile?.firstName} {user.profile?.lastName}
              </span>.
            </p>
          </div>
          <span
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#C4E1E1', color: '#1A1A1A' }}
          >
            {appointments.length} Appointments
          </span>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <ul className="space-y-4">
            {appointments.map((appointment) => (
              <li
                key={appointment.appointmentId}
                className="flex justify-between items-center bg-[#F5F9F9] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                style={{ borderLeft: `4px solid #C4E1E1` }}
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {appointment.reason}
                  </p>
                  <p className="text-sm text-gray-500">
                    Scheduled: {appointment.scheduledDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {appointment.status !== 'cancelled' && (
                    <VideoCall appointmentId={appointment.appointmentId} />
                  )}
                  <button
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition"
                    style={{
                      backgroundColor: '#C4E1E1',
                      color: '#1A1A1A',
                    }}
                  >
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !loading && (
            <p className="text-gray-500 text-center py-6">
              No appointments found.
            </p>
          )
        )}
      </div>
    </div>
  );
}
