'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CalendarRange, Clock, Plus, RefreshCcw, Timer, Trash2 } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { useCreateAvailability, useDeleteAvailability } from '@/hooks/useSchedule';
import api from '@/lib/api/api';
import type { DoctorAvailability } from '@/types/schedule';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Empty, Loading, Notice, PageHeader, Section, StatCard, errorText } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

// dayOfWeek from the API is 0-6, Sunday first. The grid shows the working week Monday first.
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const hhmm = (t: string) => t?.slice(0, 5) ?? '';
const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

export default function DoctorSchedulePage() {
  const { user } = useAuthHooks();
  const [slots, setSlots] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (!user.doctorId) {
        setSlots([]);
        return;
      }
      const response = await api.get(`/schedule/doctors/${user.doctorId}/availability`);
      const data = response.data?.data || response.data || [];
      setSlots(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Fetch schedule error:', err);
      setSlots([]);
      setError(errorText(err, 'Your schedule could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openAdd = (dayOfWeek?: number) => {
    setForm((f) => ({ ...f, dayOfWeek: dayOfWeek ?? f.dayOfWeek }));
    setFormError(null);
    setAddOpen(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.doctorId) return;
    if (minutes(form.endTime) <= minutes(form.startTime)) {
      setFormError('The end time must be after the start time.');
      return;
    }
    setFormError(null);
    try {
      await createAvailability.mutateAsync({
        doctorId: user.doctorId,
        data: {
          doctorId: user.doctorId,
          dayOfWeek: form.dayOfWeek,
          startTime: `${form.startTime}:00`,
          endTime: `${form.endTime}:00`,
          slotDuration: form.slotDuration,
          isActive: true,
        },
      });
      setAddOpen(false);
      fetchSchedule();
    } catch (err) {
      setFormError(errorText(err, 'These hours could not be saved.'));
    }
  };

  const remove = async (slot: DoctorAvailability) => {
    if (!window.confirm(`Remove ${DAYS[slot.dayOfWeek]} ${hhmm(slot.startTime)}–${hhmm(slot.endTime)} from your schedule?`)) return;
    setError(null);
    try {
      await deleteAvailability.mutateAsync(slot.availabilityId);
      fetchSchedule();
    } catch (err) {
      setError(errorText(err, 'These hours could not be removed.'));
    }
  };

  if (!user || user.userType !== 'doctor') {
    return <Notice tone="warning">Please log in as a doctor to manage your schedule.</Notice>;
  }

  const active = slots.filter((s) => s.isActive);
  const daysCovered = new Set(active.map((s) => s.dayOfWeek)).size;
  const weeklyMinutes = active.reduce((sum, s) => sum + Math.max(0, minutes(s.endTime) - minutes(s.startTime)), 0);
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;
  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly schedule"
        description="Your recurring consultation hours. Patients can book open slots inside these hours."
        actions={
          <>
            <Button variant="outline" onClick={fetchSchedule} disabled={loading}>
              <RefreshCcw className={cn(loading && 'animate-spin')} /> Refresh
            </Button>
            <Button onClick={() => openAdd()} disabled={!user.doctorId}>
              <Plus /> Add hours
            </Button>
          </>
        }
      />

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active time blocks" value={active.length} hint={`${slots.length - active.length} paused`} icon={CalendarRange} tone="blue" />
        <StatCard label="Days covered" value={`${daysCovered} / 7`} icon={CalendarDays} tone="violet" />
        <StatCard label="Hours per week" value={weeklyHours} hint="Across active blocks" icon={Timer} tone="green" />
      </div>

      {loading ? (
        <Section title="This week"><Loading rows={4} /></Section>
      ) : slots.length === 0 ? (
        <Section title="This week">
          <Empty
            icon={CalendarDays}
            action={
              <Button onClick={() => openAdd()} disabled={!user.doctorId}>
                <Plus /> Add your first hours
              </Button>
            }
          >
            No consultation hours yet. Add your availability so patients can start booking appointments.
          </Empty>
        </Section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {WEEK_ORDER.map((day) => {
            const daySlots = slots
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
            const isToday = day === today;
            return (
              <div
                key={day}
                className={cn(
                  'flex flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]',
                  isToday && 'ring-2 ring-brand-200',
                )}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{DAYS[day]}</p>
                    {isToday ? <p className="text-xs font-medium text-brand-600">Today</p> : null}
                  </div>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openAdd(day)} aria-label={`Add hours on ${DAYS[day]}`}>
                    <Plus />
                  </Button>
                </div>
                <div className="flex-1 space-y-2 p-3">
                  {daySlots.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-muted-foreground">Not available</p>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.availabilityId}
                        className={cn(
                          'group flex items-center gap-2 rounded-xl border px-3 py-2',
                          slot.isActive ? 'border-brand-100 bg-brand-50' : 'border-border bg-slate-50 opacity-70',
                        )}
                      >
                        <Clock className={cn('size-3.5 shrink-0', slot.isActive ? 'text-brand-600' : 'text-slate-400')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium tabular-nums text-slate-900">
                            {hhmm(slot.startTime)}–{hhmm(slot.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.slotDuration} min slots{slot.isActive ? '' : ' · paused'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => remove(slot)}
                          disabled={deleteAvailability.isPending}
                          aria-label={`Remove ${DAYS[day]} ${hhmm(slot.startTime)}–${hhmm(slot.endTime)}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add consultation hours</DialogTitle>
            <DialogDescription>These hours repeat every week. Patients book slots of the length you choose.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdd} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="day" className="text-sm font-medium text-slate-700">Day</label>
              <select
                id="day"
                className={selectClass}
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              >
                {WEEK_ORDER.map((d) => (
                  <option key={d} value={d}>{DAYS[d]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="start" className="text-sm font-medium text-slate-700">From</label>
                <Input id="start" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="end" className="text-sm font-medium text-slate-700">To</label>
                <Input id="end" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="duration" className="text-sm font-medium text-slate-700">Slot length</label>
              <select
                id="duration"
                className={selectClass}
                value={form.slotDuration}
                onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}
              >
                {[15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
            {formError ? <Notice tone="error">{formError}</Notice> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createAvailability.isPending}>
                {createAvailability.isPending ? 'Saving…' : 'Save hours'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
