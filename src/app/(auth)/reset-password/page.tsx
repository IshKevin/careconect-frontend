'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
import { AuthShell, authInputClass } from '@/components/Auth/AuthShell';
import { confirmPasswordReset } from '@/lib/api/password';

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
      <div className="space-y-4">
        <Notice tone="error">This link is incomplete. Open the link from your email again, or request a new one.</Notice>
        <Button asChild variant="outline" className="w-full"><Link href="/forgot-password">Request a new link</Link></Button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-6" /></span>
        <p className="text-sm text-slate-600">Your password has been changed. You can now sign in with the new password.</p>
        <Button asChild size="lg" className="w-full"><Link href="/login">Go to sign in</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">New password</label>
        <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} />
        <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="confirm">Repeat the new password</label>
        <input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInputClass} />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button type="submit" size="lg" disabled={state === 'saving'} className="w-full">
        {state === 'saving' ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <ResetPasswordInner />
      </Suspense>
    </AuthShell>
  );
}
