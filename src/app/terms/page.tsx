import { LegalPage } from '@/components/Auth/LegalPage';

export const metadata = { title: 'Terms of use · IsanoMed' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>The service</h2>
        <p>IsanoMed lets patients in Rwanda book appointments with doctors, hold video consultations, and pay invoices. A sponsor can pay for the care of a relative who has approved the link.</p>
      </section>
      <section>
        <h2>Not for emergencies</h2>
        <p>IsanoMed is not an emergency service. In an emergency, call 912 or go to the nearest hospital.</p>
      </section>
      <section>
        <h2>Your account</h2>
        <ul>
          <li>Give accurate details and keep your password private.</li>
          <li>You are responsible for activity on your account. Tell us at once if you think someone else has used it.</li>
          <li>We may suspend an account that is misused.</li>
        </ul>
      </section>
      <section>
        <h2>Appointments and payments</h2>
        <ul>
          <li>Prices are shown in Rwandan francs (RWF) before you pay.</li>
          <li>Payments are processed by Pesapal. We do not store card details.</li>
          <li>Refunds follow the clinic&apos;s cancellation policy and are reviewed by our staff.</li>
        </ul>
      </section>
      <section>
        <h2>Video consultations</h2>
        <p>Calls are encrypted between the patient&apos;s and the doctor&apos;s browsers and are not recorded. Only the patient and the doctor on the appointment can join.</p>
      </section>
    </LegalPage>
  );
}
