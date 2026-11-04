/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputField } from './InputField';
import { useAuthHooks } from '../../hooks/useAuth';
import { LoginCredentials, RegisterCredentials } from '../../types/auth';
import React from 'react';

interface AuthFormProps {
  type: 'login' | 'register';
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?\d+$/, 'Invalid phone number'),
  userType: z.enum(['patient', 'sponsor']),
});

export function AuthForm({ type }: AuthFormProps) {
  const BRAND = '#C4E1E1';

  const { handleAuth, loading, error } = useAuthHooks();
  const schema = type === 'login' ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials | RegisterCredentials>({
    resolver: zodResolver(schema),
    defaultValues: type === 'register' ? { userType: 'patient' } : {},
  });

  const onSubmit = (data: LoginCredentials | RegisterCredentials) => {
    handleAuth(data, type);
  };

  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur"
      style={{ ['--brand' as any]: BRAND } as React.CSSProperties}
    >
      {/* header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-lg"
          style={{ background: 'var(--brand)' }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-black/70">
            <path
              d="M3 12h3l2-4 3 8 2-5h6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {type === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-xs text-gray-600">
            {type === 'login'
              ? 'Use your credentials to sign in.'
              : 'Fill in your details to register.'}
          </p>
        </div>
      </div>

      {/* subtle divider */}
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {type === 'register' && (
          <>
            {/* put names side-by-side on larger screens (visual only) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="First Name"
                name="firstName"
                type="text"
                register={register}
                error={errors.firstName as any}
                required
              />
              <InputField
                label="Last Name"
                name="lastName"
                type="text"
                register={register}
                error={errors.lastName as any}
                required
              />
            </div>

            <InputField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              register={register}
              error={errors.phoneNumber as any}
              required
            />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">I am registering as</legend>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" value="patient" {...register('userType')} /> A patient receiving care
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" value="sponsor" {...register('userType')} /> A sponsor paying for a relative&apos;s care
              </label>
              {errors.userType && <p className="text-sm text-red-600">{(errors.userType as any).message}</p>}
            </fieldset>
          </>
        )}

        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email as any}
          required
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password as any}
          required
        />

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={[
            'mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium',
            'text-gray-900 ring-1 transition focus:outline-none focus-visible:ring-2',
            'bg-[var(--brand)]/70 ring-[var(--brand)]/60 hover:bg-[var(--brand)]/90',
            'disabled:cursor-not-allowed disabled:opacity-60',
          ].join(' ')}
        >
          {loading ? 'Loading...' : type === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  );
}
