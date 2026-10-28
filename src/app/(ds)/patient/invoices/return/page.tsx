'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api/api';
import type { PaymentStatus } from '@/hooks/usePayments';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

function PaymentReturn() {
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
    <Link
      href="/patient/invoices"
      className="mt-6 inline-flex items-center rounded-xl bg-[#C4E1E1] px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-black/10 hover:bg-[#b3d8d8]"
    >
      Back to invoices
    </Link>
  );

  if (!referenceId) {
    return (
      <Panel icon={<XCircle className="h-10 w-10 text-rose-500" />} title="Payment not found">
        <p className="text-gray-600">We could not find a payment reference in this link.</p>
        {backLink}
      </Panel>
    );
  }

  if (status === 'completed') {
    return (
      <Panel icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />} title="Payment successful">
        <p className="text-gray-600">Thank you. Your invoice has been paid.</p>
        {backLink}
      </Panel>
    );
  }

  if (status === 'failed' || status === 'reversed' || status === 'invalid') {
    return (
      <Panel icon={<XCircle className="h-10 w-10 text-rose-500" />} title="Payment not completed">
        <p className="text-gray-600">
          The payment was not completed. No money was taken for this invoice. You can try again from your invoices.
        </p>
        {backLink}
      </Panel>
    );
  }

  if (timedOut) {
    return (
      <Panel icon={<Clock className="h-10 w-10 text-amber-500" />} title="Still processing">
        <p className="text-gray-600">
          Your payment is still being confirmed. We will notify you when it completes. You can check again from your invoices.
        </p>
        {backLink}
      </Panel>
    );
  }

  return (
    <Panel icon={<Clock className="h-10 w-10 animate-pulse text-sky-500" />} title="Confirming your payment">
      <p className="text-gray-600">Please keep this page open while we confirm your payment.</p>
    </Panel>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturn />
    </Suspense>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-gray-50 p-3 ring-8 ring-gray-50/50">{icon}</div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      <div className="max-w-md space-y-2">{children}</div>
    </div>
  );
}
