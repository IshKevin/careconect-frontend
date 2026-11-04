'use client';

// Secure messaging is not built yet. This page used to show sample conversations; those were
// invented content and are removed so patients never see made-up messages from doctors.

export default function PatientMessagesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Secure messaging with your doctors is coming soon. For now, contact your clinic directly about your care.
      </div>
    </div>
  );
}
