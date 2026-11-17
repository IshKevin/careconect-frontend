'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { useAppConfig } from '@/hooks/useAppConfig';
import { NAV, activeItem } from './nav';

const ROLE_LABEL: Record<string, string> = {
  patient: 'Patient portal',
  doctor: 'Doctor workspace',
  sponsor: 'Sponsor portal',
  admin: 'Administration',
  super_admin: 'Administration',
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuthHooks();
  const pathname = usePathname();
  const role = user?.userType === 'super_admin' ? 'admin' : user?.userType ?? '';
  const groups = NAV[role] ?? [];
  const current = activeItem(groups, pathname);

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {groups.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label ? (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = current?.href === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')} />
                    <span className="truncate">{item.name}</span>
                    {active ? <span className="ml-auto size-1.5 rounded-full bg-brand-500" aria-hidden /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { supportEmail } = useAppConfig();
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="rounded-xl bg-gradient-to-br from-brand-50 to-white p-3 ring-1 ring-brand-100">
        <p className="text-xs font-semibold text-brand-800">Need help?</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Write to{' '}
          <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700 hover:underline">
            {supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}

/** Desktop: fixed column. Mobile: slide-in drawer controlled by the dashboard layout. */
export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { user } = useAuthHooks();
  const pathname = usePathname();
  const subtitle = ROLE_LABEL[user?.userType ?? ''] ?? 'Welcome';

  // Close the drawer when the route changes.
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo href={`/${user?.userType === 'super_admin' ? 'admin' : user?.userType ?? ''}`} subtitle={subtitle} />
        </div>
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
        <div
          className={cn('absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity', open ? 'opacity-100' : 'opacity-0')}
          onClick={onClose}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl transition-transform duration-200',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
            <Logo subtitle={subtitle} />
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
          <NavList onNavigate={onClose} />
          <SidebarFooter />
        </aside>
      </div>
    </>
  );
}
