import type { Metadata } from "next";
import site from "@/content/site.json";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import s from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What personal data DSA Learning Studio collects, why, and your rights under India's Digital Personal Data Protection Act, 2023.",
};

const grievance = site.grievanceOfficer;
const grievanceSet = Boolean(grievance.email);
const version = new Date(site.privacyNoticeVersion).toLocaleDateString("en-IN", { dateStyle: "long" });

export default function PrivacyPage() {
  return (
    <main className={s.main}>
      <a className={s.brand} href="/">
        ← DSA Learning Studio
      </a>
      <h1>Privacy notice</h1>
      <p className={s.sub}>
        Version of {version}. Written in plain language under India’s Digital Personal Data Protection Act, 2023 (DPDP Act). {site.operator} operates {site.siteName} and is the
        Data Fiduciary for the personal data described here.
      </p>

      <div className={s.summary}>
        <b>In short</b>
        <ul>
          <li>You can read every chapter and track practice progress <strong>without an account</strong>; that progress stays in your browser.</li>
          <li>If you create an account, we store only your name, email, solved problems, the solutions and notes you write for them (code, approach, complexity) and your consent record, to run your account.</li>
          <li>No advertising, no tracking cookies, no selling or sharing your data for marketing.</li>
          <li>You can download your data or delete your account (withdrawing consent) at any time from your account page.</li>
        </ul>
      </div>

      <h2>1. What we collect and why</h2>
      <div className={s.tbl}>
        <table>
          <thead>
            <tr>
              <th>Personal data</th>
              <th>Purpose</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Name (display name)</td><td>To greet you and label your account.</td><td>Account holders</td></tr>
            <tr><td>Email address</td><td>To sign you in, verify your address, reset your password and reply to requests.</td><td>Account holders</td></tr>
            <tr><td>Password</td><td>To sign you in. Stored only as a salted hash by Firebase Authentication; we never see it.</td><td>Email sign-in only</td></tr>
            <tr><td>Google account identifier, name and email</td><td>To sign you in with Google. We do not receive your Google password.</td><td>Google sign-in only</td></tr>
            <tr><td>Solved problems, your written solutions (code, approach, complexity) and your notes</td><td>To save and sync your learning progress across devices.</td><td>Account holders</td></tr>
            <tr><td>Consent record (notice version, time, age confirmation)</td><td>To show that you agreed to this notice and are 18 or older.</td><td>Account holders</td></tr>
            <tr><td>Sign-in metadata (account creation and last sign-in time)</td><td>To secure your account and detect misuse.</td><td>Account holders</td></tr>
          </tbody>
        </table>
      </div>
      <p>We process this data only on the basis of your consent, given when you create an account, and only for the purposes above. We do not use it for advertising, profiling or automated decisions about you.</p>

      <h2>2. Using the site without an account</h2>
      <p>
        Without an account we collect no personal data ourselves. Practice progress, solutions and notes are saved only in your browser’s local storage and never sent to us. Our hosting
        provider keeps short-lived technical logs (such as IP addresses) to deliver and protect the site.
      </p>

      <h2>3. Cookies and similar storage</h2>
      <p>We only use storage that is necessary for the features you ask for. There are no analytics, advertising or tracking cookies.</p>
      <div className={s.tbl}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Purpose</th>
              <th>Kept until</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>dsa-studio-progress-v1</code></td><td>Local storage</td><td>Your solved problems, solutions and notes on this device.</td><td>You clear it</td></tr>
            <tr><td><code>dsa-studio-cookie-choice</code></td><td>Local storage</td><td>Remembers that you have seen the cookie banner.</td><td>You clear it</td></tr>
            <tr><td><code>dsa-studio-synced:…</code></td><td>Local storage</td><td>Remembers that this browser’s progress was copied into your account.</td><td>You clear it or delete your account</td></tr>
            <tr><td><code>firebase:authUser…</code> / <code>firebaseLocalStorageDb</code></td><td>IndexedDB</td><td>Keeps you signed in (Firebase Authentication).</td><td>You sign out</td></tr>
            <tr><td>Google cookies</td><td>Third-party, on google.com</td><td>Set by Google only if you choose “Continue with Google”.</td><td>Google’s policy</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        You can review the cookie banner again at any time: <CookieSettingsLink />.
      </p>

      <h2>4. Who processes your data</h2>
      <ul>
        <li><strong>Google Firebase</strong> (Authentication and Cloud Firestore) stores account data on our behalf as a Data Processor, under Google’s data-processing terms. Data may be stored on servers outside India.</li>
        <li><strong>Vercel</strong> hosts the website and keeps technical request logs.</li>
        <li><strong>Google Fonts</strong> serves the typefaces; your browser’s IP address is visible to Google when fonts load.</li>
      </ul>
      <p>Links to practice problems open other websites (such as LeetCode or GeeksforGeeks) that have their own privacy policies.</p>

      <h2>5. How long we keep it</h2>
      <p>
        We keep account data until you delete your account. When you delete it, your profile, consent record, solved problems, solutions and notes are erased from our database straight away,
        and your sign-in record is removed from Firebase Authentication.
      </p>

      <h2>6. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS) and at rest by Google Cloud. Database security rules allow each signed-in person to read and change only their own records, validate
        every write, and block everything else. Passwords are handled by Firebase Authentication and never stored by us. If a personal data breach occurs, we will inform affected
        users and the Data Protection Board of India as the law requires.
      </p>

      <h2>7. Your rights</h2>
      <ul>
        <li><strong>Access:</strong> download all data we hold about you from your <a href="/account/">account page</a> (“Download my data”).</li>
        <li><strong>Correction:</strong> change your display name on your account page; contact us to correct anything else.</li>
        <li><strong>Erasure and withdrawal of consent:</strong> “Delete my account and data” on your account page withdraws consent and erases your data. It is as easy as signing up.</li>
        <li><strong>Grievance redressal:</strong> contact our grievance contact below.</li>
        <li><strong>Nomination:</strong> you may nominate a person to exercise these rights if you die or become incapable; write to the grievance contact.</li>
      </ul>

      <h2>8. Children</h2>
      <p>
        Accounts are only for people aged 18 or older, confirmed at sign-up. Younger learners can use every chapter and practice problem without an account; their progress stays in
        their own browser. If you believe someone under 18 has created an account, contact us and we will delete it.
      </p>

      <h2>9. Grievances and complaints</h2>
      {grievanceSet ? (
        <p>
          Grievance contact: <strong>{grievance.name || site.operator}</strong>, <a href={`mailto:${grievance.email}`}>{grievance.email}</a>. We aim to respond within 30 days.
        </p>
      ) : (
        <p className={s.todo}>Grievance contact: to be published. (Site owner: add the name and email in <code>content/site.json</code> before accounts go live.)</p>
      )}
      <p>If you are not satisfied with our response, you can complain to the Data Protection Board of India.</p>

      <h2>10. Changes and languages</h2>
      <p>
        If we change this notice in a way that affects how your data is used, we will update the version date above and ask for your consent again where required. You can ask for
        this notice in any language listed in the Eighth Schedule to the Constitution of India by writing to the grievance contact.
      </p>
    </main>
  );
}
