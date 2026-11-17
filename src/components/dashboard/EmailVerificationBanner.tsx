'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { errorText } from '@/components/dashboard/common';
import { useProfile, useRequestVerification } from '@/hooks/useDashboards';

// Shown on every dashboard until the signed-in account has a verified email.
export default function EmailVerificationBanner() {
  const { data: profile } = useProfile();
  const request = useRequestVerification();
  const [sent, setSent] = useState(false);

  if (!profile || profile.emailVerified) return null;

  const send = async () => {
    try {
      const res = await request.mutateAsync();
      if (res.alreadyVerified) {
        toast.success('Your email is already verified');
      } else {
        setSent(true);
        toast.success('Verification email sent. Check your inbox.');
      }
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/70 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-900 sm:px-6 lg:px-8">
      <span className="flex items-center gap-2"><MailWarning className="size-4 shrink-0 text-amber-500" aria-hidden /> Verify your email address to book appointments and make payments.</span>
      <Button size="sm" variant="outline" onClick={send} disabled={request.isPending || sent}>
        {sent ? 'Email sent' : request.isPending ? 'Sending…' : 'Send verification email'}
      </Button>
    </div>
  );
}
