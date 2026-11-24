"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { ConsentChecks } from "./auth/shared";
import { authErrorMessage } from "@/lib/auth-errors";
import s from "./auth/auth.module.css";

/**
 * Shown after a first-time Google sign-in: nothing is stored about the learner until they
 * confirm their age and give consent. Declining removes the new sign-in record.
 */
export default function ConsentGate() {
  const { needsConsent, user, completeConsent, declineConsent } = useAuth();
  const pathname = usePathname();
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!needsConsent || !user || pathname?.startsWith("/signup")) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className={s.card}>
        <h2 id="consent-title" className={s.title}>
          One more step
        </h2>
        <p className={s.hand}>before we save anything</p>
        <p className={s.note} style={{ marginTop: 0 }}>
          You signed in as <strong>{user.email}</strong>. To sync your progress and notes to this account, please confirm:
        </p>
        <ConsentChecks age={age} consent={consent} onAge={setAge} onConsent={setConsent} />
        {error && <p className={s.error}>{error}</p>}
        <button type="button" className={`${s.btn} ${s.primary}`} disabled={!age || !consent || busy} onClick={() => run(() => completeConsent(user.displayName ?? ""))}>
          Agree and continue
        </button>
        <button type="button" className={s.btn} disabled={busy} onClick={() => run(declineConsent)}>
          No thanks, sign me out
        </button>
        <p className={s.note}>If you decline, we keep nothing: your new sign-in record is deleted and you can keep using the site without an account.</p>
      </div>
    </div>
  );
}
