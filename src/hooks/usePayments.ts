
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api/api';

export const PAYMENT_KEYS = {
    all: ['payments'] as const,
    invoices: (userId: string) => [...PAYMENT_KEYS.all, 'invoices', userId] as const,
};

export type Invoice = {
  invoiceId: string;
  totalAmount: number | string;
  currency?: string;
  dueDate?: string; // ISO
  createdAt?: string; // ISO
  status?: 'paid' | 'unpaid' | 'overdue' | string;
  paidAt?: string; // ISO
  pdfUrl?: string;
  notes?: string;
};

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'reversed' | 'invalid';

export type InitiatePaymentResult = {
  referenceId: string;
  redirectUrl: string;
  status: 'pending';
};

export function useInvoices(userId: string) {
    return useQuery({
        queryKey: PAYMENT_KEYS.invoices(userId),
        queryFn: async () => {
            const res = await api.get(`/invoice/invoices/patient/${userId}`);
            const data = res.data?.data || res.data || [];
            return Array.isArray(data) ? (data as Invoice[]) : [];
        },
        enabled: !!userId,
    });
}

/**
 * Starts a Pesapal checkout for an invoice. The caller redirects the browser
 * to `redirectUrl` on success.
 */
export function useInitiatePayment() {
    return useMutation({
        mutationFn: async (data: { invoiceId: string }) => {
            const res = await api.post('/payments/initiate', { invoiceId: data.invoiceId });
            return res.data.data as InitiatePaymentResult;
        },
    });
}

/**
 * Downloads an invoice as a PDF through the authenticated API client, then saves it.
 * The backend enforces ownership, so a patient can only download their own invoices.
 */
export async function downloadInvoicePdf(invoiceId: string, invoiceNumber?: string): Promise<void> {
    const res = await api.get(`/invoice/invoices/${invoiceId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber ?? invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Reads the message from a backend error ({ error: { message } }) or an older shape ({ message }). */
export function apiErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data;
    return data?.error?.message ?? data?.message ?? fallback;
}
