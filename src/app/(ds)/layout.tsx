'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import EmailVerificationBanner from '@/components/dashboard/EmailVerificationBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <EmailVerificationBanner />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
