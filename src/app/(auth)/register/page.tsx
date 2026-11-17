import Link from 'next/link';
import { RegisterForm } from '@/components/Auth/RegisterForm';
import { AuthShell } from '@/components/Auth/AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already registered?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
      footer={
        <p className="text-center text-xs text-slate-500">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-slate-700">Terms</Link> and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-700">Privacy Policy</Link>.
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
