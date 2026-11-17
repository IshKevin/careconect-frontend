"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  Clock,
  CreditCard,
  FileHeart,
  MapPin,
  Pill,
  Receipt,
  Stethoscope,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/api/auth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { useMedications } from "@/hooks/usePatient";
import { useInvoices } from "@/hooks/usePayments";
import { Button } from "@/components/ui/Button";
import { Empty, Loading, PageHeader, Section, StatCard, StatusBadge, formatRwf } from "@/components/dashboard/common";
import VideoCall from "@/components/consultation/VideoCall";
import type { Appointment } from "@/types/appointment";

// Appointment date and time as one Date (scheduledDate may be "YYYY-MM-DD" or a full ISO string).
const startsAt = (a: Appointment) => new Date(`${a.scheduledDate.slice(0, 10)}T${(a.scheduledTime || "00:00").slice(0, 5)}`);
// date-fns throws on an invalid date; show a dash instead of crashing the page.
const fmt = (d: Date, pattern: string) => (Number.isNaN(d.getTime()) ? "—" : format(d, pattern));
const statusOf = (a: Appointment) => a.appointmentStatus ?? a.status ?? "";
// An appointment stays "next" for 30 minutes after its start, so the patient can still join the call.
const GRACE_MS = 30 * 60 * 1000;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function Page() {
  const { user } = useAuth();

  const { data: appointments, isLoading: isLoadingAppts } = useMyAppointments();
  const { data: medications, isLoading: isLoadingMeds } = useMedications();
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices(user?.userId ?? "");

  const upcoming = useMemo(
    () =>
      (appointments ?? [])
        .filter((a) => startsAt(a).getTime() > Date.now() - GRACE_MS && statusOf(a) !== "cancelled")
        .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime()),
    [appointments],
  );

  const pendingInvoices = useMemo(
    () => (invoices ?? []).filter((i) => (i.invoiceStatus ?? i.status) === "pending"),
    [invoices],
  );
  const amountDue = pendingInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const completed = (appointments ?? []).filter((a) => statusOf(a) === "completed").length;

  const recent = useMemo(
    () => [...(appointments ?? [])].sort((a, b) => startsAt(b).getTime() - startsAt(a).getTime()).slice(0, 5),
    [appointments],
  );

  const nextAppt = upcoming[0];

  if (!user) return null;

  const firstName = user.profile?.firstName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        description="Here is an overview of your care: upcoming visits, bills and your health record."
        actions={
          <Button asChild>
            <Link href="/patient/search">
              <CalendarPlus /> Book appointment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={isLoadingAppts ? "—" : upcoming.length} hint="appointments" icon={CalendarClock} tone="blue" />
        <StatCard label="Completed" value={isLoadingAppts ? "—" : completed} hint="visits" icon={CalendarCheck} tone="green" />
        <StatCard
          label="Invoices due"
          value={isLoadingInvoices ? "—" : pendingInvoices.length}
          hint={pendingInvoices.length > 0 ? `${formatRwf(amountDue)} to pay` : "Nothing to pay"}
          icon={Receipt}
          tone="amber"
        />
        <StatCard label="Medications" value={isLoadingMeds ? "—" : (medications?.length ?? 0)} hint="on your record" icon={Pill} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next appointment */}
        <div className="lg:col-span-2">
          <Section
            title="Next appointment"
            action={
              nextAppt ? (
                <div className="flex items-center gap-2">
                  <StatusBadge value={statusOf(nextAppt)} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/patient/appointments">
                      Manage <ChevronRight />
                    </Link>
                  </Button>
                </div>
              ) : undefined
            }
            className="h-full"
          >
            {isLoadingAppts ? (
              <Loading rows={2} />
            ) : nextAppt ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <div className="text-center leading-tight">
                      <p className="text-[11px] font-semibold uppercase">{fmt(startsAt(nextAppt), "MMM")}</p>
                      <p className="text-2xl font-semibold">{fmt(startsAt(nextAppt), "d")}</p>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-lg font-semibold text-slate-900">
                      {nextAppt.doctor ? `Dr. ${nextAppt.doctor.firstName} ${nextAppt.doctor.lastName}` : "Doctor"}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Stethoscope className="size-4 shrink-0" />
                      {nextAppt.doctor?.specialty || "General Practice"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" /> Date and time
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {fmt(startsAt(nextAppt), "EEE, MMM d")} · {nextAppt.scheduledTime?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {nextAppt.appointmentType === "telemedicine" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />} Where
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {nextAppt.appointmentType === "telemedicine" ? "Video consultation" : "In person at the clinic"}
                    </p>
                  </div>
                </div>

                {nextAppt.reason || nextAppt.notes ? (
                  <p className="text-sm text-slate-600">
                    {nextAppt.reason}
                    {nextAppt.reason && nextAppt.notes ? " · " : ""}
                    {nextAppt.notes}
                  </p>
                ) : null}

                <div className="border-t border-border pt-4">
                  <VideoCall appointmentId={nextAppt.appointmentId} />
                </div>
              </div>
            ) : (
              <Empty
                icon={CalendarClock}
                action={
                  <Button asChild size="sm">
                    <Link href="/patient/search">Book an appointment</Link>
                  </Button>
                }
              >
                You have no upcoming appointments.
              </Empty>
            )}
          </Section>
        </div>

        {/* Quick actions */}
        <Section title="Quick actions">
          <div className="grid gap-2">
            {[
              { href: "/patient/search", label: "Book appointment", hint: "Find a doctor and pick a time", icon: CalendarPlus },
              { href: "/patient/invoices", label: "Pay invoices", hint: "Settle your consultation bills", icon: CreditCard },
              { href: "/patient/medical-history", label: "Health record", hint: "Conditions, allergies, medications", icon: FileHeart },
            ].map(({ href, label, hint, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent appointments */}
        <div className="lg:col-span-2">
          <Section
            title="Recent appointments"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/patient/appointments">View all</Link>
              </Button>
            }
            flush
          >
            {isLoadingAppts ? (
              <div className="p-5">
                <Loading />
              </div>
            ) : recent.length === 0 ? (
              <Empty icon={CalendarClock}>Your appointments will appear here.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((a) => (
                  <li key={a.appointmentId} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <Stethoscope className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : "Doctor"}
                        {a.doctor?.specialty ? <span className="font-normal text-muted-foreground"> · {a.doctor.specialty}</span> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(startsAt(a), "d MMM yyyy")} · {a.scheduledTime?.slice(0, 5)}
                      </p>
                    </div>
                    <StatusBadge value={statusOf(a)} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Medications */}
        <Section
          title="Medications"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/patient/medications">Manage</Link>
            </Button>
          }
        >
          {isLoadingMeds ? (
            <Loading rows={2} />
          ) : medications && medications.length > 0 ? (
            <ul className="space-y-2">
              {medications.map((m) => (
                <li key={m.medicationId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                    <Pill className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{m.medicationName}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.frequency}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={Pill}>No active medications.</Empty>
          )}
        </Section>
      </div>
    </div>
  );
}
