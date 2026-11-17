'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { LogOut, Menu, UserRound, ChevronDown } from 'lucide-react';
import { useAuthHooks } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NAV, activeItem } from './nav';

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, handleLogout } = useAuthHooks();
  const pathname = usePathname();
  const role = user?.userType === 'super_admin' ? 'admin' : user?.userType ?? '';
  const title = activeItem(NAV[role] ?? [], pathname)?.name ?? 'IsanoMed';

  const name = `${user?.profile?.firstName ?? ''} ${user?.profile?.lastName ?? ''}`.trim();
  const initials = useMemo(
    () => ((user?.profile?.firstName?.[0] ?? '') + (user?.profile?.lastName?.[0] ?? '')).toUpperCase() || 'U',
    [user],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>

        {user ? (
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium text-slate-900">{name || user.email}</span>
                  <span className="block text-xs capitalize text-muted-foreground">{user.userType?.replace('_', ' ')}</span>
                </span>
                <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-slate-900">{name || 'Signed in'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/profile`.replace('/sponsor/profile', '/sponsor')}>
                    <UserRound className="size-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600">
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  );
}
