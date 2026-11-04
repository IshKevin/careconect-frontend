'use client';

import { AuthForm } from '@/components/Auth/AuthForm';
import Link from 'next/link';
import { useMemo } from 'react';

export default function LoginPage() {
  const BRAND = '#C4E1E1';

  // small helper to expose CSS var to Tailwind arbitrary styles
  const cssVars = useMemo(
    () =>
      ({
        '--brand': BRAND,
      }) as React.CSSProperties,
    [BRAND]
  );

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={cssVars}
    >
      {/* background accents */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      >
        <div
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-40"
          style={{ background: 'var(--brand)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--brand)' }}
        />
      </div>

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Left: Brand / value prop */}
        <aside className="relative hidden md:block">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, rgba(196,225,225,0.65) 0%, rgba(196,225,225,0.35) 50%, rgba(196,225,225,0.15) 100%)',
            }}
          />
          <div className="relative flex h-full flex-col p-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl ring-1 ring-black/5 shadow-sm"
                style={{ background: 'var(--brand)' }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-black/70">
                  <path
                    d="M3 12h3l2-4 3 8 2-5h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold tracking-tight">IsanoMed</span>
            </div>

            {/* Headline */}
            <div className="mt-14 max-w-md">
              <h2 className="text-3xl font-semibold leading-tight tracking-tight">
                Your health, connected.
              </h2>
              <p className="mt-3 text-gray-700">
                Book appointments, message your care team, and keep your medical history in one place.
              </p>
            </div>

            {/* Bullets */}
            <ul className="mt-8 space-y-4 text-sm">
              {[
                'Secure, HIPAA-minded design',
                'Lightning-fast scheduling',
                'Private messaging with your doctor',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5"
                    style={{ background: 'var(--brand)' }}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-black/70">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>

            {/* Illustration */}
            <div className="mt-auto">
              <div className="relative mx-auto aspect-[4/3] w-4/5 max-w-lg overflow-hidden rounded-2xl border border-black/5 bg-white/60 p-6 shadow-md backdrop-blur">
                {/* simple inline SVG chart-ish illustration */}
                <svg viewBox="0 0 400 300" className="h-full w-full">
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C4E1E1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#C4E1E1" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="400" height="300" fill="url(#grad)" opacity="0.35" />
                  <polyline
                    points="20,220 90,140 140,170 200,110 260,160 320,100 380,130"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />
                  <circle cx="200" cy="110" r="6" fill="#0f172a" opacity="0.7" />
                </svg>
              </div>
              <p className="mt-3 text-center text-xs text-gray-600">
                Stay on top of vitals, prescriptions, and upcoming visits.
              </p>
            </div>
          </div>
        </aside>

        {/* Right: Auth form */}
        <main className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center md:hidden">
              {/* compact brand for mobile */}
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl ring-1 ring-black/5 shadow-sm" style={{ background: 'var(--brand)' }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-black/70">
                  <path
                    d="M3 12h3l2-4 3 8 2-5h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">IsanoMed</h1>
              <p className="mt-1 text-sm text-gray-600">Welcome back — log in to continue</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
              {/* You asked to keep the form as-is */}
              <AuthForm type="login" />

              {/* helpers */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-gray-700 underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--brand)]/50 px-3 py-1.5 font-medium text-gray-900 ring-1 ring-[var(--brand)]/60 transition hover:bg-[var(--brand)]/70"
                >
                  Create account
                </Link>
              </div>
            </div>

            {/* footer note */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Protected by best-practice security. By continuing you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
