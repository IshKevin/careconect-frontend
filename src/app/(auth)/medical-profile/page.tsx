'use client';

import { LogOut } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/dashboard/common';

// This page sits outside the dashboard shell, so it brings its own centred layout.
export default function ProfilePage() {
  const { user, handleLogout } = useAuthHooks();

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]" aria-busy="true">
          <div className="h-6 w-1/3 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </main>
    );
  }

  const initials = `${user.profile?.firstName?.[0] ?? ''}${user.profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phoneNumber || '—' },
    { label: 'User type', value: <span className="capitalize">{user.userType}</span> },
    { label: 'Account status', value: <StatusBadge value={user.accountStatus} /> },
  ];

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-raised)]">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-semibold text-brand-700" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Profile</h1>
            <p className="truncate text-sm text-muted-foreground">
              Welcome, {user.profile?.firstName} {user.profile?.lastName}!
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-6 py-3 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="min-w-0 truncate text-right font-medium text-slate-900">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-border p-6">
          <Button variant="outline" className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={handleLogout}>
            <LogOut /> Logout
          </Button>
        </div>
      </div>
    </main>
  );
}
