'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthHooks } from '@/hooks/useAuth';
import { JSX, useMemo } from 'react';

type NavLink = { name: string; href: string; icon: JSX.Element };

export default function Sidebar() {
  const { user } = useAuthHooks();
  const pathname = usePathname();

  // brand color (can move to env/config if you want)
  const BRAND = '#C4E1E1';

  const baseLinks = useMemo(() => {
    if (user?.userType === 'patient') {
      return [
        { name: 'Dashboard', href: '/patient' },
        { name: 'Appointments', href: '/patient/appointments' },
        { name: 'Messages', href: '/patient/messages' },
        { name: 'Medical History', href: '/patient/medical-history' },
        { name: 'Allergies', href: '/patient/allergies' },
        { name: 'Medications', href: '/patient/medications' },
        { name: 'Preferences', href: '/patient/preferences' },
        { name: 'Sponsors', href: '/patient/sponsors' },
        { name: 'Invoices', href: '/patient/invoices' },
        { name: 'Profile', href: '/patient/profile' },
        { name: 'Search Doctors', href: '/patient/search/doctors' },
      ];
    }
    if (user?.userType === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Doctors', href: '/admin/doctors' },
        { name: 'Reports', href: '/admin/reports' },
        { name: 'Facilities', href: '/admin/facilities' },
        { name: 'Refunds', href: '/admin/refunds' },
        { name: 'Reconciliation', href: '/admin/reconciliation' },
        { name: 'Appointments', href: '/admin/appointments' },
        { name: 'Audit Logs', href: '/admin/audit-logs' },
        { name: 'Settings', href: '/admin/settings' },
        { name: 'Profile', href: '/admin/profile' },
      ];
    }
    if (user?.userType === 'sponsor') {
      return [
        { name: 'Dashboard', href: '/sponsor' },
        { name: 'Patient Links', href: '/sponsor/links' },
      ];
    }
    if (user?.userType === 'doctor') {
      return [
        { name: 'Dashboard', href: '/doctor' },
        { name: 'Schedule', href: '/doctor/schedule' },
        { name: 'Patients', href: '/doctor/patients' },
        { name: 'Appointments', href: '/doctor/appointments' },
        { name: 'Consultations', href: '/doctor/consultations' },
        { name: 'Invoices', href: '/doctor/invoices' },
        { name: 'Profile', href: '/doctor/profile' },
        { name: 'Search Patients', href: '/doctor/search/patients' },
      ];
    }
    return [];
  }, [user?.userType]);

  // attach icons without changing hrefs or names
  const navLinks: NavLink[] = useMemo(
    () =>
      baseLinks.map((l) => ({
        ...l,
        icon: getIcon(l.name),
      })),
    [baseLinks]
  );

  return (
    <aside
      className="sticky top-0 h-dvh w-72 shrink-0 border-r bg-white/80 backdrop-blur-xl"
      style={
        {
          '--brand': BRAND,
        } as React.CSSProperties
      }
    >
      {/* header */}
      <div
        className="relative px-5 pb-4 pt-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(196,225,225,0.45) 0%, rgba(196,225,225,0.12) 60%, rgba(196,225,225,0) 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-black/5 shadow-sm"
            style={{ background: 'var(--brand)' }}
            aria-hidden
          >
            {/* heartbeat logo */}
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-black/70">
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
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Nexus Care
            </h2>
            <span className="text-xs text-gray-500">
              {user?.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'Welcome'}
            </span>
          </div>
        </div>

        {/* subtle divider */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>

      {/* nav */}
      <nav className="px-3 py-2">
        <ul className="space-y-1.5">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  className={[
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition-all',
                    active
                      ? 'bg-[var(--brand)]/30 ring-[var(--brand)]/50 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                      : 'bg-white/60 hover:bg-[var(--brand)]/15 ring-black/5',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-9 w-9 place-items-center rounded-lg ring-1 transition-all',
                      active
                        ? 'bg-[var(--brand)] text-gray-900 ring-[var(--brand)]/60'
                        : 'bg-white text-gray-700 ring-black/5 group-hover:bg-[var(--brand)]/40',
                    ].join(' ')}
                    aria-hidden
                  >
                    {link.icon}
                  </span>

                  <span
                    className={[
                      'text-sm font-medium tracking-tight',
                      active ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900',
                    ].join(' ')}
                  >
                    {link.name}
                  </span>

                  {/* right arrow appears on hover */}
                  <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-500">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  {/* active indicator bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 hidden h-7 w-1 -translate-y-1/2 rounded-r-full md:block"
                      style={{ background: 'var(--brand)' }}
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* footer tag */}
      <div className="mt-auto px-5 py-4">
        <div className="rounded-xl border border-black/5 bg-white/70 p-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--brand)' }}
              aria-hidden
            />

          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- icons (inline SVG so no dependencies) ---------- */
function getIcon(name: string): JSX.Element {
  const base = 'h-5 w-5';
  switch (name) {
    case 'Dashboard':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" fill="currentColor" />
        </svg>
      );
    case 'Appointments':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M7 2v3M17 2v3M3 9h18M5 7h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Messages':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Medical History':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M6 2h9l3 3v15a2 2 0 0 1-2 2H6z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Allergies':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="9" r="2" fill="currentColor" />
        </svg>
      );
    case 'Medications':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M13 7h8M17 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Preferences':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4h2M2 12h2M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Invoices':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M6 2h9l3 3v15a2 2 0 0 1-2 2H6z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 10h8M8 14h8M8 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Profile':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Search Doctors':
    case 'Search Patients':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Users':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Doctors':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M5 21a7 7 0 0 1 14 0M12 10v5M9.5 12.5h5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Reports':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 14l2 2 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Audit Logs':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'Settings':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-3a7 7 0 0 1-.3 2l2.2 1.7-2 3.4-2.6-1a7 7 0 0 1-1.7 1l-.4 2.7h-4l-.4-2.7a7 7 0 0 1-1.7-1l-2.6 1-2-3.4 2.2-1.7A7 7 0 0 1 5 12a7 7 0 0 1 .3-2L3.1 8.3l2-3.4 2.6 1a7 7 0 0 1 1.7-1L9.8 2h4l.4 2.7a7 7 0 0 1 1.7 1l2.6-1 2 3.4-2.2 1.7c.2.6.3 1.3.3 2z" fill="currentColor" />
        </svg>
      );
    case 'Schedule':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Patients':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 9a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Consultations':
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M4 5h16v10H7l-3 3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={base}>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
  }
}
