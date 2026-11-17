'use client';

import { useAuthHooks } from '../../hooks/useAuth';

// One-click sign-in with the shared demo accounts (created on the backend by: node dist/db/seed-demo.js).
// Shown only when NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true at build time; turn it off before real launch.
export const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true';

const DEMO_PASSWORD = 'IsanoDemo#2026';

const ACCOUNTS = [
  { role: 'Patient', email: 'patient@demo.isanomed.org', note: 'Appointments, invoices, video' },
  { role: 'Doctor', email: 'doctor@demo.isanomed.org', note: 'Schedule, patients, consultations' },
  { role: 'Sponsor', email: 'sponsor@demo.isanomed.org', note: 'Pays for a linked relative' },
  { role: 'Admin', email: 'admin@demo.isanomed.org', note: 'Users, doctors, reports' },
];

export function DemoAccounts() {
  const { handleAuth, loading, error } = useAuthHooks();

  if (!SHOW_DEMO_ACCOUNTS) return null;

  return (
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-4" aria-labelledby="demo-accounts">
      <div className="flex items-center justify-between gap-2">
        <h2 id="demo-accounts" className="text-sm font-semibold text-slate-900">Try a demo account</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-200">One click</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Shared sample accounts with sample data. Password for all: <code className="rounded bg-white px-1 font-mono text-slate-700 ring-1 ring-slate-200">{DEMO_PASSWORD}</code>. Please do not enter real health information.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={loading}
            onClick={() => handleAuth({ email: account.email, password: DEMO_PASSWORD }, 'login')}
            className="group rounded-xl border border-border bg-white px-3 py-2.5 text-left shadow-xs transition hover:-translate-y-px hover:border-brand-300 hover:shadow-sm disabled:opacity-60"
            title={account.email}
          >
            <span className="block text-sm font-semibold text-slate-900 group-hover:text-brand-700">{account.role}</span>
            <span className="block text-xs text-slate-500">{account.note}</span>
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
