"use client";

import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthPage, NotConfigured } from "./shared";
import s from "./auth.module.css";

export default function ResetForm() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!auth.enabled) return <AuthPage><NotConfigured /></AuthPage>;

  return (
    <AuthPage>
      <h1 className={s.title}>Reset your password</h1>
      <p className={s.hand}>we’ll email you a link</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await auth.resetPassword(email);
            setSent(true);
          } catch (err) {
            const code = (err as { code?: string }).code;
            // Don't reveal whether the address has an account.
            if (code === "auth/user-not-found") setSent(true);
            else setError(authErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className={s.field}>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className={s.error} role="alert">{error}</p>}
        {sent && <p className={s.ok}>If an account exists for that address, a reset link is on its way. Check your inbox and spam folder.</p>}
        <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <div className={s.links}>
        <a href="/login/">Back to sign in</a>
      </div>
    </AuthPage>
  );
}
