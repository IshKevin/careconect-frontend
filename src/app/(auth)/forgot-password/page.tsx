'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-600">Enter the email address of your account. We will send you a link to choose a new password.</p>
      </div>

      {state === 'sent' ? (
        <Notice tone="success">
          If an account uses {email.trim()}, a reset link is on its way. The link is valid for 30 minutes. Check your spam folder if it does not arrive.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button type="submit" disabled={state === 'sending'} className="w-full">
            {state === 'sending' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <Link href="/login" className="text-sm text-gray-700 underline underline-offset-4">Back to sign in</Link>
    </main>
  );
}
