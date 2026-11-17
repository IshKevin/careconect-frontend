'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
import { AuthShell, authInputClass } from '@/components/Auth/AuthShell';
import { requestPasswordReset } from '@/lib/api/password';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setState('sending');
    try {
      await requestPasswordReset(email.trim());
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(errorText(err, 'We could not send the reset email. Please try again.'));
    }
  };

  return (
    <AuthShell
      title={state === 'sent' ? 'Check your email' : 'Reset your password'}
      subtitle={state === 'sent' ? undefined : 'Enter the email of your account and we will send you a link to choose a new password.'}
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      }
    >
      {state === 'sent' ? (
        <div className="rounded-2xl border border-border bg-slate-50 p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><MailCheck className="size-6" /></span>
          <p className="mt-4 text-sm text-slate-600">
            If an account uses <span className="font-medium text-slate-900">{email.trim()}</span>, a reset link is on its way. It is valid for 30 minutes. Check your spam folder if it does not arrive.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
          </div>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button type="submit" size="lg" disabled={state === 'sending'} className="w-full">
            {state === 'sending' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
