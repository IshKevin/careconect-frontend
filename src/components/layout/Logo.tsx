import Link from 'next/link';
import { cn } from '@/lib/utils';

// The IsanoMed mark: a heartbeat line in a teal tile. Used in the shell, the landing page and the auth pages.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm ring-1 ring-brand-700/20',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5">
        <path d="M3 12h3l2-4 3 8 2-5h2l1.5 1H21" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ href = '/', className, subtitle }: { href?: string; className?: string; subtitle?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="text-[17px] font-semibold tracking-tight text-slate-900">
          Isano<span className="text-brand-600">Med</span>
        </span>
        {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
