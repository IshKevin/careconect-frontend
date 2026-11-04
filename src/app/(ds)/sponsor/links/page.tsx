'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge, Empty, Loading, Notice, Section, errorText, formatDate } from '@/components/dashboard/common';
import { useRequestSponsorLink, useSponsorLinks, useUpdateSponsorLink } from '@/hooks/useDashboards';
import type { SponsorRelationship } from '@/types/sponsor';

const RELATIONSHIPS: SponsorRelationship[] = ['parent', 'child', 'spouse', 'sibling', 'guardian', 'other'];

export default function SponsorLinksPage() {
  const { data: links, isLoading, error } = useSponsorLinks();
  const requestLink = useRequestSponsorLink();
  const updateLink = useUpdateSponsorLink();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<SponsorRelationship>('parent');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await requestLink.mutateAsync({ patientEmail: email.trim(), relationship });
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const withdraw = async (linkId: string, label: string) => {
    if (!window.confirm(`End the link with ${label}? You will lose access to their invoices and bookings.`)) return;
    try {
      await updateLink.mutateAsync({ linkId, body: { status: 'revoked' } });
      toast.success('Link ended');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Patient links</h1>
        <p className="text-sm text-gray-600">Ask a patient to link their account to yours. They must approve before you can book or pay for them.</p>
      </div>

      <Section title="Request a link">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="patient-email">Patient&apos;s email</Label>
            <Input id="patient-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="relationship">Relationship</Label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as SponsorRelationship)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm"
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={requestLink.isPending}>{requestLink.isPending ? 'Sending…' : 'Send request'}</Button>
        </form>
        {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      </Section>

      <Section title="Your links">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <Notice tone="error">{errorText(error, 'Links could not be loaded.')}</Notice>
        ) : !links || links.length === 0 ? (
          <Empty>You have no links yet.</Empty>
        ) : (
          <ul className="divide-y">
            {links.map((l) => (
              <li key={l.linkId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-gray-900">{l.patientName ?? 'Patient'}</p>
                  <p className="text-xs capitalize text-gray-500">
                    {l.relationship} · requested {formatDate(l.requestedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={l.status} />
                  {l.status !== 'revoked' ? (
                    <Button variant="outline" size="sm" onClick={() => withdraw(l.linkId, l.patientName ?? 'this patient')}>
                      {l.status === 'pending' ? 'Withdraw' : 'End link'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
