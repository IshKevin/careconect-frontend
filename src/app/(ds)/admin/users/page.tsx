'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataTable, Empty, Loading, Notice, PageHeader, Section, StatusBadge } from "@/components/dashboard/common";

import { Users, Search, RefreshCcw, Download, Check, X } from "lucide-react";

interface User {
  userId: string;
  email: string;
  phoneNumber: string;
  userType: 'patient' | 'admin' | 'doctor';
  accountStatus: 'active' | 'inactive' | 'pending';
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  profile: { firstName: string; lastName: string; };
}

interface ApiResponse {
  users: User[];
  pagination: {
    page: number; limit: number; total: string; pages: number; hasNext: boolean; hasPrev: boolean;
  };
}

interface NewUser {
  email: string; phoneNumber: string; userType: 'patient' | 'admin' | 'doctor';
  firstName: string; lastName: string; password: string;
}

export default function UsersPage() {
  const { user } = useAuthHooks();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<NewUser>({
    email: '', phoneNumber: '', userType: 'patient', firstName: '', lastName: '', password: '',
  });

  // UI-only state (client-side, no backend changes)
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['userType']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | User['accountStatus']>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'type'>('newest');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      setLoading(true); setError(null);
      try {
        const response = await api.get('/admin/users');
        if (response.data && response.data.users) {
          setUsers(response.data.users);
          setPagination(response.data.pagination);
        } else {
          console.error('Unexpected API response structure:', response.data);
          setError('Unexpected response format from server');
        }
      } catch (err: unknown) {
        console.error('Fetch users error:', err);
        let errorMessage = 'Failed to fetch users';
        if (typeof err === 'string') errorMessage = err;
        else if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) errorMessage = axiosErr.response.data.message;
        } else if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post('/admin/users', {
        ...newUser,
        profile: { firstName: newUser.firstName, lastName: newUser.lastName },
      });
      const response = await api.get('/admin/users');
      if (response.data && response.data.users) {
        setUsers(response.data.users); setPagination(response.data.pagination);
      }
      setNewUser({ email: '', phoneNumber: '', userType: 'patient', firstName: '', lastName: '', password: '' });
    } catch (err: unknown) {
      console.error('Create user error:', err);
      let errorMessage = 'Failed to create user';
      if (typeof err === 'string') errorMessage = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) errorMessage = axiosErr.response.data.message;
      } else if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally { setLoading(false); }
  };

  const handleInputChange = (name: keyof NewUser, value: string) => {
    setNewUser({ ...newUser, [name]: value });
  };

  // client-side derive list
  const filteredUsers = useMemo(() => {
    let list = [...users];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter(u => {
        const full = `${u.profile?.firstName ?? ''} ${u.profile?.lastName ?? ''}`.toLowerCase();
        return full.includes(q) || (u.email ?? '').toLowerCase().includes(q) || (u.phoneNumber ?? '').toLowerCase().includes(q);
      });
    }
    if (roleFilter !== 'all') list = list.filter(u => u.userType === roleFilter);
    if (statusFilter !== 'all') list = list.filter(u => u.accountStatus === statusFilter);

    switch (sortBy) {
      case 'newest': list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case 'oldest': list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)); break;
      case 'name':
        list.sort((a, b) => `${a.profile?.firstName} ${a.profile?.lastName}`.localeCompare(`${b.profile?.firstName} ${b.profile?.lastName}`));
        break;
      case 'type': list.sort((a, b) => a.userType.localeCompare(b.userType)); break;
    }
    return list;
  }, [users, query, roleFilter, statusFilter, sortBy]);

  if (!user) return <Notice tone="info">Please log in to view the users page.</Notice>;

  const initials = (f?: string, l?: string) => ((f?.[0] ?? '') + (l?.[0] ?? '') || 'U').toUpperCase();

  const exportCSV = () => {
    const rows = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Type', 'Status', 'Email Verified', 'Phone Verified', 'Created', 'Last Login'],
      ...filteredUsers.map(u => [
        u.profile?.firstName, u.profile?.lastName, u.email, u.phoneNumber, u.userType, u.accountStatus,
        u.emailVerified ? 'Yes' : 'No', u.phoneVerified ? 'Yes' : 'No',
        new Date(u.createdAt).toISOString(), u.lastLogin ? new Date(u.lastLogin).toISOString() : '',
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/users');
      if (r?.data?.users) { setUsers(r.data.users); setPagination(r.data.pagination); }
    } finally { setLoading(false); }
  };

  const resetFilters = () => { setQuery(''); setRoleFilter('all'); setStatusFilter('all'); };
  const hasFilters = roleFilter !== 'all' || statusFilter !== 'all' || !!query;

  const VerifiedPill = ({ ok, label }: { ok: boolean | null; label: string }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ok ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-500 ring-slate-500/20'}`}
    >
      {ok ? <Check className="size-3" /> : <X className="size-3" />}
      {label}
    </span>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={
          <>
            Create accounts and review every user on the platform.
            {pagination?.total ? <> Total records: {pagination.total}.</> : null}
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCcw className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
            <Button type="button" variant="outline" onClick={exportCSV}>
              <Download /> Export CSV
            </Button>
          </>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      {/* Create User */}
      <Section title="Create new user" description="The account is created immediately with the password you set.">
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="nu-first" className="text-slate-700">First name</Label>
            <Input id="nu-first" placeholder="First name" value={newUser.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-last" className="text-slate-700">Last name</Label>
            <Input id="nu-last" placeholder="Last name" value={newUser.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-email" className="text-slate-700">Email</Label>
            <Input id="nu-email" placeholder="name@example.com" type="email" value={newUser.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-phone" className="text-slate-700">Phone number</Label>
            <Input id="nu-phone" placeholder="+250…" value={newUser.phoneNumber} onChange={(e) => handleInputChange("phoneNumber", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-type" className="text-slate-700">User type</Label>
            <Select value={newUser.userType} onValueChange={(val) => handleInputChange("userType", val)}>
              <SelectTrigger id="nu-type" className="w-full">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-password" className="text-slate-700">Password</Label>
            <Input id="nu-password" placeholder="Password" type="password" value={newUser.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
          </div>
          <div className="flex justify-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </Section>

      {/* Users Table */}
      <Section
        flush
        title="User list"
        description={`Showing ${filteredUsers.length} users${pagination?.total ? ` · server total ${pagination.total}` : ''}`}
      >
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="pl-9"
              aria-label="Search users"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as User['userType'] | 'all')}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter by role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as User['accountStatus'] | 'all')}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest' | 'name' | 'type')}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Sort users">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="type">Role A–Z</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button type="button" variant="ghost" onClick={resetFilters} className="w-full sm:w-auto">
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading && !users.length ? (
          <div className="px-5 py-3"><Loading /></div>
        ) : filteredUsers.length > 0 ? (
          <DataTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Last login</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.userId}>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {initials(u.profile?.firstName, u.profile?.lastName)}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {u.profile?.firstName} {u.profile?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">ID: {u.userId.slice(0, 8)}…</span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{u.email}</td>
                    <td className="whitespace-nowrap text-slate-700">{u.phoneNumber}</td>
                    <td className="capitalize text-slate-700">{u.userType}</td>
                    <td><StatusBadge value={u.accountStatus} /></td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <VerifiedPill ok={u.emailVerified} label="Email" />
                        <VerifiedPill ok={u.phoneVerified} label="Phone" />
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap text-slate-600">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
        ) : (
          <Empty
            icon={Users}
            action={<Button variant="outline" size="sm" onClick={resetFilters}>Reset filters</Button>}
          >
            No users match your filters.
          </Empty>
        )}
      </Section>
    </div>
  );
}
