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
    <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-4" aria-labelledby="demo-accounts">
      <h2 id="demo-accounts" className="text-sm font-semibold text-gray-900">Try a demo account</h2>
      <p className="mt-1 text-xs text-gray-600">
        Shared sample accounts with sample data. Password for all: <code className="rounded bg-gray-100 px-1">{DEMO_PASSWORD}</code>. Do not enter real health information.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={loading}
            onClick={() => handleAuth({ email: account.email, password: DEMO_PASSWORD }, 'login')}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-left transition hover:bg-gray-50 disabled:opacity-60"
            title={account.email}
          >
            <span className="block text-sm font-medium text-gray-900">{account.role}</span>
            <span className="block text-xs text-gray-600">{account.note}</span>
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
