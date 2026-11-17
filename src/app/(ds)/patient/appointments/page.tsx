'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Calendar, CalendarPlus, Clock, Stethoscope, Search, RotateCcw, X, CalendarX2, UserRound } from 'lucide-react';
import VideoCall from '@/components/consultation/VideoCall';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Empty, Loading, Notice, PageHeader, Section, StatusBadge, formatDate, formatRwf, isOpenAppointment } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

// Native <select> styled like the ui Input (the handlers below read e.target.name / value).
const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';
const labelClass = 'text-sm font-medium text-slate-700';

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
      const res = await api.get<ApiResponse<Appointment[]>>(`/appointments/my-appointments`, { params: { page: appointmentsFilters.page } });
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
  }, [user, appointmentsFilters.page]);

  // The doctor search reads the text filters when it runs (Search button or page change), not on every keystroke.
  const doctorFiltersRef = useRef(doctorFilters);
  useEffect(() => { doctorFiltersRef.current = doctorFilters; }, [doctorFilters]);

  const fetchDoctors = useCallback(async () => {
    setLoadingState(p => ({ ...p, fetchingDoctors: true })); setError(null);
    try {
      const { specialty, search } = doctorFiltersRef.current;
      const params: Record<string, string | number> = { page: doctorFilters.page };
      if (specialty.trim()) params.specialty = specialty.trim();
      if (search.trim()) params.search = search.trim();
      const res = await api.get<ApiResponse<Doctor[]>>(`/doctors/public/search`, { params });
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
  }, [doctorFilters.page]);

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
    if (user?.userType === 'patient') fetchAppointments();
  }, [user, fetchAppointments]);

  useEffect(() => {
    if (user?.userType === 'patient') fetchDoctors();
  }, [user, fetchDoctors]);

  // Coming from the doctor search (/patient/appointments?doctorId=…): preselect that doctor.
  useEffect(() => {
    const doctorId = new URLSearchParams(window.location.search).get('doctorId');
    if (doctorId) setNewAppointment(p => ({ ...p, doctorId }));
  }, []);

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
    return <Notice tone="error">Please log in as a patient to view this page.</Notice>;
  }

  const initials = (f?: string, l?: string) => ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase();
  const preselectedUnknown = !!newAppointment.doctorId && !doctors.some(d => d.doctorId === newAppointment.doctorId);
  const dateParts = (d: string) => {
    const date = new Date(d);
    return Number.isNaN(date.getTime())
      ? { month: '', day: '—' }
      : { month: date.toLocaleDateString('en-GB', { month: 'short' }), day: String(date.getDate()) };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="See your visits, join a video consultation, or book, reschedule and cancel appointments."
        actions={
          <Button asChild>
            <a href="#book"><CalendarPlus /> Book appointment</a>
          </Button>
        }
      />

      {error && (
        <Notice tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setAppointmentsFilters({ page: 1 });
                setDoctorFilters({ ...doctorFilters, page: 1 });
                fetchAppointments(); fetchDoctors();
              }}
            >
              <RotateCcw /> Retry
            </Button>
          </div>
        </Notice>
      )}

      {/* ====== Appointments ====== */}
      <Section
        title="My appointments"
        description={appointmentsPagination ? `${appointmentsPagination.total} in total` : undefined}
        flush
      >
        {loadingState.fetchingAppointments && appointments.length === 0 ? (
          <div className="p-5"><Loading /></div>
        ) : appointments.length === 0 ? (
          <Empty
            icon={Calendar}
            action={<Button size="sm" asChild><a href="#book">Book an appointment</a></Button>}
          >
            No appointments found.
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map(a => {
              const { month, day } = dateParts(a.scheduledDate);
              const isOpen = selectedAppointmentId === a.appointmentId;
              return (
                <li key={a.appointmentId} className="space-y-4 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                        <div className="text-center leading-tight">
                          <p className="text-[11px] font-semibold uppercase">{month}</p>
                          <p className="text-xl font-semibold">{day}</p>
                        </div>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'Unknown Doctor'}
                          </p>
                          {a.appointmentStatus ? <StatusBadge value={a.appointmentStatus} /> : null}
                        </div>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {a.doctor?.specialty ? (
                            <span className="inline-flex items-center gap-1"><Stethoscope className="size-3.5" />{a.doctor.specialty}</span>
                          ) : null}
                          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatDate(a.scheduledDate)} · {formatTimeForDisplay(a.scheduledTime)}</span>
                          <span className="capitalize">{a.appointmentType.replace(/[-_]/g, ' ')}</span>
                        </p>
                        {a.reason ? <p className="text-sm text-slate-700"><span className="text-muted-foreground">Reason:</span> {a.reason}</p> : null}
                        {a.notes && <p className="text-sm text-slate-700"><span className="text-muted-foreground">Notes:</span> {a.notes}</p>}
                      </div>
                    </div>

                    {isOpenAppointment(a.appointmentStatus) ? (
                    <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                      <Button
                        size="sm"
                        variant={isOpen ? 'secondary' : 'outline'}
                        onClick={() => setSelectedAppointmentId(isOpen ? null : a.appointmentId)}
                      >
                        {isOpen ? 'Hide Actions' : 'Reschedule / Cancel'}
                      </Button>
                    </div>
                    ) : null}
                  </div>

                  {isOpenAppointment(a.appointmentStatus) && (
                    <VideoCall appointmentId={a.appointmentId} />
                  )}

                  {isOpen && isOpenAppointment(a.appointmentStatus) && (
                    <div className="grid gap-6 rounded-xl border border-border bg-slate-50/70 p-4 md:grid-cols-2">
                      {/* Reschedule */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">Reschedule appointment</h3>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleRescheduleAppointment(a.appointmentId); }}
                          className="grid gap-3"
                        >
                          <label className="grid gap-1.5">
                            <span className={labelClass}>New date *</span>
                            <Input
                              type="date"
                              name="scheduledDate"
                              value={rescheduleAppointment.scheduledDate}
                              onChange={(e) => handleInputChange(e, setRescheduleAppointment, rescheduleAppointment)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </label>
                          <label className="grid gap-1.5">
                            <span className={labelClass}>New time *</span>
                            <Input
                              type="time"
                              name="scheduledTime"
                              value={rescheduleAppointment.scheduledTime}
                              onChange={(e) => handleInputChange(e, setRescheduleAppointment, rescheduleAppointment)}
                              required
                            />
                          </label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button type="submit" disabled={loadingState.rescheduling}>
                              {loadingState.rescheduling ? 'Rescheduling…' : 'Reschedule'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setRescheduleAppointment({ scheduledDate: '', scheduledTime: '' })}>
                              Clear
                            </Button>
                          </div>
                        </form>
                      </div>

                      {/* Cancel */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">Cancel appointment</h3>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleCancelAppointment(a.appointmentId); }}
                          className="grid gap-3"
                        >
                          <label className="grid gap-1.5">
                            <span className={labelClass}>Cancellation reason *</span>
                            <Textarea
                              name="cancellationReason"
                              value={cancelAppointment.cancellationReason}
                              onChange={(e) => handleInputChange(e, setCancelAppointment, cancelAppointment)}
                              placeholder="Please provide a reason"
                              rows={3}
                              required
                            />
                          </label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button type="submit" variant="destructive" disabled={loadingState.canceling}>
                              <CalendarX2 /> {loadingState.canceling ? 'Canceling…' : 'Cancel Appointment'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setCancelAppointment({ cancellationReason: '' })}>
                              Clear
                            </Button>
                          </div>
                        </form>
                      </div>

                      <div className="flex justify-end md:col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointmentId(null);
                            setRescheduleAppointment({ scheduledDate: '', scheduledTime: '' });
                            setCancelAppointment({ cancellationReason: '' });
                          }}
                        >
                          <X /> Close
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {appointmentsPagination && appointments.length > 0 && (
          <Pager
            text={`Page ${appointmentsPagination.page} of ${appointmentsPagination.pages}`}
            prevDisabled={!appointmentsPagination.hasPrev || loadingState.fetchingAppointments}
            nextDisabled={!appointmentsPagination.hasNext || loadingState.fetchingAppointments}
            onPrev={() => setAppointmentsFilters({ ...appointmentsFilters, page: appointmentsPagination.page - 1 })}
            onNext={() => setAppointmentsFilters({ ...appointmentsFilters, page: appointmentsPagination.page + 1 })}
          />
        )}
      </Section>

      {/* ====== Book Appointment ====== */}
      <div id="book" className="scroll-mt-24">
        <Section title="Book a new appointment" description="Choose a doctor and a date to see the free time slots.">
          <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={labelClass}>Doctor *</span>
              <div className="relative">
                <Stethoscope className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <select
                  name="doctorId"
                  value={newAppointment.doctorId}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className={cn(selectClass, 'pl-9')}
                  required
                >
                  <option value="">Select a doctor</option>
                  {preselectedUnknown && <option value={newAppointment.doctorId}>Doctor chosen from search</option>}
                  {doctors.map(d => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.user.profile?.firstName} {d.user.profile?.lastName} — {d.specialty} ({formatRwf(d.consultationFee)})
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Appointment type</span>
              <select
                name="appointmentType"
                value={newAppointment.appointmentType}
                onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                className={selectClass}
                required
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Date *</span>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="date"
                  name="scheduledDate"
                  value={newAppointment.scheduledDate}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className="pl-9"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Time *</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="time"
                  name="scheduledTime"
                  value={newAppointment.scheduledTime}
                  onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                  className="pl-9"
                  required
                />
              </div>
            </label>

            {loadingState.fetchingAvailability && (
              <p className="text-sm text-muted-foreground md:col-span-2">Checking available time slots…</p>
            )}

            {availabilitySlots.length > 0 && (
              <div className="md:col-span-2">
                <span className={cn(labelClass, 'mb-2 block')}>Available time slots</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {availabilitySlots.map(slot => {
                    const selected = newAppointment.scheduledTime === formatTimeForDisplay(slot.time);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          'h-9 rounded-lg border text-sm font-medium tabular-nums transition',
                          slot.available
                            ? selected
                              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                              : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
                            : 'cursor-not-allowed border-border bg-slate-50 text-slate-400 line-through',
                        )}
                      >
                        {formatTimeForDisplay(slot.time)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="grid gap-1.5">
              <span className={labelClass}>Reason *</span>
              <Input
                type="text"
                name="reason"
                value={newAppointment.reason}
                onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                placeholder="e.g., Regular checkup"
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Notes</span>
              <Textarea
                name="notes"
                value={newAppointment.notes}
                onChange={(e) => handleInputChange(e, setNewAppointment, newAppointment)}
                placeholder="Additional information (optional)"
                rows={3}
              />
            </label>

            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={loadingState.booking} className="w-full sm:w-auto">
                <CalendarPlus /> {loadingState.booking ? 'Booking…' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </Section>
      </div>

      {/* ====== Doctor Search ====== */}
      <Section
        title="Find a doctor"
        description={doctorsPagination ? `${doctorsPagination.total} doctors available` : undefined}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={labelClass}>Specialty</span>
            <Input type="text" name="specialty" value={doctorFilters.specialty} onChange={handleDoctorFilterChange} placeholder="e.g., Cardiology" />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClass}>Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input type="text" name="search" value={doctorFilters.search} onChange={handleDoctorFilterChange} placeholder="Name, keyword…" className="pl-9" />
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={fetchDoctors} disabled={loadingState.fetchingDoctors}>
            <Search /> {loadingState.fetchingDoctors ? 'Searching…' : 'Search Doctors'}
          </Button>
          <Button variant="outline" onClick={resetDoctorFilters}>Reset Filters</Button>
        </div>

        {loadingState.fetchingDoctors && doctors.length === 0 ? (
          <div className="mt-5"><Loading /></div>
        ) : doctors.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map(d => (
              <div key={d.doctorId} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {initials(d.user.profile?.firstName, d.user.profile?.lastName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{d.user.profile?.firstName} {d.user.profile?.lastName}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700">{formatRwf(d.consultationFee)}</span>
                  <StatusBadge value={d.isActive ? 'active' : 'inactive'} />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setNewAppointment({ ...newAppointment, doctorId: d.doctorId });
                    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <CalendarPlus /> Book with this doctor
                </Button>
              </div>
            ))}
          </div>
        ) : !loadingState.fetchingDoctors ? (
          <Empty icon={UserRound}>No doctors match these filters.</Empty>
        ) : null}

        {doctorsPagination && doctors.length > 0 && (
          <div className="-mx-5 -mb-5 mt-5">
            <Pager
              text={`Page ${doctorsPagination.page} of ${doctorsPagination.pages}`}
              prevDisabled={!doctorsPagination.hasPrev || loadingState.fetchingDoctors}
              nextDisabled={!doctorsPagination.hasNext || loadingState.fetchingDoctors}
              onPrev={() => setDoctorFilters({ ...doctorFilters, page: doctorsPagination.page - 1 })}
              onNext={() => setDoctorFilters({ ...doctorFilters, page: doctorsPagination.page + 1 })}
            />
          </div>
        )}
      </Section>
    </div>
  );
}

function Pager({
  text,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
}: {
  text: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
      <p className="text-xs text-muted-foreground">{text}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={prevDisabled} onClick={onPrev}>Previous</Button>
        <Button size="sm" variant="outline" disabled={nextDisabled} onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
