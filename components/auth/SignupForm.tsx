"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthPage, ConsentChecks, GoogleIcon, NotConfigured, safeNext } from "./shared";
import s from "./auth.module.css";

const strongEnough = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p);

export default function SignupForm() {
  const auth = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** The learner ticked both boxes and then chose Google: record consent once they are back. */
  const googleConsented = useRef(false);

  useEffect(() => {
    if (auth.user && auth.profile) router.replace(next);
  }, [auth.user, auth.profile, next, router]);

  useEffect(() => {
    if (auth.needsConsent && googleConsented.current && auth.user) {
      googleConsented.current = false;
      auth.completeConsent(auth.user.displayName ?? "").catch((err) => setError(authErrorMessage(err)));
    }
  }, [auth]);

  if (!auth.enabled) return <AuthPage><NotConfigured /></AuthPage>;

  const ready = age && consent;
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
    <AuthPage>
      <h1 className={s.title}>Create your account</h1>
      <p className={s.hand}>save progress & notes everywhere</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!strongEnough(password)) {
            setError("Choose a stronger password: at least 8 characters, with letters and numbers.");
            return;
          }
          void run(() => auth.signUpWithEmail(name, email, password));
        }}
      >
        <label className={s.field}>
          Name
          <input autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={s.field}>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={s.field}>
          Password
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className={s.hint}>At least 8 characters, with letters and numbers.</span>
        </label>
        <ConsentChecks age={age} consent={consent} onAge={setAge} onConsent={setConsent} />
        {error && <p className={s.error} role="alert">{error}</p>}
        <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy || !ready}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <div className={s.or}>or</div>
      <button
        type="button"
        className={s.btn}
        disabled={busy || !ready}
        onClick={() => {
          googleConsented.current = true;
          void run(auth.signInWithGoogle);
        }}
      >
        <GoogleIcon /> Sign up with Google
      </button>
      {!ready && <p className={s.note}>Tick both boxes above to create an account.</p>}
      <div className={s.links}>
        <a href={`/login/?next=${encodeURIComponent(next)}`}>Already have an account? Sign in</a>
      </div>
      <p className={s.note}>Accounts are for learners aged 18 and over. Everyone can use the chapters and practice problems without an account.</p>
    </AuthPage>
  );
}
