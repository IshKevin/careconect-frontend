'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { HandHeart } from 'lucide-react';
import { StatusBadge, Empty, Loading, Notice, PageHeader, Section, errorText, formatDate } from '@/components/dashboard/common';
import { useAuthHooks } from '@/hooks/useAuth';
import { useSponsorLinks, useUpdateSponsorLink } from '@/hooks/useDashboards';

export default function PatientSponsorsPage() {
  const { user } = useAuthHooks();
  const { data: links, isLoading, error } = useSponsorLinks();
  const updateLink = useUpdateSponsorLink();

  // Only links where this account is the patient. Sponsors see their own links on /sponsor/links.
  const mine = (links ?? []).filter((l) => l.patientUserId === user?.userId);

  const act = async (linkId: string, body: { status?: 'active' | 'revoked'; medicalAccessGranted?: boolean }, done: string) => {
    try {
      await updateLink.mutateAsync({ linkId, body });
      toast.success(done);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsors and sharing"
        description="Choose who can book and pay for your care, and whether they can see your medical information."
      />

      <Notice>
        A sponsor who pays for your care does not see your medical records. Only the access you switch on below applies, and you can switch it off at any time.
      </Notice>

      <Section title="Sponsor requests and links" flush>
        {isLoading ? (
          <div className="p-5"><Loading /></div>
        ) : error ? (
          <div className="p-5"><Notice tone="error">{errorText(error, 'Links could not be loaded.')}</Notice></div>
        ) : mine.length === 0 ? (
          <Empty icon={HandHeart}>No one has asked to sponsor you yet. When a family member or organisation asks, you can approve them here.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {mine.map((l) => (
              <li key={l.linkId} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                      {(l.sponsorName ?? 'S').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{l.sponsorName ?? 'Sponsor'}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {l.relationship} · requested {formatDate(l.requestedAt)}
                        {l.approvedAt ? ` · approved ${formatDate(l.approvedAt)}` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge value={l.status} />
                </div>

                {l.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={updateLink.isPending} onClick={() => act(l.linkId, { status: 'active' }, 'Sponsor approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={updateLink.isPending} onClick={() => act(l.linkId, { status: 'revoked' }, 'Request declined')}>
                      Decline
                    </Button>
                  </div>
                ) : null}

                {l.status === 'active' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {l.medicalAccessGranted ? (
                      <Button size="sm" variant="outline" disabled={updateLink.isPending} onClick={() => act(l.linkId, { medicalAccessGranted: false }, 'Medical access withdrawn')}>
                        Withdraw medical access
                      </Button>
                    ) : (
                      <Button size="sm" disabled={updateLink.isPending} onClick={() => act(l.linkId, { medicalAccessGranted: true }, 'Medical access granted')}>
                        Allow medical access
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={updateLink.isPending} onClick={() => act(l.linkId, { status: 'revoked' }, 'Sponsor link ended')}>
                      End link
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {l.medicalAccessGranted ? 'They can see your medical information.' : 'They cannot see your medical information.'}
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
