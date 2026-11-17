"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/lib/api/auth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { useMedications } from "@/hooks/usePatient";
import { useInvoices } from "@/hooks/usePayments";
import { format } from "date-fns";

export default function Page() {
  const { user, logout } = useAuth();

  // Fetch real data
  const { data: appointments, isLoading: isLoadingAppts } = useMyAppointments();
  const { data: medications, isLoading: isLoadingMeds } = useMedications();
  const { data: invoices } = useInvoices(user?.userId ?? "");

  // Calculate stats based on real data
  const stats = useMemo(
    () => [
      {
        label: "Upcoming",
        value: appointments?.filter(a => new Date(a.scheduledDate) > new Date()).length || 0,
        sub: "appointments"
      },
      {
        label: "Completed",
        value: appointments?.filter(a => (a.appointmentStatus ?? a.status) === "completed").length || 0,
        sub: "visits"
      },
      {
        label: "Invoices",
        value: invoices?.filter(i => (i.invoiceStatus ?? i.status) === "pending").length || 0,
        sub: "due"
      },
    ],
    [appointments, invoices]
  );

  const nextAppt = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;

    // Find next upcoming appointment
    const upcoming = appointments
      .filter(a => new Date(a.scheduledDate) > new Date())
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

    if (!upcoming) return null;

    return {
      date: `${format(new Date(upcoming.scheduledDate), "EEE, MMM d")} • ${upcoming.scheduledTime}`,
      doctor: upcoming.doctor ? `Dr. ${upcoming.doctor.lastName}` : "Doctor",
      specialty: upcoming.doctor?.specialty || "General Practice",
      location: upcoming.appointmentType === "telemedicine" ? "Video consultation (join from Appointments)" : "In person at the clinic",
      status: (upcoming.appointmentStatus ?? upcoming.status ?? "").replace("_", " "),
      notes: upcoming.notes || "No additional notes.",
    };
  }, [appointments]);

  if (!user) return null;

  const BRAND = "#C4E1E1";

  return (
    <div
      className="min-h-[calc(100vh-64px)] p-6 text-gray-900"
      style={{ '--brand': BRAND } as React.CSSProperties}
    >
      {/* brand ribbon */}
      <div
        className="mb-5 h-1 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 80%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patient Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome,{" "}
            <span className="font-medium">
              {user.profile?.firstName} {user.profile?.lastName}
            </span>
            !
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
      </header>

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{s.label}</p>
              <span
                className="grid h-8 w-8 place-items-center rounded-lg ring-1 ring-black/5"
                style={{ background: "var(--brand)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-black/70">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{s.value}</span>
              <span className="text-sm text-gray-500">{s.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main grid */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Appointment */}
        <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Next appointment</h2>
            {nextAppt && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 ring-1 ring-green-200">
                {nextAppt.status}
              </span>
            )}
          </div>

          {isLoadingAppts ? (
            <p>Loading appointments...</p>
          ) : nextAppt ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/5 bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Date & time</p>
                  <p className="mt-1 font-medium text-gray-900">{nextAppt.date}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Doctor</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {nextAppt.doctor} • <span className="text-gray-600">{nextAppt.specialty}</span>
                  </p>
                </div>
                <div className="sm:col-span-2 rounded-xl border border-black/5 bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Location</p>
                  <p className="mt-1 font-medium text-gray-900">{nextAppt.location}</p>
                  <p className="mt-2 text-sm text-gray-600">{nextAppt.notes}</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="rounded-lg bg-[var(--brand)]/70 px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-[var(--brand)]/60 transition hover:bg-[var(--brand)]/90">
                  Reschedule
                </button>
                <button className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                  Message doctor
                </button>
                <button className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                  View details
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No upcoming appointments.</p>
              <button className="mt-4 rounded-lg bg-[var(--brand)]/70 px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-[var(--brand)]/60">
                Book an Appointment
              </button>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold tracking-tight">Medications</h2>
          {isLoadingMeds ? (
            <p className="mt-3 text-sm text-gray-500">Loading medications...</p>
          ) : medications && medications.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {medications.map((m) => (
                <li
                  key={m.medicationId}
                  className="flex items-start justify-between rounded-xl border border-black/5 bg-white/70 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{m.medicationName}</p>
                    <p className="text-sm text-gray-600">{m.frequency}</p>
                  </div>
                  {/* <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-black/5">
                    Refills: ?
                  </span> */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No active medications.</p>
          )}
          <button className="mt-4 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
            Manage medications
          </button>
        </div>

        {/* Recent activity + Tips */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
            {/* Placeholder activity as before */}
            <ul className="mt-3 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gray-300" />
                <p className="text-sm text-gray-500">No recent activity.</p>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight">Wellness tip</h2>
            <p className="mt-2 text-gray-700">
              Staying hydrated helps regulate blood pressure and energy. Aim for 6–8 glasses per day.
            </p>
            <button className="mt-4 rounded-lg bg-[var(--brand)]/70 px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-[var(--brand)]/60 transition hover:bg-[var(--brand)]/90">
              See more tips
            </button>
          </div>
        </div>

        {/* Care team */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold tracking-tight">Your care team</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { name: "Dr. A. Niyonzima", role: "Cardiologist" },
              { name: "Nurse B. Uwase", role: "Primary Nurse" },
            ].map((m) => (
              <div key={m.name} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 ring-1 ring-black/5">
                  {m.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-600">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
            Message care team
          </button>
        </div>
      </section>
    </div>
  );
}
