import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarCheck, ShieldCheck, Video } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import MaintenanceBanner from '@/components/layout/MaintenanceBanner';

const POINTS = [
  { icon: CalendarCheck, title: 'Book in minutes', text: 'Real availability from doctors near you.' },
  { icon: Video, title: 'Secure video visits', text: 'Encrypted, never recorded, nothing to install.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'You decide who sees your health record.' },
];

// Shared layout for sign-in, registration and password pages: a brand panel on large screens, the form on the right.
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-sky-800 p-10 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

        <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <svg viewBox="0 0 24 24" className="size-5"><path d="M3 12h3l2-4 3 8 2-5h2l1.5 1H21" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          IsanoMed
        </Link>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Your health, connected.</h2>
          <p className="mt-3 text-brand-50/80">Book trusted doctors, meet them by video and pay with mobile money, all in one place.</p>
          <ul className="mt-10 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20"><Icon className="size-5" /></span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-brand-50/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-brand-50/60">In an emergency, call 912 or go to the nearest hospital.</p>
      </aside>

      <main className="flex flex-col">
        <MaintenanceBanner />
        <div className="flex flex-1 flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
        <p className="text-center text-xs text-slate-400">
          <Link href="/terms" className="hover:text-slate-600">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
          <span className="mx-2">·</span>
          <a href="mailto:support@isanomed.org" className="hover:text-slate-600">support@isanomed.org</a>
        </p>
        </div>
      </main>
    </div>
  );
}

/** Text input styled for the auth pages (plain inputs, not react-hook-form). */
export const authInputClass =
  'block h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15';
