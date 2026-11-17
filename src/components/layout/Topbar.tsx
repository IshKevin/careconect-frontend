'use client';

import { useAuthHooks } from '@/hooks/useAuth';
import { useMemo } from 'react';

export default function Topbar() {
  const { user, handleLogout } = useAuthHooks();

  const BRAND = '#C4E1E1';
  const initials = useMemo(() => {
    const f = user?.profile?.firstName?.[0] ?? '';
    const l = user?.profile?.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '🙂';
  }, [user]);

  return (
    <header
      className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-xl"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={{ ['--brand' as any]: BRAND } as React.CSSProperties}
    >
      {/* brand ribbon */}
      <div
        className="h-1 w-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(196,225,225,0) 0%, rgba(196,225,225,0.9) 20%, rgba(196,225,225,0.9) 80%, rgba(196,225,225,0) 100%)',
        }}
      />

      <div className="mx-auto max-w-full px-4">
        <div className="flex h-16 items-center justify-between">
          {/* left: logo + name */}
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-black/5 shadow-sm"
              style={{ background: 'var(--brand)' }}
              aria-hidden
            >
              {/* heartbeat glyph */}
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
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                IsanoMed
              </h1>
              <span className="hidden text-xs text-gray-500 sm:inline">
                Your health, connected
              </span>
            </div>
          </div>

          {/* right: user info + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-black/5 bg-white/60 px-3 py-1.5 md:flex">
                <span className="text-sm text-gray-700">
                  Welcome,&nbsp;
                  <span className="font-medium text-gray-900">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </span>
                </span>
                {user.userType && (
                  <span className="rounded-full bg-[var(--brand)]/30 px-2 py-0.5 text-xs font-medium text-gray-800 ring-1 ring-[var(--brand)]/50">
                    {user.userType}
                  </span>
                )}
              </div>

              {/* avatar */}
              <div
                className="grid h-10 w-10 select-none place-items-center rounded-full bg-white text-sm font-semibold text-gray-800 ring-1 ring-black/5 shadow-sm"
                aria-label="User avatar"
                title={`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
              >
                {initials}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)]/50 px-3.5 py-2 text-sm font-medium text-gray-900 ring-1 ring-[var(--brand)]/60 transition hover:bg-[var(--brand)]/70 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                aria-label="Logout"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    d="M10 17l5-5-5-5M15 12H3M21 3v18"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* soft divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
    </header>
  );
}
