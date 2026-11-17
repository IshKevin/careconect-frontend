'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Send, UserRound } from 'lucide-react';
import { StatusBadge, Empty, Loading, Notice, PageHeader, Section, errorText, formatDate } from '@/components/dashboard/common';
import { cn } from '@/lib/utils';
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

  const active = links?.filter((l) => l.status === 'active').length ?? 0;
  const pending = links?.filter((l) => l.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient links"
        description="Ask a patient to link their account to yours. They must approve before you can book or pay for them."
      />

      <Section title="Link a patient" description="We send the patient a request to approve from their own account.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="patient-email" className="text-sm font-medium text-slate-700">Patient&apos;s email</Label>
            <Input id="patient-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="relationship" className="text-sm font-medium text-slate-700">Relationship</Label>
            <Select value={relationship} onValueChange={(v) => setRelationship(v as SponsorRelationship)}>
              <SelectTrigger id="relationship" className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={requestLink.isPending}>
            <Send /> {requestLink.isPending ? 'Sending…' : 'Send request'}
          </Button>
        </form>
        {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      </Section>

      <Section
        title="Your links"
        description={links && links.length > 0 ? `${active} active · ${pending} waiting for approval` : undefined}
      >
        {isLoading ? (
          <Loading />
        ) : error ? (
          <Notice tone="error">{errorText(error, 'Links could not be loaded.')}</Notice>
        ) : !links || links.length === 0 ? (
          <Empty icon={Link2}>You have no links yet. Use the form above to send your first request.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => (
              <li
                key={l.linkId}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border border-border p-4',
                  l.status === 'revoked' && 'bg-slate-50/70',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <UserRound className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{l.patientName ?? 'Patient'}</p>
                    <p className="text-xs capitalize text-muted-foreground">{l.relationship}</p>
                  </div>
                  <StatusBadge value={l.status} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">Requested {formatDate(l.requestedAt)}</p>
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
