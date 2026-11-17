'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save, Wrench } from 'lucide-react';
import api from '@/lib/api/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loading, Notice, PageHeader, Section, errorText } from '@/components/dashboard/common';

// Stored on the server (GET/PATCH /admin/settings, table system_settings). Each setting has a real effect;
// see careconect-bn/src/services/settings.service.ts.
type Settings = {
  supportEmail: string;
  allowSelfSignup: boolean;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: string | null;
};

const EDITABLE: (keyof Settings)[] = ['supportEmail', 'allowSelfSignup', 'emailNotifications', 'maintenanceMode', 'maintenanceMessage'];

export default function SettingsPage() {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get<{ success: boolean; data: Settings }>('/admin/settings');
      setSaved(res.data.data);
      setForm(res.data.data);
    } catch (err) {
      setLoadError(errorText(err, 'Settings could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Only the fields that changed are sent.
  const changes = useMemo(() => {
    if (!saved || !form) return {};
    return Object.fromEntries(EDITABLE.filter((k) => form[k] !== saved[k]).map((k) => [k, form[k]]));
  }, [saved, form]);
  const dirty = Object.keys(changes).length > 0;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const onSave = async () => {
    if (!dirty) return;
    if (changes.maintenanceMode === true && !window.confirm('Turn on maintenance mode? Patients, doctors and sponsors will not be able to make changes until you turn it off.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch<{ success: boolean; data: Settings }>('/admin/settings', changes);
      setSaved(res.data.data);
      setForm(res.data.data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(errorText(err, 'Settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <>
      <Button type="button" variant="outline" onClick={() => setForm(saved)} disabled={!dirty || saving}>
        <RefreshCcw /> Discard
      </Button>
      <Button type="button" onClick={onSave} disabled={!dirty || saving}>
        <Save /> {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={
          saved?.updatedAt ? `System-wide options. Last changed ${new Date(saved.updatedAt).toLocaleString('en-GB')}.` : 'System-wide options for access, notifications and maintenance.'
        }
        actions={form ? actions : undefined}
      />

      {loadError ? (
        <Notice tone="error">
          {loadError}{' '}
          <button className="font-medium underline" onClick={load}>Try again</button>
        </Notice>
      ) : null}

      {form?.maintenanceMode && saved?.maintenanceMode ? (
        <Notice tone="warning">Maintenance mode is on. Only admins can make changes right now.</Notice>
      ) : null}

      {loading ? (
        <Section title="General"><Loading rows={4} /></Section>
      ) : form ? (
        <>
          <Section title="General" description="How people reach the IsanoMed team.">
            <SettingRow id="supportEmail" label="Support email" description="Shown in the app and in error messages.">
              <Input id="supportEmail" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
            </SettingRow>
          </Section>

          <Section title="Access" description="Who can create an account.">
            <SettingRow id="allowSelfSignup" label="Allow self sign-up" description="When off, the registration page is closed. Admins can still create accounts." inline>
              <Switch id="allowSelfSignup" checked={form.allowSelfSignup} onCheckedChange={(v) => set('allowSelfSignup', v)} />
            </SettingRow>
          </Section>

          <Section title="Notifications" description="Emails sent to patients.">
            <SettingRow
              id="emailNotifications"
              label="Appointment and payment emails"
              description="Booking confirmations and payment receipts. Password-reset and verification emails are always sent."
              inline
            >
              <Switch id="emailNotifications" checked={form.emailNotifications} onCheckedChange={(v) => set('emailNotifications', v)} />
            </SettingRow>
          </Section>

          <Section
            title={<span className="flex items-center gap-2"><Wrench className="size-4 text-slate-500" /> Maintenance</span>}
            description="Pause changes during updates. People can still sign in and view their information."
          >
            <div className="divide-y divide-border">
              <SettingRow id="maintenanceMode" label="Maintenance mode" description="Shows the message below to everyone and blocks changes from non-admins." inline>
                <Switch id="maintenanceMode" checked={form.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} />
              </SettingRow>
              <SettingRow id="maintenanceMessage" label="Maintenance message" description="Up to 300 characters.">
                <Textarea id="maintenanceMessage" rows={3} maxLength={300} value={form.maintenanceMessage} onChange={(e) => set('maintenanceMessage', e.target.value)} />
              </SettingRow>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
        </>
      ) : null}
    </div>
  );
}

// One setting: label and description on the left, the control on the right (stacked on small screens).
// `inline` keeps short controls such as switches beside the label on every screen size.
function SettingRow({ id, label, description, inline = false, children }: { id: string; label: string; description?: string; inline?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={
        inline
          ? 'flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0'
          : 'grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-6'
      }
    >
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-900">{label}</label>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className={inline ? 'shrink-0 pt-0.5' : 'min-w-0'}>{children}</div>
    </div>
  );
}
