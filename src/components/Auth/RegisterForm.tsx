'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { Button } from '@/components/ui/Button';
import { useAppConfig } from '@/hooks/useAppConfig';

// The registration form, or a "closed" message when an admin has turned off self sign-up.
export function RegisterForm() {
  const { allowSelfSignup, supportEmail, isLoading } = useAppConfig();

  if (isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;

  if (!allowSelfSignup) {
    return (
      <div className="rounded-2xl border border-border bg-slate-50 p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-200/70 text-slate-500"><Lock className="size-6" /></span>
        <p className="mt-4 font-medium text-slate-900">Registration is closed at the moment</p>
        <p className="mt-1 text-sm text-slate-600">
          To get an account, write to <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700 hover:underline">{supportEmail}</a>.
        </p>
        <Button asChild variant="outline" className="mt-5"><Link href="/login">Back to sign in</Link></Button>
      </div>
    );
  }

  return <AuthForm type="register" />;
}
