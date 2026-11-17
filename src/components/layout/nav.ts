import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  FileHeart,
  ShieldAlert,
  Pill,
  SlidersHorizontal,
  HeartHandshake,
  Receipt,
  UserRound,
  Search,
  Users,
  Stethoscope,
  BarChart3,
  Building2,
  Undo2,
  Scale,
  ScrollText,
  Settings,
  Clock,
  ClipboardList,
  Link2,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type NavItem = { name: string; href: string; icon: ComponentType<{ className?: string }> };
export type NavGroup = { label?: string; items: NavItem[] };

// Navigation per role. Hrefs must match pages under src/app/(ds).
export const NAV: Record<string, NavGroup[]> = {
  patient: [
    { items: [{ name: 'Dashboard', href: '/patient', icon: LayoutDashboard }] },
    {
      label: 'Care',
      items: [
        { name: 'Appointments', href: '/patient/appointments', icon: CalendarDays },
        { name: 'Find a doctor', href: '/patient/search', icon: Search },
        { name: 'Messages', href: '/patient/messages', icon: MessageSquare },
      ],
    },
    {
      label: 'Health record',
      items: [
        { name: 'Medical history', href: '/patient/medical-history', icon: FileHeart },
        { name: 'Allergies', href: '/patient/allergies', icon: ShieldAlert },
        { name: 'Medications', href: '/patient/medications', icon: Pill },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Invoices', href: '/patient/invoices', icon: Receipt },
        { name: 'Sponsors', href: '/patient/sponsors', icon: HeartHandshake },
        { name: 'Preferences', href: '/patient/preferences', icon: SlidersHorizontal },
        { name: 'Profile', href: '/patient/profile', icon: UserRound },
      ],
    },
  ],
  doctor: [
    { items: [{ name: 'Dashboard', href: '/doctor', icon: LayoutDashboard }] },
    {
      label: 'Practice',
      items: [
        { name: 'Appointments', href: '/doctor/appointments', icon: CalendarDays },
        { name: 'Schedule', href: '/doctor/schedule', icon: Clock },
        { name: 'Consultations', href: '/doctor/consultations', icon: ClipboardList },
        { name: 'Patients', href: '/doctor/patients', icon: Users },
        { name: 'Find a patient', href: '/doctor/search', icon: Search },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Invoices', href: '/doctor/invoices', icon: Receipt },
        { name: 'Profile', href: '/doctor/profile', icon: UserRound },
      ],
    },
  ],
  sponsor: [
    {
      items: [
        { name: 'Dashboard', href: '/sponsor', icon: LayoutDashboard },
        { name: 'Patient links', href: '/sponsor/links', icon: Link2 },
        { name: 'Invoices', href: '/sponsor/invoices', icon: Receipt },
      ],
    },
  ],
  admin: [
    { items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }] },
    {
      label: 'People',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
        { name: 'Facilities', href: '/admin/facilities', icon: Building2 },
      ],
    },
    {
      label: 'Operations',
      items: [
        { name: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
        { name: 'Refunds', href: '/admin/refunds', icon: Undo2 },
        { name: 'Reconciliation', href: '/admin/reconciliation', icon: Scale },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Audit logs', href: '/admin/audit-logs', icon: ScrollText },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Profile', href: '/admin/profile', icon: UserRound },
      ],
    },
  ],
};

/** The nav item for the current path: exact match, else the longest prefix (so /patient/invoices/return → Invoices). */
export const activeItem = (groups: NavGroup[], pathname: string): NavItem | undefined => {
  const items = groups.flatMap((g) => g.items);
  return (
    items.find((i) => i.href === pathname) ??
    items.filter((i) => pathname.startsWith(i.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]
  );
};
