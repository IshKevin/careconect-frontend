'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
import { AuthShell } from '@/components/Auth/AuthShell';
import { confirmEmailVerification } from '@/lib/api/verification';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'checking' | 'done' | 'failed'>('checking');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('failed');
      setMessage('This link is incomplete. Open the link from your email again.');
      return;
    }
    confirmEmailVerification(token)
      .then(() => setState('done'))
      .catch((err) => {
        setState('failed');
        setMessage(errorText(err, 'This verification link is invalid or has expired.'));
      });
  }, [token]);

  return (
    <AuthShell title="Email verification">
      <div className="space-y-6">
      {state === 'checking' ? <p className="text-sm text-slate-500">Checking your link…</p> : null}
      {state === 'done' ? (
        <Notice tone="success">Your email address is verified. You can now book appointments and make payments.</Notice>
      ) : null}
      {state === 'failed' ? (
        <Notice tone="error">
          {message} You can request a new link from your dashboard once you sign in.
        </Notice>
      ) : null}
      <Button asChild size="lg" className="w-full"><Link href="/login">Go to sign in</Link></Button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
