'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Calendar, Clock, Stethoscope, UserRound, Search, RotateCcw, Plus, X } from 'lucide-react';
import VideoCall from '@/components/consultation/VideoCall';

interface Doctor {
  doctorId: string;
  specialty: string;
  consultationFee: string;
  isActive: boolean;
  user: { profile: { firstName: string; lastName: string } };
}

interface Appointment {
  appointmentId: string;
  doctorId: string;
  appointmentType: string;
  appointmentStatus?: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  notes?: string;
  doctor?: { firstName: string; lastName: string; specialty: string };
}

interface AvailabilitySlot { time: string; available: boolean; }

interface NewAppointment {
  doctorId: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  notes: string;
}

interface RescheduleAppointment { scheduledDate: string; scheduledTime: string; }
interface CancelAppointment { cancellationReason: string; }

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number; limit: number; total: string; pages: number; hasNext: boolean; hasPrev: boolean;
  };
  message?: string; error?: string;
}

export default function PatientAppointmentsPage() {
  const { user } = useAuthHooks();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [appointmentsPagination, setAppointmentsPagination] = useState<ApiResponse<Appointment[]>['pagination'] | null>(null);
  const [doctorsPagination, setDoctorsPagination] = useState<ApiResponse<Doctor[]>['pagination'] | null>(null);

  const [loadingState, setLoadingState] = useState({
    fetchingAppointments: false,
    fetchingDoctors: false,
    fetchingAvailability: false,
    booking: false,
    rescheduling: false,
    canceling: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    doctorId: '',
    appointmentType: 'consultation',
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
    notes: '',
  });
  const [rescheduleAppointment, setRescheduleAppointment] = useState<RescheduleAppointment>({ scheduledDate: '', scheduledTime: '' });
  const [cancelAppointment, setCancelAppointment] = useState<CancelAppointment>({ cancellationReason: '' });

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const [doctorFilters, setDoctorFilters] = useState<{ specialty: string; search: string; minFee: string; maxFee: string; page: number; }>({
    specialty: '', search: '', minFee: '', maxFee: '', page: 1,
  });
  const [appointmentsFilters, setAppointmentsFilters] = useState<{ page: number }>({ page: 1 });

  // ---------- helpers (unchanged logic) ----------
  const formatTimeForAPI = (time: string): string => (time && time.length === 5 ? `${time}:00` : time);
  const formatTimeForDisplay = (time: string): string => time.substring(0, 5);
  const isValidFutureDateTime = (date: string, time: string): boolean => {
    if (!date || !time) return false;
    try { return new Date(`${date}T${formatTimeForAPI(time)}`) > new Date(); } catch { return false; }
  };

  // ---------- data fetchers (same endpoints) ----------
  const fetchAppointments = useCallback(async () => {
    if (!user || user.userType !== 'patient') { setError('User not authenticated or not a patient'); return; }
    setLoadingState(p => ({ ...p, fetchingAppointments: true })); setError(null);
    try {
      const res = await api.get<ApiResponse<Appointment[]>>(`/appointments/my-appointments`);
      setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
      setAppointmentsPagination(res.data.pagination || null);
    } catch (err: unknown) {
      let msg = 'Failed to fetch appointments';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response.data?.message || axiosErr.response.data?.error || msg;
      } else if (err instanceof Error) msg = err.message;
      setError(msg); setAppointments([]);
    } finally {
      setLoadingState(p => ({ ...p, fetchingAppointments: false }));
    }
  }, [user]);

  const fetchDoctors = useCallback(async () => {
    setLoadingState(p => ({ ...p, fetchingDoctors: true })); setError(null);
    try {
      const res = await api.get<ApiResponse<Doctor[]>>(`/doctors/public/search`);
      setDoctors(Array.isArray(res.data.data) ? res.data.data : []);
      setDoctorsPagination(res.data.pagination || null);
    } catch (err: unknown) {
      let msg = 'Failed to fetch doctors';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response.data?.message || axiosErr.response.data?.error || msg;
      } else if (err instanceof Error) msg = err.message;
      setError(msg); setDoctors([]);
    } finally {
      setLoadingState(p => ({ ...p, fetchingDoctors: false }));
    }
  }, []);

  const fetchAvailability = useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) { setAvailabilitySlots([]); return; }
    setLoadingState(p => ({ ...p, fetchingAvailability: true }));
    try {
      const res = await api.get<ApiResponse<AvailabilitySlot[]>>(`/appointments/availability/${doctorId}/${date}`);
      setAvailabilitySlots(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setAvailabilitySlots([]); // keep form usable without raising error banner
    } finally {
      setLoadingState(p => ({ ...p, fetchingAvailability: false }));
    }
  }, []);

  useEffect(() => {
    if (user?.userType === 'patient') { fetchAppointments(); fetchDoctors(); }
  }, [user, fetchAppointments, fetchDoctors]);

  useEffect(() => {
    if (newAppointment.doctorId && newAppointment.scheduledDate) {
      fetchAvailability(newAppointment.doctorId, newAppointment.scheduledDate);
    } else {
      setAvailabilitySlots([]);
    }
  }, [newAppointment.doctorId, newAppointment.scheduledDate, fetchAvailability]);

  // ---------- actions (same endpoints) ----------
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.userType !== 'patient') { setError('You must be a patient to book an appointment'); return; }
    if (!newAppointment.doctorId || !newAppointment.scheduledDate || !newAppointment.scheduledTime || !newAppointment.reason) {
      setError('Doctor, date, time, and reason are required'); return;
    }
    if (!isValidFutureDateTime(newAppointment.scheduledDate, newAppointment.scheduledTime)) {
      setError('Cannot schedule appointments in the past'); return;
    }
    const slot = availabilitySlots.find(s => s.time === formatTimeForAPI(newAppointment.scheduledTime));
    if (slot && !slot.available) { setError('Selected time slot is not available'); return; }

    setLoadingState(p => ({ ...p, booking: true })); setError(null);
    try {
      await api.post<ApiResponse<Appointment>>('/appointments/book', {
        ...newAppointment, scheduledTime: formatTimeForAPI(newAppointment.scheduledTime),
      });
      await fetchAppointments();
      setNewAppointment({ doctorId: '', appointmentType: 'consultation', scheduledDate: '', scheduledTime: '', reason: '', notes: '' });
      setAvailabilitySlots([]);
    } catch (err: unknown) {
      let msg = 'Failed to book appointment';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response.data?.message || axiosErr.response.data?.error || msg;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally { setLoadingState(p => ({ ...p, booking: false })); }
  };

  const handleRescheduleAppointment = async (appointmentId: string) => {
    if (!user || user.userType !== 'patient') { setError('You must be a patient to reschedule an appointment'); return; }
    if (!rescheduleAppointment.scheduledDate || !rescheduleAppointment.scheduledTime) { setError('Date and time are required'); return; }
    if (!isValidFutureDateTime(rescheduleAppointment.scheduledDate, rescheduleAppointment.scheduledTime)) { setError('Cannot reschedule to a past date/time'); return; }

    setLoadingState(p => ({ ...p, rescheduling: true })); setError(null);
    try {
      await api.put<ApiResponse<Appointment>>(`/appointments/${appointmentId}/reschedule`, {
        ...rescheduleAppointment, scheduledTime: formatTimeForAPI(rescheduleAppointment.scheduledTime),
      });
      await fetchAppointments();
      setSelectedAppointmentId(null);
      setRescheduleAppointment({ scheduledDate: '', scheduledTime: '' });
    } catch (err: unknown) {
      let msg = 'Failed to reschedule appointment';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response.data?.message || axiosErr.response.data?.error || msg;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally { setLoadingState(p => ({ ...p, rescheduling: false })); }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    if (!user || user.userType !== 'patient') { setError('You must be a patient to cancel an appointment'); return; }
    if (!cancelAppointment.cancellationReason.trim()) { setError('Cancellation reason is required'); return; }

    setLoadingState(p => ({ ...p, canceling: true })); setError(null);
    try {
      await api.put<ApiResponse<Appointment>>(`/appointments/${appointmentId}/cancel`, cancelAppointment);
      await fetchAppointments();
      setSelectedAppointmentId(null);
      setCancelAppointment({ cancellationReason: '' });
    } catch (err: unknown) {
      let msg = 'Failed to cancel appointment';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string; error?: string } } };
        msg = axiosErr.response.data?.message || axiosErr.response.data?.error || msg;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally { setLoadingState(p => ({ ...p, canceling: false })); }
  };

  // ---------- UI helpers ----------
  const handleInputChange = <T,>(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<T>>,
    state: T
  ) => {
    const { name, value } = e.target;
    setState({ ...state, [name]: value });
  };
  const handleDoctorFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDoctorFilters({ ...doctorFilters, [e.target.name]: e.target.value, page: 1 });
  };
  const resetDoctorFilters = () => setDoctorFilters({ specialty: '', search: '', minFee: '', maxFee: '', page: 1 });
  const handleTimeSlotSelect = (time: string) => setNewAppointment({ ...newAppointment, scheduledTime: formatTimeForDisplay(time) });

  if (!user || user.userType !== 'patient') {
    return <div className="p-6"><p className="text-rose-600">Please log in as a patient to view this page.</p></div>;
  }

  const BRAND = '#C4E1E1';
  const initials = (f?: string, l?: string) => ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase();

  return (
    <div
      className="p-6"
      style={{ '--brand': BRAND } as React.CSSProperties}
    >
      {/* brand ribbon */}
      <div className="mx-auto mb-6 h-1 max-w-7xl rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)' }} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Appointments</h1>
          <p className="mt-1 text-gray-600">
            Manage your appointments, <span className="font-medium">{user.profile?.firstName} {user.profile?.lastName}</span>.
          </p>
        </header>

        {/* global */}
        {(loadingState.fetchingAppointments || loadingState.fetchingDoctors || loadingState.fetchingAvailability || loadingState.booking || loadingState.rescheduling || loadingState.canceling) && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">Loading…</div>
        )}
        {error && (
          <div className="flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div>{error}</div>
            <button
              onClick={() => {
                setError(null);
                setAppointmentsFilters({ page: 1 });
                setDoctorFilters({ ...doctorFilters, page: 1 });
                fetchAppointments(); fetchDoctors();
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1 text-sm ring-1 ring-rose-200 hover:bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ====== Book Appointment ====== */}
        <section className="rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Plus className="h-4 w-4" /> Book New Appointment
            </h2>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-black/5 to-transparent" />
          <div className="p-5">
            <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Doctor */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Doctor *</span>
                <div className="relative">
                  <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    name="doctorId"
                    value={newAppointment.doctorId}
                    onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map(d => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.user.profile?.firstName} {d.user.profile?.lastName} — {d.specialty} (${d.consultationFee})
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Type */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Appointment Type</span>
                <select
                  name="appointmentType"
                  value={newAppointment.appointmentType}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  required
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </label>

              {/* Date */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Date *</span>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="scheduledDate"
                    value={newAppointment.scheduledDate}
                    onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </label>

              {/* Time */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Time *</span>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    name="scheduledTime"
                    value={newAppointment.scheduledTime}
                    onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                    required
                  />
                </div>
              </label>

              {/* Availability */}
              {availabilitySlots.length > 0 && (
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {availabilitySlots.map(slot => {
                      const selected = newAppointment.scheduledTime === formatTimeForDisplay(slot.time);
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                          disabled={!slot.available}
                          className={[
                            'h-9 rounded-lg border text-sm transition',
                            slot.available
                              ? selected
                                ? 'bg-[var(--brand)] text-gray-900 border-[var(--brand)] ring-1 ring-[var(--brand)]'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed',
                          ].join(' ')}
                        >
                          {formatTimeForDisplay(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Reason *</span>
                <input
                  type="text"
                  name="reason"
                  value={newAppointment.reason}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g., Regular checkup"
                  required
                />
              </label>

              {/* Notes */}
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Notes</span>
                <textarea
                  name="notes"
                  value={newAppointment.notes}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="Additional information (optional)"
                  rows={3}
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingState.booking}
                  className="inline-flex items-center rounded-xl bg-[var(--brand)] px-4 py-2.5 font-medium text-gray-900 ring-1 ring-black/5 transition hover:bg-[#b3d8d8] disabled:opacity-60"
                >
                  {loadingState.booking ? 'Booking…' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ====== Doctor Search ====== */}
        <section className="rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Search className="h-4 w-4" /> Search Doctors
            </h2>
            <div className="text-xs text-gray-500">
              {doctorsPagination ? `Page ${doctorsPagination.page} of ${doctorsPagination.pages} • Total: ${doctorsPagination.total}` : null}
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-black/5 to-transparent" />

          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Specialty</span>
                <input
                  type="text" name="specialty" value={doctorFilters.specialty} onChange={handleDoctorFilterChange}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="e.g., Cardiology"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Search</span>
                <input
                  type="text" name="search" value={doctorFilters.search} onChange={handleDoctorFilterChange}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="Name, keyword…"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700">Min Fee ($)</span>
                  <input
                    type="number" name="minFee" value={doctorFilters.minFee} onChange={handleDoctorFilterChange}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                    min="0" placeholder="e.g., 50"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700">Max Fee ($)</span>
                  <input
                    type="number" name="maxFee" value={doctorFilters.maxFee} onChange={handleDoctorFilterChange}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                    min="0" placeholder="e.g., 120"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={resetDoctorFilters}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <button
                onClick={fetchDoctors}
                disabled={loadingState.fetchingDoctors}
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-black/5 transition hover:bg-[#b3d8d8] disabled:opacity-60"
              >
                {loadingState.fetchingDoctors ? 'Searching…' : 'Search Doctors'}
              </button>
            </div>

            {doctors.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.map(d => (
                  <div key={d.doctorId} className="rounded-xl border border-black/5 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 ring-1 ring-black/5">
                        {initials(d.user.profile?.firstName, d.user.profile?.lastName)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{d.user.profile?.firstName} {d.user.profile?.lastName}</p>
                        <p className="text-xs text-gray-500">{d.doctorId}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-700"><span className="font-medium">Specialty:</span> {d.specialty}</p>
                      <p className="text-gray-700"><span className="font-medium">Fee:</span> ${d.consultationFee}</p>
                      <p className="text-gray-700">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ring-1 ${d.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {doctorsPagination && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Page {doctorsPagination.page} of {doctorsPagination.pages} • Total Doctors: {doctorsPagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={!doctorsPagination.hasPrev || loadingState.fetchingDoctors}
                    onClick={() => setDoctorFilters({ ...doctorFilters, page: doctorsPagination.page - 1 })}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!doctorsPagination.hasNext || loadingState.fetchingDoctors}
                    onClick={() => setDoctorFilters({ ...doctorFilters, page: doctorsPagination.page + 1 })}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ====== Appointments ====== */}
        {appointments.length > 0 ? (
          <section className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur">
            <h2 className="text-base font-semibold text-gray-900">My Appointments</h2>
            <div className="mt-4 space-y-3">
              {appointments.map(a => (
                <div key={a.appointmentId} className="rounded-xl border border-black/5 bg-white p-4">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{new Date(a.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatTimeForDisplay(a.scheduledTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <UserRound className="h-4 w-4 text-gray-400" />
                      <span>
                        {a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName} (${a.doctor.specialty})` : 'Unknown Doctor'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">Type:</span> {a.appointmentType}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Reason:</span> {a.reason}
                  </div>
                  {a.notes && (
                    <div className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {a.notes}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAppointmentId(selectedAppointmentId === a.appointmentId ? null : a.appointmentId)}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200"
                    >
                      {selectedAppointmentId === a.appointmentId ? 'Hide Actions' : 'Reschedule / Cancel'}
                    </button>
                    <span className="self-center text-xs text-gray-400">ID: {a.appointmentId}</span>
                  </div>

                  {a.appointmentStatus !== 'cancelled' && (
                    <div className="mt-3">
                      <VideoCall appointmentId={a.appointmentId} />
                    </div>
                  )}

                  {selectedAppointmentId === a.appointmentId && (
                    <div className="mt-4 grid gap-6 rounded-xl border border-black/5 bg-gray-50 p-4 md:grid-cols-2">
                      {/* Reschedule */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800">Reschedule Appointment</h3>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleRescheduleAppointment(a.appointmentId); }}
                          className="grid grid-cols-1 gap-3"
                        >
                          <label className="grid gap-1">
                            <span className="text-sm font-medium text-gray-700">New Date *</span>
                            <input
                              type="date"
                              name="scheduledDate"
                              value={rescheduleAppointment.scheduledDate}
                              onChange={(e) => handleInputChange(e, setRescheduleAppointment, rescheduleAppointment)}
                              className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-sm font-medium text-gray-700">New Time *</span>
                            <input
                              type="time"
                              name="scheduledTime"
                              value={rescheduleAppointment.scheduledTime}
                              onChange={(e) => handleInputChange(e, setRescheduleAppointment, rescheduleAppointment)}
                              className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                              required
                            />
                          </label>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={loadingState.rescheduling}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {loadingState.rescheduling ? 'Rescheduling…' : 'Reschedule'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRescheduleAppointment({ scheduledDate: '', scheduledTime: '' })}
                              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300"
                            >
                              Clear
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Cancel */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800">Cancel Appointment</h3>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleCancelAppointment(a.appointmentId); }}
                          className="grid grid-cols-1 gap-3"
                        >
                          <label className="grid gap-1">
                            <span className="text-sm font-medium text-gray-700">Cancellation Reason *</span>
                            <textarea
                              name="cancellationReason"
                              value={cancelAppointment.cancellationReason}
                              onChange={(e) => handleInputChange(e, setCancelAppointment, cancelAppointment)}
                              className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                              placeholder="Please provide a reason"
                              rows={3}
                              required
                            />
                          </label>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={loadingState.canceling}
                              className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              {loadingState.canceling ? 'Canceling…' : 'Cancel Appointment'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelAppointment({ cancellationReason: '' })}
                              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300"
                            >
                              Clear
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentId(null);
                            setRescheduleAppointment({ scheduledDate: '', scheduledTime: '' });
                            setCancelAppointment({ cancellationReason: '' });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-black/10 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" /> Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* pagination */}
            {appointmentsPagination && (
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Page {appointmentsPagination.page} of {appointmentsPagination.pages} • Total Appointments: {appointmentsPagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={!appointmentsPagination.hasPrev || loadingState.fetchingAppointments}
                    onClick={() => setAppointmentsFilters({ ...appointmentsFilters, page: appointmentsPagination.page - 1 })}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!appointmentsPagination.hasNext || loadingState.fetchingAppointments}
                    onClick={() => setAppointmentsFilters({ ...appointmentsFilters, page: appointmentsPagination.page + 1 })}
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : (
          !loadingState.fetchingAppointments && (
            <div className="rounded-2xl border border-black/5 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
              <p className="text-gray-600">No appointments found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
