'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@/hooks/usePayments';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

function PaymentReturnInner({ backHref }: { backHref: string }) {
  const searchParams = useSearchParams();
  // Pesapal sends the merchant reference back as OrderMerchantReference.
  const referenceId = searchParams.get('OrderMerchantReference');

  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!referenceId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const res = await api.get(`/payments/status/${referenceId}`);
        if (cancelled) return;
        const next: PaymentStatus = res.data?.data?.status ?? 'pending';
        setStatus(next);
        if (next !== 'pending') return;
      } catch {
        // Keep polling until the timeout; a single failed request is not a failed payment.
      }

      if (cancelled) return;
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [referenceId]);

  const backLink = (
    <Button asChild className="mt-4">
      <Link href={backHref}>Back to invoices</Link>
    </Button>
  );

  if (!referenceId) {
    return (
      <Panel tone="red" icon={<XCircle className="size-8" />} title="Payment not found">
        <p className="text-sm text-muted-foreground">We could not find a payment reference in this link.</p>
        {backLink}
      </Panel>
    );
  }

  if (status === 'completed') {
    return (
      <Panel tone="green" icon={<CheckCircle2 className="size-8" />} title="Payment successful">
        <p className="text-sm text-muted-foreground">Thank you. Your invoice has been paid.</p>
        {backLink}
      </Panel>
    );
  }

  if (status === 'failed' || status === 'reversed' || status === 'invalid') {
    return (
      <Panel tone="red" icon={<XCircle className="size-8" />} title="Payment not completed">
        <p className="text-sm text-muted-foreground">
          The payment was not completed. No money was taken for this invoice. You can try again from your invoices.
        </p>
        {backLink}
      </Panel>
    );
  }

  if (timedOut) {
    return (
      <Panel tone="amber" icon={<Clock className="size-8" />} title="Still processing">
        <p className="text-sm text-muted-foreground">
          Your payment is still being confirmed. We will notify you when it completes. You can check again from your invoices.
        </p>
        {backLink}
      </Panel>
    );
  }

  return (
    <Panel tone="blue" icon={<Clock className="size-8 animate-pulse" />} title="Confirming your payment">
      <p className="text-sm text-muted-foreground">Please keep this page open while we confirm your payment.</p>
    </Panel>
  );
}

/** Result page after Pesapal checkout: polls the payment status until it is final or 60 s pass. */
export function PaymentReturn({ backHref }: { backHref: string }) {
  return (
    <Suspense fallback={null}>
      <PaymentReturnInner backHref={backHref} />
    </Suspense>
  );
}

const PANEL_TONE = {
  red: 'bg-rose-50 text-rose-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-sky-50 text-sky-600',
} as const;

function Panel({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: keyof typeof PANEL_TONE;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center py-6 sm:py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <span className={cn('grid size-16 place-items-center rounded-full', PANEL_TONE[tone])}>{icon}</span>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
