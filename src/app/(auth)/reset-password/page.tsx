'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
import { confirmPasswordReset } from '@/lib/api/password';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none';

function ResetPasswordInner() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setState('saving');
    try {
      await confirmPasswordReset(token ?? '', password, confirm);
      setState('done');
    } catch (err) {
      setState('idle');
      setError(errorText(err, 'This reset link is invalid or has expired. Request a new one.'));
    }
  };

  if (!token) {
    return (
      <>
        <Notice tone="error">This link is incomplete. Open the link from your email again, or request a new one.</Notice>
        <Link href="/forgot-password" className="text-sm text-gray-700 underline underline-offset-4">Request a new link</Link>
      </>
    );
  }

  if (state === 'done') {
    return (
      <>
        <Notice tone="success">Your password has been changed. You can now sign in with the new password.</Notice>
        <Link href="/login"><Button className="w-full">Go to sign in</Button></Link>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700" htmlFor="password">New password</label>
      <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      <label className="block text-sm font-medium text-gray-700" htmlFor="confirm">Repeat the new password</label>
      <input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button type="submit" disabled={state === 'saving'} className="w-full">
        {state === 'saving' ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-gray-900">Choose a new password</h1>
      <Suspense fallback={<p className="text-sm text-gray-600">Loading…</p>}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}
