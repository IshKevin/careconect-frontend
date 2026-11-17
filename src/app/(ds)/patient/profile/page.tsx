'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Button } from '@/components/ui/Button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { Loading, Notice, PageHeader, Section, StatusBadge, formatDate } from '@/components/dashboard/common';

interface Profile {
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
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  };
}

interface UpdateProfile {
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  };
  phoneNumber?: string;
}

export default function ProfilePage() {
  const { user } = useAuthHooks();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [updateData, setUpdateData] = useState<UpdateProfile>({
    profile: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      address: '',
    },
    phoneNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/users/profile');
        let fetchedProfile: Profile | null = null;

        if (response.data) {
          if (response.data.data) {
            fetchedProfile = response.data.data;
          } else if (response.data.userId || response.data.email) {
            fetchedProfile = response.data;
          }
        }

        if (fetchedProfile && fetchedProfile.profile) {
          setProfile(fetchedProfile);
          setUpdateData({
            profile: {
              firstName: fetchedProfile.profile.firstName || '',
              lastName: fetchedProfile.profile.lastName || '',
              dateOfBirth: fetchedProfile.profile.dateOfBirth || '',
              gender: fetchedProfile.profile.gender || '',
              address: fetchedProfile.profile.address || '',
            },
            phoneNumber: fetchedProfile.phoneNumber || '',
          });
        } else if (fetchedProfile) {
          setProfile(fetchedProfile);
          setUpdateData(prev => ({
            ...prev,
            phoneNumber: fetchedProfile.phoneNumber || '',
          }));
          setError('Profile details are missing.');
        } else {
          setError('Invalid profile data received');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch profile';
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

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.put('/users/profile', updateData);
      let updatedProfile: Profile | null = null;

      if (response.data) {
        if (response.data.data) {
          updatedProfile = response.data.data;
        } else if (response.data.userId || response.data.email) {
          updatedProfile = response.data;
        }
      }

      if (updatedProfile) {
        setProfile(updatedProfile);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to update profile';
      if (typeof err === 'string') errorMessage = err;
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) errorMessage = axiosErr.response.data.message;
      } else if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      setUpdateData({ ...updateData, phoneNumber: value });
    } else {
      setUpdateData({
        ...updateData,
        profile: {
          ...updateData.profile,
          [name]: value,
        },
      });
    }
  };

  const handleCancelEdit = () => {
    if (profile && profile.profile) {
      setUpdateData({
        profile: {
          firstName: profile.profile.firstName || '',
          lastName: profile.profile.lastName || '',
          dateOfBirth: profile.profile.dateOfBirth || '',
          gender: profile.profile.gender || '',
          address: profile.profile.address || '',
        },
        phoneNumber: profile.phoneNumber || '',
      });
    } else if (profile) {
      setUpdateData(prev => ({
        ...prev,
        phoneNumber: profile.phoneNumber || '',
      }));
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const initials = useMemo(() => {
    const f = profile?.profile?.firstName?.[0] ?? '';
    const l = profile?.profile?.lastName?.[0] ?? '';
    return (f + l || 'U').toUpperCase();
  }, [profile]);

  if (!user) {
    return <Notice>Please log in to view your profile.</Notice>;
  }

  const fullName = [profile?.profile?.firstName, profile?.profile?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal and contact details."
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)} disabled={!profile}>
              <Pencil /> Edit profile
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" form="profile-edit-form" disabled={updating}>
                {updating ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          )
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      {loading && !profile ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <Loading label="Loading profile…" rows={4} />
        </div>
      ) : null}

      {profile && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl font-semibold text-brand-700" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-900">{fullName || 'Your profile'}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">{profile.userType}</span>
            <StatusBadge value={profile.accountStatus} />
          </div>
        </div>
      )}

      {profile && !isEditing ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Personal information">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="First name" value={profile.profile?.firstName} />
              <Info label="Last name" value={profile.profile?.lastName} />
              <Info
                label="Date of birth"
                value={profile.profile?.dateOfBirth ? formatDate(profile.profile.dateOfBirth) : null}
              />
              <Info label="Gender" value={profile.profile?.gender} capitalize />
              <div className="sm:col-span-2">
                <Info label="Address" value={profile.profile?.address} />
              </div>
            </dl>
          </Section>

          <Section title="Contact and account">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Email" value={profile.email} badge={profile.emailVerified} />
              <Info label="Phone number" value={profile.phoneNumber} badge={profile.phoneVerified} />
              <Info label="Member since" value={formatDate(profile.createdAt)} />
              <Info label="Last login" value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'} />
            </dl>
          </Section>
        </div>
      ) : profile && isEditing ? (
        <form id="profile-edit-form" onSubmit={handleUpdateProfile} className="space-y-6">
          <Section title="Edit profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <UiInput name="firstName" value={updateData.profile.firstName} onChange={handleInputChange} required />
              </Field>
              <Field label="Last name">
                <UiInput name="lastName" value={updateData.profile.lastName} onChange={handleInputChange} required />
              </Field>
              <Field label="Date of birth">
                <UiInput type="date" name="dateOfBirth" value={updateData.profile.dateOfBirth} onChange={handleInputChange} />
              </Field>
              <Field label="Gender">
                <select
                  name="gender"
                  value={updateData.profile.gender}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm capitalize shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
                >
                  <option value="">Select</option>
                  {['male', 'female', 'other'].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Phone number">
                <UiInput type="tel" name="phoneNumber" value={updateData.phoneNumber} onChange={handleInputChange} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <UiTextarea name="address" value={updateData.profile.address} onChange={handleInputChange} rows={3} />
                </Field>
              </div>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Updating…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/* ---------- UI atoms ---------- */

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="grid gap-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

const Info = ({ label, value, badge, capitalize }: { label: string; value?: string | null; badge?: boolean | null; capitalize?: boolean }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className={`mt-1 break-words text-sm font-medium ${value ? 'text-slate-900' : 'text-slate-400'} ${capitalize ? 'capitalize' : ''}`}>
      {value || 'Not provided'}
    </dd>
    {badge !== undefined && (
      <dd className="mt-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            : 'bg-amber-50 text-amber-700 ring-amber-600/20'
            }`}
        >
          <span className={`size-1.5 rounded-full ${badge ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden />
          {badge ? 'Verified' : 'Not verified'}
        </span>
      </dd>
    )}
  </div>
);
