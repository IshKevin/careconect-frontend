'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Notice, errorText } from '@/components/dashboard/common';
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-gray-900">Email verification</h1>
      {state === 'checking' ? <p className="text-sm text-gray-600">Checking your link…</p> : null}
      {state === 'done' ? (
        <Notice tone="success">Your email address is verified. You can now book appointments and make payments.</Notice>
      ) : null}
      {state === 'failed' ? (
        <Notice tone="error">
          {message} You can request a new link from your dashboard once you sign in.
        </Notice>
      ) : null}
      <Link href="/login"><Button variant="outline">Go to sign in</Button></Link>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-600">Loading…</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
