import Link from 'next/link';
import { AuthForm } from '@/components/Auth/AuthForm';
import { AuthShell } from '@/components/Auth/AuthShell';
import { DemoAccounts } from '@/components/Auth/DemoAccounts';

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New to IsanoMed?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
      footer={<DemoAccounts />}
    >
      <AuthForm type="login" />
      <div className="mt-4 text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
          Forgot your password?
        </Link>
      </div>
    </AuthShell>
  );
}
