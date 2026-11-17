'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { RefreshCcw, Save, Wrench } from 'lucide-react';
import { Loading, Notice, PageHeader, Section, errorText } from '@/components/dashboard/common';

type Settings = {
  appName: string;
  supportEmail: string;
  timezone: string;
  sessionTimeoutMins: number;

  systemMaintenance: boolean;
  maintenanceMessage: string;

  allowSelfSignup: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;

  version?: string;
  updatedAt?: string;
};

// Starting values for fields the server does not return. They describe this product, not demo data.
const defaultSettings: Settings = {
  appName: 'IsanoMed',
  supportEmail: 'support@isanomed.org',
  timezone: 'Africa/Kigali',
  sessionTimeoutMins: 30,

  systemMaintenance: false,
  maintenanceMessage: 'We are currently undergoing maintenance. Please try again later.',

  allowSelfSignup: true,
  emailNotifications: true,
  smsNotifications: false,
};

export default function SettingsPage() {
  const { user } = useAuthHooks();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await api.get('/misc/configuration');
        const data = (res?.data?.data || res?.data) as Partial<Settings> | undefined;

        // Merge into fallback to ensure all fields exist
        const merged = { ...defaultSettings, ...(data ?? {}) };
        setSettings(merged);
        setForm(merged);
      } catch (err: unknown) {
        setSettings(defaultSettings);
        setForm(defaultSettings);
        let msg = 'Failed to fetch settings';
        if (typeof err === 'string') msg = err;
        else if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const dirty = useMemo(() => {
    if (!settings || !form) return false;
    return JSON.stringify(settings) !== JSON.stringify(form);
  }, [settings, form]);

  const onChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      // Try real API
      const res = await api.patch('/admin/settings', form);
      // The API answers { updated, settings, updatedAt }, possibly inside `data`.
      const body = (res?.data?.data ?? res?.data) as { settings?: Partial<Settings>; updatedAt?: string } & Partial<Settings> | undefined;
      const saved = body?.settings ?? body;
      const updated = {
        ...form,
        ...(saved && typeof saved === 'object' ? saved : {}),
        ...(body?.updatedAt ? { updatedAt: body.updatedAt } : {}),
      } as Settings;
      setSettings(updated);
      setForm(updated);
      setNotice('Settings saved successfully.');
    } catch (err: unknown) {
      setError(errorText(err, 'Settings could not be saved.'));
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 2500);
    }
  };

  const onReset = () => {
    if (!settings) return;
    setForm(settings);
  };

  if (!user) return null;

  const actions = (
    <>
      <Button type="button" variant="outline" onClick={onReset} disabled={!dirty || !form}>
        <RefreshCcw className="size-4" />
        Reset
      </Button>
      <Button type="button" onClick={onSave} disabled={!dirty || saving || !form}>
        <Save className="size-4" />
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System-wide options for access, notifications and maintenance."
        actions={actions}
      />

      <Notice tone="info">
        The server accepts these settings but does not store them yet, so saved values return to their defaults after a reload.
      </Notice>
      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {loading || !form ? (
        <Section title="General"><Loading rows={4} /></Section>
      ) : (
        <>
          <Section title="General" description="How the platform introduces itself.">
            <div className="divide-y divide-border">
              <SettingRow id="appName" label="Application name" description="Shown in emails and page titles.">
                <Input id="appName" value={form.appName ?? ''} onChange={(e) => onChange('appName', e.target.value)} />
              </SettingRow>
              <SettingRow id="supportEmail" label="Support email" description="Where users can reach the team.">
                <Input id="supportEmail" type="email" value={form.supportEmail ?? ''} onChange={(e) => onChange('supportEmail', e.target.value)} />
              </SettingRow>
              <SettingRow id="timezone" label="Timezone" description="Used for schedules and reports.">
                <Select value={form.timezone} onValueChange={(v) => onChange('timezone', v)}>
                  <SelectTrigger id="timezone" className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Kigali">Africa/Kigali</SelectItem>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow id="sessionTimeoutMins" label="Session timeout" description="Minutes of inactivity before sign-out.">
                <Input
                  id="sessionTimeoutMins"
                  type="number"
                  min={5}
                  value={form.sessionTimeoutMins ?? ''}
                  onChange={(e) => onChange('sessionTimeoutMins', Number(e.target.value))}
                />
              </SettingRow>
            </div>
          </Section>

          <Section title="Access" description="Who can create an account.">
            <div className="divide-y divide-border">
              <SettingRow id="allowSelfSignup" label="Allow self sign-up" description="Enable users to create their own accounts." inline>
                <Switch id="allowSelfSignup" checked={!!form.allowSelfSignup} onCheckedChange={(v) => onChange('allowSelfSignup', v)} />
              </SettingRow>
            </div>
          </Section>

          <Section title="Notifications" description="Channels used to reach users.">
            <div className="divide-y divide-border">
              <SettingRow id="emailNotifications" label="Email notifications" description="Send important updates to user email." inline>
                <Switch id="emailNotifications" checked={!!form.emailNotifications} onCheckedChange={(v) => onChange('emailNotifications', v)} />
              </SettingRow>
              <SettingRow id="smsNotifications" label="SMS notifications" description="Send SMS alerts for time-sensitive events." inline>
                <Switch id="smsNotifications" checked={!!form.smsNotifications} onCheckedChange={(v) => onChange('smsNotifications', v)} />
              </SettingRow>
            </div>
          </Section>

          <Section
            title={<span className="flex items-center gap-2"><Wrench className="size-4 text-slate-500" /> Maintenance</span>}
            description="Take the platform offline for end users during updates."
          >
            <div className="divide-y divide-border">
              <SettingRow id="systemMaintenance" label="Maintenance mode" description="Temporarily disable access for end users while performing updates." inline>
                <Switch id="systemMaintenance" checked={!!form.systemMaintenance} onCheckedChange={(v) => onChange('systemMaintenance', v)} />
              </SettingRow>
              <SettingRow id="maintenanceMessage" label="Maintenance message" description="Shown to users while maintenance mode is on.">
                <Textarea
                  id="maintenanceMessage"
                  rows={3}
                  value={form.maintenanceMessage ?? ''}
                  onChange={(e) => onChange('maintenanceMessage', e.target.value)}
                />
              </SettingRow>
            </div>
            {(form.version || form.updatedAt) && (
              <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="inline font-medium text-slate-700">Version:</dt> <dd className="inline">{form.version ?? '—'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-700">Last updated:</dt>{' '}
                  <dd className="inline">{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : '—'}</dd>
                </div>
              </dl>
            )}
          </Section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
        </>
      )}
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

// One setting: label and description on the left, the control on the right (stacked on small screens).
// `inline` keeps short controls such as switches beside the label on every screen size.
const SettingRow = ({
  id,
  label,
  description,
  inline = false,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  inline?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={
      inline
        ? 'flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0'
        : 'grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-6'
    }
  >
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">{label}</label>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className={inline ? 'shrink-0 pt-0.5' : 'min-w-0'}>{children}</div>
  </div>
);
