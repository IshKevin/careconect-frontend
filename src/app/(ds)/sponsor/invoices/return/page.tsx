import { PaymentReturn } from '@/components/payments/PaymentReturn';

// Pesapal returns sponsors here after checkout (see careconect-bn payment.service.ts, callbackUrl).
export default function SponsorPaymentReturnPage() {
  return <PaymentReturn backHref="/sponsor/invoices" />;
}
