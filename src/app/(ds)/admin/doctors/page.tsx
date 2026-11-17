'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { ChevronLeft, ChevronRight, Download, Pencil, Search, Stethoscope, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatusBadge, formatRwf } from '@/components/dashboard/common';

const LABEL = 'block text-sm font-medium text-slate-700';
// Native select styled like the ui Input (the change handler below reads e.target.name, so a native element is kept).
const NATIVE_SELECT =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50';

interface Doctor {
  doctorId: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  medicalLicenseNumber: string;
  specialty: string;
  consultationFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    phoneNumber: string;
    profile: { firstName: string; lastName: string };
  };
}

interface NewDoctor {
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  medicalLicenseNumber: string;
  specialty: string;
  consultationFee: number;
  isActive: boolean;
}

interface UpdateDoctor {
  medicalLicenseNumber?: string;
  specialty?: string;
  consultationFee?: number;
  isActive?: boolean;
}

interface UpdateStatus {
  isActive: boolean;
  reason?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: string;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function DoctorsPage() {
  const { user } = useAuthHooks();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // forms
  const [newDoctor, setNewDoctor] = useState<NewDoctor>({
    email: '',
    phoneNumber: '',
    password: '',
    firstName: '',
    lastName: '',
    medicalLicenseNumber: '',
    specialty: '',
    consultationFee: 0,
    isActive: true,
  });
  const [updateDoctor, setUpdateDoctor] = useState<UpdateDoctor>({});
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ isActive: true });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // filters/sort/search
  const [filters, setFilters] = useState({ specialty: '', isActive: '', page: '1' });
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'specialty' | 'feeAsc' | 'feeDesc' | 'newest'>('newest');

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (filters.specialty) qs.append('specialty', filters.specialty);
        if (filters.isActive) qs.append('isActive', filters.isActive);
        if (filters.page) qs.append('page', filters.page);

        const url = `/doctors/${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await api.get(url);

        let fetchedDoctors: Doctor[] = [];
        let fetchedPagination: Pagination | null = null;
        if (response.data) {
          if (response.data.data) {
            fetchedDoctors = response.data.data.doctors || response.data.data || [];
            fetchedPagination = response.data.data.pagination || null;
          } else if (response.data.doctors) {
            fetchedDoctors = response.data.doctors;
            fetchedPagination = response.data.pagination || null;
          } else if (Array.isArray(response.data)) {
            fetchedDoctors = response.data;
          } else if (response.data.doctorId) {
            fetchedDoctors = [response.data];
          }
        }

        setDoctors(Array.isArray(fetchedDoctors) ? fetchedDoctors : []);
        setPagination(fetchedPagination);
      } catch (err: unknown) {
        let msg = 'Failed to fetch doctors';
        if (typeof err === 'string') msg = err;
        else if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [user, filters]);

  const refetchDoctors = async () => {
    try {
      const qs = new URLSearchParams();
      if (filters.specialty) qs.append('specialty', filters.specialty);
      if (filters.isActive) qs.append('isActive', filters.isActive);
      if (filters.page) qs.append('page', filters.page);
      const response = await api.get(`/doctors/${qs.toString() ? `?${qs.toString()}` : ''}`);
      let fetchedDoctors: Doctor[] = [];
      let fetchedPagination: Pagination | null = null;

      if (response.data) {
        if (response.data.data) {
          fetchedDoctors = response.data.data.doctors || response.data.data || [];
          fetchedPagination = response.data.data.pagination || null;
        } else if (response.data.doctors) {
          fetchedDoctors = response.data.doctors;
          fetchedPagination = response.data.pagination || null;
        } else if (Array.isArray(response.data)) {
          fetchedDoctors = response.data;
        }
      }

      setDoctors(Array.isArray(fetchedDoctors) ? fetchedDoctors : []);
      setPagination(fetchedPagination);
    } catch {
      /* silent */
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/doctors/', newDoctor);
      await refetchDoctors();
      setNewDoctor({
        email: '',
        phoneNumber: '',
        password: '',
        firstName: '',
        lastName: '',
        medicalLicenseNumber: '',
        specialty: '',
        consultationFee: 0,
        isActive: true,
      });
    } catch (err: unknown) {
      let msg = 'Failed to create doctor';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoctor = async (doctorId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/doctors/${doctorId}`, updateDoctor);
      await refetchDoctors();
      setSelectedDoctorId(null);
      setUpdateDoctor({});
    } catch (err: unknown) {
      let msg = 'Failed to update doctor';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (doctorId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/doctors/${doctorId}/status`, updateStatus);
      await refetchDoctors();
      setSelectedDoctorId(null);
      setUpdateStatus({ isActive: true });
    } catch (err: unknown) {
      let msg = 'Failed to update status';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/doctors/${doctorId}`);
      await refetchDoctors();
    } catch (err: unknown) {
      let msg = 'Failed to delete doctor';
      if (typeof err === 'string') msg = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
      } else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <T,>(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    setState: React.Dispatch<React.SetStateAction<T>>,
    state: T
  ) => {
    const { name, value } = e.target;
    let processed: string | number | boolean = value;
    if (name === 'isActive') processed = value === 'true';
    else if (name === 'consultationFee') processed = parseFloat(value) || 0;
    setState({ ...state, [name]: processed });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage.toString() });
  };

  const getDoctorName = (d: Doctor) =>
    d.user?.profile ? `${d.user.profile.firstName} ${d.user.profile.lastName}` : `${d.firstName} ${d.lastName}`;
  const getDoctorEmail = (d: Doctor) => d.user?.email || d.email;
  const getDoctorPhone = (d: Doctor) => d.user?.phoneNumber || d.phoneNumber;

  // client-side search/sort
  const visibleDoctors = useMemo(() => {
    let list = [...doctors];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(d => {
        const base = `${getDoctorName(d)} ${d.specialty} ${d.medicalLicenseNumber} ${getDoctorEmail(d)} ${getDoctorPhone(d)}`.toLowerCase();
        return base.includes(q);
      });
    }

    switch (sortBy) {
      case 'name':
        list.sort((a, b) => getDoctorName(a).localeCompare(getDoctorName(b)));
        break;
      case 'specialty':
        list.sort((a, b) => (a.specialty || '').localeCompare(b.specialty || ''));
        break;
      case 'feeAsc':
        list.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
        break;
      case 'feeDesc':
        list.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
        break;
      case 'newest':
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
    }
    return list;
  }, [doctors, query, sortBy]);

  const exportCSV = () => {
    const rows = [
      ['Doctor ID', 'Name', 'Email', 'Phone', 'License', 'Specialty', 'Fee', 'Active', 'Created'],
      ...visibleDoctors.map(d => [
        d.doctorId,
        getDoctorName(d),
        getDoctorEmail(d),
        getDoctorPhone(d),
        d.medicalLicenseNumber,
        d.specialty,
        d.consultationFee,
        d.isActive ? 'true' : 'false',
        new Date(d.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <Notice tone="info">Please log in to view the doctors page.</Notice>;
  }

  const initials = (f?: string, l?: string) => ((f?.[0] ?? '') + (l?.[0] ?? '') || 'D').toUpperCase();
  const selectedDoctor = selectedDoctorId ? doctors.find(x => x.doctorId === selectedDoctorId) : undefined;

  const createFields = [
    { label: 'First name', name: 'firstName', type: 'text' },
    { label: 'Last name', name: 'lastName', type: 'text' },
    { label: 'Email', name: 'email', type: 'email' },
    { label: 'Phone number', name: 'phoneNumber', type: 'text' },
    { label: 'Password', name: 'password', type: 'password' },
    { label: 'Medical license number', name: 'medicalLicenseNumber', type: 'text' },
    { label: 'Specialty', name: 'specialty', type: 'text' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description={
          <>
            Register doctors, update their details and control who can take consultations.
            {pagination?.total ? <> Total doctors: {pagination.total}.</> : null}
          </>
        }
        actions={
          <Button type="button" variant="outline" onClick={exportCSV}>
            <Download /> Export CSV
          </Button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      {/* Create Doctor */}
      <Section title="Create new doctor" description="Creates the user account and the doctor profile together.">
        <form onSubmit={handleCreateDoctor} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {createFields.map(f => (
            <div key={f.name} className="space-y-1.5">
              <label htmlFor={`nd-${f.name}`} className={LABEL}>{f.label}</label>
              <Input
                id={`nd-${f.name}`}
                type={f.type}
                name={f.name}
                value={newDoctor[f.name as keyof typeof newDoctor] as string}
                onChange={(e) => handleInputChange(e, setNewDoctor, newDoctor)}
                required
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label htmlFor="nd-fee" className={LABEL}>Consultation fee (RWF)</label>
            <Input
              id="nd-fee"
              type="number"
              name="consultationFee"
              value={newDoctor.consultationFee}
              onChange={(e) => handleInputChange(e, setNewDoctor, newDoctor)}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nd-active" className={LABEL}>Active status</label>
            <select
              id="nd-active"
              name="isActive"
              value={newDoctor.isActive.toString()}
              onChange={(e) => handleInputChange(e, setNewDoctor, newDoctor)}
              className={NATIVE_SELECT}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Creating…' : 'Create doctor'}
            </Button>
          </div>
        </form>
      </Section>

      {/* Table */}
      <Section flush title="All doctors" description={`${visibleDoctors.length} shown`}>
        {/* Toolbar */}
        <div className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, license, email, phone…"
              className="pl-9"
              aria-label="Search doctors"
            />
          </div>
          <Input
            name="specialty"
            value={filters.specialty}
            onChange={handleFilterChange}
            placeholder="Filter by specialty, e.g. Cardiology"
            aria-label="Filter by specialty"
          />
          <select
            name="isActive"
            value={filters.isActive}
            onChange={handleFilterChange}
            className={NATIVE_SELECT}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'name' | 'specialty' | 'feeAsc' | 'feeDesc')}
            className={NATIVE_SELECT}
            aria-label="Sort doctors"
          >
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="specialty">Specialty A–Z</option>
            <option value="feeAsc">Fee ↑</option>
            <option value="feeDesc">Fee ↓</option>
          </select>
        </div>

        {visibleDoctors.length > 0 ? (
          <>
            <DataTable>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Contact</th>
                  <th>License</th>
                  <th className="text-right">Fee</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDoctors.map((d) => (
                  <tr key={d.doctorId} className={d.doctorId === selectedDoctorId ? 'bg-brand-50/60' : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {initials(
                            d.user?.profile?.firstName ?? d.firstName,
                            d.user?.profile?.lastName ?? d.lastName
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="whitespace-nowrap font-medium text-slate-900">{getDoctorName(d)}</div>
                          <div className="font-mono text-xs text-muted-foreground" title={d.doctorId}>{d.doctorId.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{d.specialty}</td>
                    <td>
                      <div className="whitespace-nowrap text-slate-700">{getDoctorEmail(d)}</div>
                      <div className="text-xs text-muted-foreground">{getDoctorPhone(d)}</div>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">#{d.medicalLicenseNumber}</td>
                    <td className="whitespace-nowrap text-right tabular-nums text-slate-700">{formatRwf(d.consultationFee)}</td>
                    <td className="whitespace-nowrap"><StatusBadge value={d.isActive ? 'active' : 'inactive'} /></td>
                    <td className="whitespace-nowrap text-slate-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDoctorId(d.doctorId);
                            // The editor renders below the table; bring it into view.
                            setTimeout(() => document.getElementById('doctor-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                          }}
                        >
                          <Pencil /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDeleteDoctor(d.doctorId)}
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            {/* pagination */}
            {pagination && (
              <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} · Total: {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev || loading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext || loading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="px-5 py-3"><Loading label="Loading doctors…" /></div>
        ) : (
          <Empty icon={Stethoscope}>No doctors found.</Empty>
        )}
      </Section>

      {/* inline editor */}
      {selectedDoctor && (
        <div id="doctor-editor" className="grid scroll-mt-20 gap-6 lg:grid-cols-2">
          <Section
            title="Update doctor"
            description={getDoctorName(selectedDoctor)}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdateDoctor(selectedDoctor.doctorId); }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="ud-license" className={LABEL}>Medical license number</label>
                <Input
                  id="ud-license"
                  type="text"
                  name="medicalLicenseNumber"
                  value={updateDoctor.medicalLicenseNumber ?? selectedDoctor.medicalLicenseNumber}
                  onChange={(e) => handleInputChange(e, setUpdateDoctor, updateDoctor)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ud-specialty" className={LABEL}>Specialty</label>
                <Input
                  id="ud-specialty"
                  type="text"
                  name="specialty"
                  value={updateDoctor.specialty ?? selectedDoctor.specialty}
                  onChange={(e) => handleInputChange(e, setUpdateDoctor, updateDoctor)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ud-fee" className={LABEL}>Consultation fee (RWF)</label>
                <Input
                  id="ud-fee"
                  type="number"
                  name="consultationFee"
                  value={updateDoctor.consultationFee ?? selectedDoctor.consultationFee}
                  onChange={(e) => handleInputChange(e, setUpdateDoctor, updateDoctor)}
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ud-active" className={LABEL}>Active status</label>
                <select
                  id="ud-active"
                  name="isActive"
                  value={(updateDoctor.isActive ?? selectedDoctor.isActive).toString()}
                  onChange={(e) => handleInputChange(e, setUpdateDoctor, updateDoctor)}
                  className={NATIVE_SELECT}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating…' : 'Update'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedDoctorId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Update status" description="Deactivated doctors cannot take new appointments.">
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdateStatus(selectedDoctor.doctorId); }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="us-active" className={LABEL}>Status</label>
                <select
                  id="us-active"
                  name="isActive"
                  value={updateStatus.isActive.toString()}
                  onChange={(e) => handleInputChange(e, setUpdateStatus, updateStatus)}
                  className={NATIVE_SELECT}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="us-reason" className={LABEL}>Reason (if inactive)</label>
                <Input
                  id="us-reason"
                  type="text"
                  name="reason"
                  value={updateStatus.reason || ''}
                  onChange={(e) => handleInputChange(e, setUpdateStatus, updateStatus)}
                  placeholder="Optional reason"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating…' : 'Update status'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedDoctorId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Section>
        </div>
      )}
    </div>
  );
}
