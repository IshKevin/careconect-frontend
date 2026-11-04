'use client';

import { AuthForm } from '@/components/Auth/AuthForm';
import Link from 'next/link';
import { useMemo } from 'react';

export default function RegisterPage() {
  const BRAND = '#C4E1E1';

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
                Create your account
              </h2>
              <p className="mt-3 text-gray-700">
                Join thousands of patients, doctors, and admins who manage healthcare effortlessly.
              </p>
            </div>

            {/* Bullets */}
            <ul className="mt-8 space-y-4 text-sm">
              {[
                'Access your medical records anytime',
                'Book appointments in seconds',
                'Stay connected with your care team',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5"
                    style={{ background: 'var(--brand)' }}
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
          </div>
        </aside>

        {/* Right: Auth form */}
        <main className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center md:hidden">
              {/* compact brand for mobile */}
              <div
                className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl ring-1 ring-black/5 shadow-sm"
                style={{ background: 'var(--brand)' }}
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
              <h1 className="text-2xl font-semibold tracking-tight">IsanoMed</h1>
              <p className="mt-1 text-sm text-gray-600">Sign up for free</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
              {/* Registration form */}
              <AuthForm type="register" />

              {/* helpers */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-600">Already have an account?</span>
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--brand)]/50 px-3 py-1.5 font-medium text-gray-900 ring-1 ring-[var(--brand)]/60 transition hover:bg-[var(--brand)]/70"
                >
                  Log in
                </Link>
              </div>
            </div>

            {/* footer note */}
            <p className="mt-6 text-center text-xs text-gray-500">
              By signing up, you agree to our{' '}
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
