import { LegalPage } from '@/components/Auth/LegalPage';

export const metadata = { title: 'Privacy policy · IsanoMed' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: name, email address, phone number.</li>
          <li>Health information you or your doctor enter: medical history, allergies, medications, consultation notes.</li>
          <li>Appointment, invoice and payment records. Card and mobile money details stay with Pesapal.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide care: booking, consultations, invoices and payments.</li>
          <li>To send service emails such as password resets, appointment confirmations and receipts. Emails never contain diagnoses, medications or test results.</li>
        </ul>
      </section>
      <section>
        <h2>Who can see it</h2>
        <ul>
          <li>Your doctor sees the records needed for your care.</li>
          <li>A sponsor sees your medical information only if you grant it, and you can withdraw that at any time.</li>
          <li>Our staff access records only to run the service, and access is logged.</li>
        </ul>
      </section>
      <section>
        <h2>Video calls</h2>
        <p>Audio and video go directly between the two browsers, encrypted. When a direct connection is not possible, our own relay server passes the encrypted media on without being able to read it. Calls are never recorded.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete your data under Rwanda&apos;s law on the protection of personal data and privacy (Law No. 058/2021). Write to support@isanomed.org.</p>
      </section>
    </LegalPage>
  );
}
