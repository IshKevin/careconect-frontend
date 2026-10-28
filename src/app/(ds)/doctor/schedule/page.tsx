'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCcw,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ScheduleSlot {
  slotId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const BRAND = '#C4E1E1';

export default function DoctorSchedulePage() {
  const { user } = useAuthHooks();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  if (!user || user.userType !== 'doctor') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-3 ring-8 ring-rose-50/50">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Please log in as a doctor to manage your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ '--brand': BRAND } as React.CSSProperties}>
      <div className="mx-auto mb-6 h-1 max-w-6xl rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)' }} aria-hidden />

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Schedule</h1>
            <p className="mt-1 text-gray-600">
              Manage your availability and appointment slots, <span className="font-medium">Dr. {user.profile?.lastName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchSchedule} variant="outline" size="sm" className="rounded-xl border-black/10">
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" className="bg-[var(--brand)] text-gray-900 hover:bg-[var(--brand)]/80 rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Add Slot
            </Button>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 rounded-2xl border border-black/5 bg-white shadow-xl">
            <CardHeader className="border-b border-black/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-50" />
                  ))}
                </div>
              ) : slots.length > 0 ? (
                <div className="divide-y divide-black/5">
                  {slots.map((slot) => (
                    <div key={slot.slotId} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{slot.dayOfWeek}</span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {slot.isAvailable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                            Booked
                          </span>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">No slots defined yet</h3>
                    <p className="text-sm text-gray-500">Add your first availability slot to start receiving appointments.</p>
                  </div>
                  <Button size="sm" className="bg-[var(--brand)] text-gray-900 hover:bg-[var(--brand)]/80 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" /> Define Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="rounded-2xl border border-black/5 bg-gradient-to-br from-white to-gray-50 shadow-xl">
              <CardHeader pb-2>
                <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-black/5">
                  <span className="text-sm text-gray-600 font-medium">Active Slots</span>
                  <span className="text-lg font-bold text-gray-900">{slots.filter(s => s.isAvailable).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-black/5">
                  <span className="text-sm text-gray-600 font-medium">Booked This Week</span>
                  <span className="text-lg font-bold text-gray-900">{slots.filter(s => !s.isAvailable).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[var(--brand)]/10 bg-white/60 backdrop-blur shadow-xl">
              <CardContent pd-6 className="p-6">
                <div className="flex items-center gap-2 text-emerald-700 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold text-sm">Status: Active</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your schedule is currently live. Patients can discover these slots and book appointments in real-time.
                </p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
}
