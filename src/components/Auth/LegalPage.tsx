import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Shared layout for the terms and privacy pages.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
    <Header />
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 text-slate-700 sm:px-6">
      <p className="text-sm font-semibold text-brand-600">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Draft for the pilot. The final text will be reviewed before public launch. Questions: <a className="underline" href="mailto:support@isanomed.org">support@isanomed.org</a>
      </p>
      <div className="mt-10 space-y-8 text-[15px] leading-7 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:marker:text-brand-400">
        {children}
      </div>
    </main>
    <Footer />
    </div>
  );
}
