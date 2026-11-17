import Link from 'next/link';
import type { ReactNode } from 'react';

// Shared layout for the terms and privacy pages.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800">
      <Link href="/" className="text-sm text-gray-600 underline underline-offset-4">IsanoMed home</Link>
      <h1 className="mt-6 text-3xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        Draft for the pilot. The final text will be reviewed before public launch. Questions: <a className="underline" href="mailto:support@isanomed.org">support@isanomed.org</a>
      </p>
      <div className="mt-8 space-y-6 text-sm leading-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
