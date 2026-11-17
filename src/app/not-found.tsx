import Link from 'next/link';
import { Home, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-raised)] sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>

        <p className="mt-8 text-7xl font-semibold tracking-tight text-brand-600 tabular-nums sm:text-8xl">404</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or has moved. Check the address, or go back to a page you know.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="size-4" />
              Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          Need help?{' '}
          <a href="mailto:support@isanomed.org" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
            <Mail className="size-3.5" />
            support@isanomed.org
          </a>
        </p>
      </div>
    </main>
  );
}
