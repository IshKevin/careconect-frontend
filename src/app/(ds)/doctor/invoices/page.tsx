'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { User } from '@/types/user';
import { ChevronRight, FilePlus2, Receipt, RefreshCcw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DataTable,
  Empty,
  Loading,
  Notice,
  PageHeader,
  Section,
  StatusBadge,
  errorText,
  formatDate,
  formatRwf,
} from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

// An invoice is raised against one consultation (POST /invoice/invoices takes consultationId,
// an optional customAmount that overrides the consultation fee, and optional notes).

interface ConsultationOption {
  consultationId: string;
  patientId: string;
  createdAt: string;
  appointment?: { appointmentType?: string; scheduledDate?: string };
}

interface InvoiceRow {
  invoiceId: string;
  consultationId: string;
  invoiceNumber: string | null;
  totalAmount: string;
  invoiceStatus: string;
  invoiceDate: string;
  patient?: { email?: string; profile?: { firstName?: string; lastName?: string } };
}

const fullName = (p?: { email?: string; profile?: { firstName?: string; lastName?: string } }) =>
  `${p?.profile?.firstName ?? ''} ${p?.profile?.lastName ?? ''}`.trim() || p?.email || 'Patient';

const selectClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

export default function DoctorInvoicesPage() {
  const { user } = useAuthHooks();
  const [patients, setPatients] = useState<User[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [consultations, setConsultations] = useState<ConsultationOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [consultationId, setConsultationId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const response = await api.get('/provider/patients');
        const data = response.data?.data;
        setPatients(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('Failed to fetch patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const fetchBilling = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const [cons, inv] = await Promise.all([
        api.get('/consultation/consultations', { params: { limit: 100 } }),
        api.get('/invoice/invoices', { params: { limit: 100 } }),
      ]);
      const consBody = cons.data?.data ?? cons.data;
      setConsultations(Array.isArray(consBody) ? consBody : consBody?.consultations ?? []);
      setInvoices(Array.isArray(inv.data?.data) ? inv.data.data : []);
    } catch (err: unknown) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const name = `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });
  }, [patients, searchQuery]);

  // Consultations of the selected patient that have not been invoiced yet.
  const billable = useMemo(() => {
    if (!selectedPatient) return [];
    const invoiced = new Set(invoices.map((i) => i.consultationId));
    return consultations.filter((c) => c.patientId === selectedPatient.userId && !invoiced.has(c.consultationId));
  }, [consultations, invoices, selectedPatient]);

  const selectPatient = (p: User | null) => {
    setSelectedPatient(p);
    setConsultationId('');
  };

  const handleAddInvoice = async () => {
    if (!selectedPatient || !consultationId) return;
    const custom = amount ? parseFloat(amount) : undefined;
    if (custom !== undefined && !(custom > 0)) {
      setErrorMessage('Enter an amount greater than zero, or leave it empty to use your consultation fee.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.post('/invoice/invoices', {
        consultationId,
        ...(custom !== undefined ? { customAmount: custom } : {}),
        ...(description.trim() ? { notes: description.trim() } : {}),
      });

      setSuccessMessage(`Invoice for ${selectedPatient.profile?.firstName} created successfully!`);
      setAmount('');
      setDescription('');
      selectPatient(null);
      fetchBilling();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(errorText(err, 'Failed to create invoice. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Bill a patient for a completed consultation and follow up on payment."
        actions={
          <Button variant="outline" onClick={fetchBilling} disabled={loadingInvoices}>
            <RefreshCcw className={cn(loadingInvoices && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}
      {errorMessage ? <Notice tone="error">{errorMessage}</Notice> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient selection */}
        <Section title="1. Select patient" description="Patients who have booked with you." flush>
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search patients by name or email…"
                aria-label="Search patients"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            {loadingPatients ? (
              <div className="px-4"><Loading rows={4} label="Loading patients…" /></div>
            ) : filteredPatients.length > 0 ? (
              <ul className="divide-y divide-border">
                {filteredPatients.map((p) => {
                  const active = selectedPatient?.userId === p.userId;
                  return (
                    <li key={p.userId}>
                      <button
                        type="button"
                        onClick={() => selectPatient(p)}
                        aria-pressed={active}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                          active && 'bg-brand-50 hover:bg-brand-50',
                        )}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                          {p.profile?.firstName?.[0]}{p.profile?.lastName?.[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">{p.profile?.firstName} {p.profile?.lastName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                        </span>
                        <ChevronRight className={cn('size-4 shrink-0 text-slate-300', active && 'text-brand-600')} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty icon={Users}>No patients found matching your search.</Empty>
            )}
          </div>
        </Section>

        {/* Invoice form */}
        <Section title="2. Invoice details" className="lg:self-start">
          {selectedPatient ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Billing</p>
                  <p className="truncate font-semibold text-slate-900">
                    {selectedPatient.profile?.firstName} {selectedPatient.profile?.lastName}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => selectPatient(null)}>Change</Button>
              </div>

              {loadingInvoices ? (
                <Loading rows={2} />
              ) : billable.length === 0 ? (
                <Notice tone="info">
                  This patient has no consultations waiting to be invoiced. Write consultation notes after a completed appointment first.
                </Notice>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="consultation" className="text-sm font-medium text-slate-700">Consultation</label>
                  <select id="consultation" className={selectClass} value={consultationId} onChange={(e) => setConsultationId(e.target.value)}>
                    <option value="">Select a consultation</option>
                    {billable.map((c) => (
                      <option key={c.consultationId} value={c.consultationId}>
                        {formatDate(c.appointment?.scheduledDate ?? c.createdAt)}
                        {c.appointment?.appointmentType ? ` · ${c.appointment.appointmentType.replace(/_/g, ' ')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="amount" className="text-sm font-medium text-slate-700">Amount (RWF)</label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Leave empty to use your consultation fee"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-slate-700">Notes (optional)</label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="e.g. General consultation, lab tests…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button onClick={handleAddInvoice} disabled={submitting || !consultationId} className="w-full sm:w-auto">
                {submitting ? <><RefreshCcw className="animate-spin" /> Creating…</> : <><FilePlus2 /> Create invoice</>}
              </Button>
            </div>
          ) : (
            <Empty icon={Receipt}>Select a patient to start an invoice.</Empty>
          )}
        </Section>
      </div>

      <Section title="Your invoices" description="Most recent invoices you have issued." flush>
        {loadingInvoices ? (
          <div className="px-5"><Loading rows={3} /></div>
        ) : invoices.length === 0 ? (
          <Empty icon={Receipt}>No invoices yet.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoiceId}>
                  <td className="whitespace-nowrap font-medium text-slate-900">{inv.invoiceNumber ?? '—'}</td>
                  <td>{fullName(inv.patient)}</td>
                  <td className="whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                  <td className="whitespace-nowrap text-right tabular-nums">{formatRwf(inv.totalAmount)}</td>
                  <td><StatusBadge value={inv.invoiceStatus} /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
