'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loading, Notice, PageHeader, Section, StatusBadge } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';

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
    specialty?: string;
    bio?: string;
    consultationFee?: number;
  };
  medicalLicenseNumber?: string;
}

interface UpdateProfile {
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    specialty?: string;
    bio?: string;
    consultationFee?: number;
  };
  phoneNumber?: string;
  medicalLicenseNumber?: string;
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
          // Fill every field the edit form shows (the form used to open with date of birth, gender,
          // address and phone empty, so saving without touching them cleared them).
          setUpdateData({
            profile: {
              firstName: fetchedProfile.profile.firstName || '',
              lastName: fetchedProfile.profile.lastName || '',
              dateOfBirth: (fetchedProfile.profile.dateOfBirth || '').slice(0, 10),
              gender: fetchedProfile.profile.gender || '',
              address: fetchedProfile.profile.address || '',
              specialty: fetchedProfile.profile.specialty || '',
              bio: fetchedProfile.profile.bio || '',
              consultationFee: fetchedProfile.profile.consultationFee ?? 0,
            },
            phoneNumber: fetchedProfile.phoneNumber || '',
            medicalLicenseNumber: fetchedProfile.medicalLicenseNumber || '',
          });
        } else if (fetchedProfile) {
          // Profile exists but nested profile object is missing
          setProfile(fetchedProfile);
          setUpdateData(prev => ({
            ...prev,
            medicalLicenseNumber: fetchedProfile.medicalLicenseNumber || '',
          }));
          setError('Profile details are missing.');
        } else {
          setError('Invalid profile data received');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch profile';
        const errorData = err as { response?: { data?: { message?: string } }; message?: string };
        if (typeof err === 'string') errorMessage = err;
        else if (errorData?.response?.data?.message) errorMessage = errorData.response.data.message;
        else if (errorData?.message) errorMessage = errorData.message;
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
      const errorData = err as { response?: { data?: { message?: string } }; message?: string };
      if (typeof err === 'string') errorMessage = err;
      else if (errorData?.response?.data?.message) errorMessage = errorData.response.data.message;
      else if (errorData?.message) errorMessage = errorData.message;
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
    } else if (name === 'medicalLicenseNumber') {
      setUpdateData({ ...updateData, medicalLicenseNumber: value });
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
    if (profile) {
      setUpdateData({
        profile: {
          firstName: profile.profile?.firstName || '',
          lastName: profile.profile?.lastName || '',
          dateOfBirth: (profile.profile?.dateOfBirth || '').slice(0, 10),
          gender: profile.profile?.gender || '',
          address: profile.profile?.address || '',
          specialty: profile.profile?.specialty || '',
          bio: profile.profile?.bio || '',
          consultationFee: profile.profile?.consultationFee ?? 0,
        },
        phoneNumber: profile.phoneNumber || '',
        medicalLicenseNumber: profile.medicalLicenseNumber || '',
      });
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
    return <Notice tone="info">Please log in to view your profile.</Notice>;
  }

  const name = `${profile?.profile?.firstName ?? user.profile?.firstName ?? ''} ${profile?.profile?.lastName ?? user.profile?.lastName ?? ''}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal details and account information."
        actions={
          !profile ? null : !isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil /> Edit profile
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button type="submit" form="profile-edit-form" disabled={updating}>
                {updating ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          )
        }
      />

      {loading ? <Loading rows={3} label="Loading profile…" /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      {profile ? (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-semibold text-brand-700 ring-1 ring-brand-100" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-900">
              {profile.userType === 'doctor' ? 'Dr. ' : ''}{name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {profile.userType === 'doctor' ? profile.profile?.specialty || 'No specialty set' : profile.email}
            </p>
          </div>
          <StatusBadge value={profile.accountStatus} className="hidden sm:inline-flex" />
        </div>
      ) : null}

      {profile && !isEditing ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Personal information">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="First name" value={profile.profile?.firstName} />
              <Info label="Last name" value={profile.profile?.lastName} />
              <Info
                label="Date of birth"
                value={profile.profile?.dateOfBirth ? new Date(profile.profile.dateOfBirth).toLocaleDateString() : null}
              />
              <Info label="Gender" value={profile.profile?.gender} />
              <div className="sm:col-span-2">
                <Info label="Address" value={profile.profile?.address} />
              </div>
            </dl>
          </Section>

          <Section title="Contact & account">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Email" value={profile.email} badge={profile.emailVerified} />
              <Info label="Phone number" value={profile.phoneNumber} badge={profile.phoneVerified} />
              <Info label="User type" value={profile.userType} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Account status</dt>
                <dd className="mt-1"><StatusBadge value={profile.accountStatus} /></dd>
              </div>
            </dl>
          </Section>

          <Section title="Security & activity" className="lg:col-span-2">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Member since" value={new Date(profile.createdAt).toLocaleDateString()} />
              <Info label="Last login" value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'} />
            </dl>
          </Section>
        </div>
      ) : profile && isEditing ? (
        <form id="profile-edit-form" onSubmit={handleUpdateProfile} className="space-y-6">
          <Section title="Edit profile" description="Changes are saved to your account when you press Save changes.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First name" htmlFor="firstName">
                <Input id="firstName" name="firstName" value={updateData.profile.firstName} onChange={handleInputChange} required />
              </Field>
              <Field label="Last name" htmlFor="lastName">
                <Input id="lastName" name="lastName" value={updateData.profile.lastName} onChange={handleInputChange} required />
              </Field>
              <Field label="Date of birth" htmlFor="dateOfBirth">
                <Input id="dateOfBirth" type="date" name="dateOfBirth" value={updateData.profile.dateOfBirth} onChange={handleInputChange} />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <select id="gender" name="gender" value={updateData.profile.gender} onChange={handleInputChange} className={selectClass}>
                  <option value="">Select</option>
                  {['male', 'female', 'other'].map((opt) => (
                    <option key={opt} value={opt} className="capitalize">{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Phone number" htmlFor="phoneNumber">
                <Input id="phoneNumber" type="tel" name="phoneNumber" value={updateData.phoneNumber} onChange={handleInputChange} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address" htmlFor="address">
                  <Textarea id="address" name="address" value={updateData.profile.address} onChange={handleInputChange} rows={3} />
                </Field>
              </div>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            <Button type="submit" disabled={updating}>{updating ? 'Updating…' : 'Save changes'}</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const selectClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm capitalize shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20';

const Field = ({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

const Info = ({ label, value, badge }: { label: string; value?: string | null; badge?: boolean | null }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-[15px] font-medium text-slate-900">{value || 'Not provided'}</dd>
    {badge !== undefined ? (
      <span
        className={cn(
          'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
          badge ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20',
        )}
      >
        <span className={cn('size-1.5 rounded-full', badge ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden />
        {badge ? 'Verified' : 'Not verified'}
      </span>
    ) : null}
  </div>
);
