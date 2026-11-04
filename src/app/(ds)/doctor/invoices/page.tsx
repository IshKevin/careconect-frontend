'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { User } from '@/types/user';
import { 
  FilePlus2, 
  Search, 
  Users, 
  Receipt, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  RefreshCcw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

const BRAND = '#C4E1E1';

export default function DoctorInvoicesPage() {
  const { user } = useAuthHooks();
  const [patients, setPatients] = useState<User[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
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

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const name = `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });
  }, [patients, searchQuery]);

  const handleAddInvoice = async () => {
    if (!selectedPatient || !amount || !description) return;
    
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      await api.post('/invoice/invoices', {
        patientId: selectedPatient.userId,
        totalAmount: parseFloat(amount),
        notes: description,
        currency: 'USD',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });
      
      setSuccessMessage(`Invoice for ${selectedPatient.profile?.firstName} created successfully!`);
      setAmount('');
      setDescription('');
      setSelectedPatient(null);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice. Please try again.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6" style={{ '--brand': BRAND } as React.CSSProperties}>
      {/* brand ribbon */}
      <div
        className="mx-auto mb-6 h-1 max-w-6xl rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)' }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
              <Receipt className="h-8 w-8 text-[#8ab6b6]" />
              Invoices Management
            </h1>
            <p className="mt-1 text-gray-600">
              Create and manage invoices for your patients, <span className="font-medium">Dr. {user.profile?.lastName}</span>.
            </p>
          </div>
        </header>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 animate-in fade-in slide-in-from-top-2">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <Card className="rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="border-b border-black/5 bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-gray-500" />
                Select Patient
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-black/10 focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {loadingPatients ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                  <p className="text-gray-500">Loading patients list...</p>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="divide-y divide-black/5">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.userId}
                      onClick={() => setSelectedPatient(p)}
                      className={`w-full p-4 text-left transition-colors flex items-center justify-between hover:bg-[var(--brand)]/10 ${
                        selectedPatient?.userId === p.userId ? 'bg-[var(--brand)]/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white to-gray-100 border border-black/5 flex items-center justify-center font-bold text-gray-700">
                          {p.profile?.firstName?.[0]}{p.profile?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.profile?.firstName} {p.profile?.lastName}</p>
                          <p className="text-xs text-gray-500">{p.email}</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-gray-300 transition-transform ${selectedPatient?.userId === p.userId ? 'translate-x-1 text-gray-500' : ''}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No patients found matching your search.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Invoice Form */}
          <Card className="rounded-2xl border border-black/5 bg-white/80 shadow-xl backdrop-blur h-fit">
            <CardHeader className="border-b border-black/5 bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FilePlus2 className="h-5 w-5 text-gray-500" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedPatient ? (
                <div className="space-y-6">
                  <div className="bg-[var(--brand)]/10 p-4 rounded-xl border border-[var(--brand)]/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Drafting for</p>
                      <p className="text-lg font-bold text-gray-900">{selectedPatient.profile?.firstName} {selectedPatient.profile?.lastName}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs font-medium text-gray-500 hover:text-rose-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Amount (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-9 h-12 rounded-xl border-black/10 focus:ring-2 focus:ring-[var(--brand)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description / Notes</label>
                      <textarea
                        placeholder="e.g. General Consultation, Lab Tests, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full min-h-[120px] p-3 rounded-xl border border-black/10 bg-white shadow-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Due Date: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} (7 days)</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddInvoice}
                      disabled={submitting || !amount || !description}
                      className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-black font-semibold text-lg flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <RefreshCcw className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Generate Invoice
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-black/5">
                    <Receipt className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium tracking-tight">Select a patient on the left to start drafting an invoice.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
