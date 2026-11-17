import { FieldError, UseFormRegister } from 'react-hook-form';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export function InputField({ label, name, type, register, error, required, placeholder, autoComplete }: InputFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          id={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...register(name, { required: required ? `${label} is required` : false })}
          className={cn(
            'block h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:outline-none focus:ring-4',
            error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15' : 'border-input focus:border-ring focus:ring-ring/15',
            isPassword && 'pr-11',
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-rose-600">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
