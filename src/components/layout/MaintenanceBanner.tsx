'use client';

import { Wrench } from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';

// Shown on every page while an admin has turned on maintenance mode.
export default function MaintenanceBanner() {
  const { maintenance } = useAppConfig();
  if (!maintenance.enabled) return null;
  return (
    <div className="flex items-start gap-2 border-b border-amber-300/70 bg-amber-100/80 px-4 py-2.5 text-sm text-amber-950 sm:px-6 lg:px-8" role="status">
      <Wrench className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      <span>{maintenance.message ?? 'IsanoMed is undergoing maintenance. Changes are paused for a short while.'}</span>
    </div>
  );
}
