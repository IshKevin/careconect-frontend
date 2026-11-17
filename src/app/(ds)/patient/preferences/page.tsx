'use client';

import { useEffect, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Bell, MessageSquare, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Empty, Loading, Notice, PageHeader, Section } from '@/components/dashboard/common';

interface Preferences {
  preferredCommunicationMethod: string;
  appointmentReminderTiming: number;
}

export default function PreferencesPage() {
  const { user } = useAuthHooks();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ success: boolean; data: Preferences | null }>('/patient/preferences');
        // The API answers { success, data }; data is null until the patient saves preferences.
        setPreferences(response.data?.data ?? null);
      } catch (err: unknown) {
        console.error('Fetch preferences error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  if (!user || user.userType !== 'patient') {
    return (
      <Notice tone="error">Please log in as a patient to manage your preferences.</Notice>
    );
  }

  const method = preferences?.preferredCommunicationMethod
    ? String(preferences.preferredCommunicationMethod).toLowerCase()
    : '';

  return (
    <div className="space-y-6">
      <PageHeader title="Preferences" description="How we contact you and when we remind you about appointments." />

      {error && <Notice tone="error">{error}</Notice>}

      <Section title="Your current settings">
        {loading ? (
          <Loading rows={2} />
        ) : !preferences ? (
          <Empty icon={Settings2}>No preferences found. Default settings are active.</Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <MessageSquare className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Preferred communication</p>
                <p className="mt-0.5 font-medium text-slate-900">{prettyMethod(method)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Bell className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Appointment reminder</p>
                <p className="mt-0.5 font-medium text-slate-900">
                  {`${preferences.appointmentReminderTiming} hour${Number(preferences.appointmentReminderTiming) === 1 ? '' : 's'} before`}
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Update preferences" description="Changing these settings is not available yet.">
        {/* keyed so the read-only fields show the loaded values, not the defaults from the first render */}
        <form key={`${method}-${preferences?.appointmentReminderTiming ?? ""}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Preferred communication</span>
            <select
              disabled
              defaultValue={method || 'email'}
              className="h-10 w-full cursor-not-allowed rounded-lg border border-input bg-slate-50 px-3 text-sm text-slate-500 outline-none"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Phone Call</option>
              <option value="in-app">In-app</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Reminder timing (hours before)</span>
            <Input
              disabled
              type="number"
              min={0}
              defaultValue={preferences?.appointmentReminderTiming ?? 24}
            />
          </label>

          <div className="flex justify-end sm:col-span-2">
            <Button type="button" disabled title="Coming soon">
              Save changes
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}

function prettyMethod(m: string) {
  switch (m) {
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    case 'call': return 'Phone Call';
    case 'in-app':
    case 'inapp':
    case 'in_app': return 'In-app';
    default: return m ? m.charAt(0).toUpperCase() + m.slice(1) : '—';
  }
}
