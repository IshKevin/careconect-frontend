'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Empty, PageHeader, Section } from '@/components/dashboard/common';

// Secure messaging is not built yet. This page used to show sample conversations; those were
// invented content and are removed so patients never see made-up messages from doctors.

export default function PatientMessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Secure conversations with your care team." />
      <Section title="Inbox">
        <Empty
          icon={MessageSquare}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/patient/appointments">Go to appointments</Link>
            </Button>
          }
        >
          Secure messaging with your doctors is coming soon. For now, contact your clinic directly about your care, or talk to your
          doctor during a video consultation.
        </Empty>
      </Section>
    </div>
  );
}
