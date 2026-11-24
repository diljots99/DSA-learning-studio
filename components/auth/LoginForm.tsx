"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthPage, GoogleIcon, NotConfigured, safeNext } from "./shared";
import s from "./auth.module.css";

export default function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.user && auth.profile) router.replace(next);
  }, [auth.user, auth.profile, next, router]);

  if (!auth.enabled) return <AuthPage><NotConfigured /></AuthPage>;

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
      <h1 className={s.title}>Sign in</h1>
      <p className={s.hand}>pick up where you left off</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => auth.signInWithEmail(email, password));
        }}
      >
        <label className={s.field}>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={s.field}>
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className={s.error} role="alert">{error}</p>}
        <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className={s.or}>or</div>
      <button type="button" className={s.btn} disabled={busy} onClick={() => void run(auth.signInWithGoogle)}>
        <GoogleIcon /> Continue with Google
      </button>
      <div className={s.links}>
        <a href={`/signup/?next=${encodeURIComponent(next)}`}>Create an account</a>
        <a href="/reset-password/">Forgot password?</a>
      </div>
      <p className={s.note}>
        Signing in syncs your solved problems and notes across devices. See our <a href="/privacy/">privacy notice</a>.
      </p>
    </AuthPage>
  );
}
