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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {type === 'register' && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">I am joining as</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'patient', title: 'Patient', text: 'I want care for myself' },
                { value: 'sponsor', title: 'Sponsor', text: 'I pay for a relative' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="cursor-pointer rounded-xl border border-input bg-white p-3 transition hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-500/20"
                >
                  <input type="radio" value={option.value} {...register('userType')} className="sr-only" />
                  <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                  <span className="block text-xs text-slate-500">{option.text}</span>
                </label>
              ))}
            </div>
            {errors.userType && <p className="mt-1.5 text-xs text-rose-600">{(errors.userType as any).message}</p>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="First name" name="firstName" type="text" autoComplete="given-name" register={register} error={errors.firstName as any} required />
            <InputField label="Last name" name="lastName" type="text" autoComplete="family-name" register={register} error={errors.lastName as any} required />
          </div>

          <InputField label="Phone number" name="phoneNumber" type="tel" autoComplete="tel" placeholder="+2507XXXXXXXX" register={register} error={errors.phoneNumber as any} required />
        </>
      )}

      <InputField label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" register={register} error={errors.email as any} required />

      <InputField
        label="Password"
        name="password"
        type="password"
        autoComplete={type === 'login' ? 'current-password' : 'new-password'}
        register={register}
        error={errors.password as any}
        required
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : null}
        {loading ? 'Please wait…' : type === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}
