"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { useProgressStore } from "../ProgressProvider";
import { FirestoreProgressStore } from "@/lib/progress/firestore-store";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthPage, NotConfigured } from "./shared";
import s from "./auth.module.css";

const fmt = (iso: string) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function AccountView() {
  const auth = useAuth();
  const store = useProgressStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ solved: number; notes: number } | null>(null);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");

  /** Set when the learner signs out or deletes their account here, so we go home instead of to the login page. */
  const leaving = useRef(false);

  useEffect(() => {
    if (!auth.loading && !auth.user && auth.enabled && !leaving.current) router.replace("/login/?next=/account/");
  }, [auth.loading, auth.user, auth.enabled, router]);

  useEffect(() => {
    if (auth.profile) setName(auth.profile.displayName);
  }, [auth.profile]);

  useEffect(() => {
    if (store instanceof FirestoreProgressStore) {
      store.loadAll().then((all) => {
        const v = Object.values(all);
        setStats({ solved: v.filter((p) => p.solved).length, notes: v.filter((p) => p.note).length });
      });
    }
  }, [store]);

  if (!auth.enabled) return <AuthPage><NotConfigured /></AuthPage>;
  if (auth.loading || !auth.user) return <AuthPage><p className={s.note}>Loading your account…</p></AuthPage>;

  const user = auth.user;
  const profile = auth.profile;
  const usesPassword = user.providerData.some((p) => p.providerId === "password");
  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ kind: "ok", text: ok });
    } catch (err) {
      setMsg({ kind: "error", text: authErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const download = () =>
    run(async () => {
      const data = await auth.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dsa-learning-studio-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "Your data has been downloaded as a JSON file.");

  return (
    <AuthPage wide>
      <h1 className={s.title}>Your account</h1>
      <p className={s.hand}>{profile?.displayName ? `hi ${profile.displayName.split(" ")[0]}!` : "hi there!"}</p>
      {msg && <p className={msg.kind === "ok" ? s.ok : s.error} role="status">{msg.text}</p>}

      <div className={s.section}>
        <h2>Profile</h2>
        <dl className={s.kv}>
          <dt>Email</dt>
          <dd>
            {user.email}
            <span className={`${s.badge} ${user.emailVerified ? s.verified : s.unverified}`}>{user.emailVerified ? "verified" : "not verified"}</span>
          </dd>
          <dt>Sign-in</dt>
          <dd>{user.providerData.map((p) => (p.providerId === "password" ? "Email & password" : p.providerId === "google.com" ? "Google" : p.providerId)).join(", ")}</dd>
          <dt>Member since</dt>
          <dd>{fmt(profile?.createdAt ?? "")}</dd>
        </dl>
        {!user.emailVerified && usesPassword && (
          <button type="button" className={`${s.btn} ${s.inline}`} disabled={busy} onClick={() => run(auth.resendVerification, "Verification email sent.")}>
            Resend verification email
          </button>
        )}
        <form
          className={s.row}
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => auth.updateName(name), "Name updated.");
          }}
        >
          <label className={s.field}>
            Display name (you can correct it any time)
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" className={`${s.btn} ${s.inline}`} disabled={busy || !name.trim() || name === profile?.displayName}>
            Save
          </button>
        </form>
      </div>

      <div className={s.section}>
        <h2>Your progress</h2>
        <p>{stats ? `${stats.solved} problems solved · ${stats.notes} with notes. Synced to this account.` : "Loading…"}</p>
      </div>

      <div className={s.section}>
        <h2>Your data &amp; consent</h2>
        <p>
          You agreed to the privacy notice version <strong>{profile?.consent.version || "—"}</strong> on {fmt(profile?.consent.acceptedAt ?? "")}, and confirmed you are 18 or
          older.
        </p>
        <p>Download a copy of everything we store about you: your profile, consent record, solved problems and notes.</p>
        <button type="button" className={`${s.btn} ${s.inline}`} disabled={busy} onClick={download}>
          Download my data (JSON)
        </button>
        <button type="button" className={`${s.btn} ${s.inline}`} style={{ marginLeft: 8 }} disabled={busy} onClick={() => run(async () => { leaving.current = true; await auth.signOut(); router.replace("/"); })}>
          Sign out
        </button>
        <p>
          Read the <a href="/privacy/">privacy notice</a> for your rights and how to raise a grievance.
        </p>
      </div>

      <div className={s.dangerZone}>
        <h2>Withdraw consent &amp; delete account</h2>
        <p>
          This permanently deletes your profile, consent record, solved problems and notes from our database, and removes your sign-in. It cannot be undone. Progress saved in
          this browser stays on this device.
        </p>
        <label className={s.field}>
          Type DELETE to confirm
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </label>
        {usesPassword && (
          <label className={s.field}>
            Your password (to confirm it’s you)
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        {!usesPassword && <p>You’ll be asked to confirm with Google.</p>}
        <button
          type="button"
          className={`${s.btn} ${s.danger}`}
          disabled={busy || confirm !== "DELETE" || (usesPassword && !password)}
          onClick={() =>
            run(async () => {
              leaving.current = true;
              try {
                await auth.deleteAccount(password);
              } catch (err) {
                leaving.current = false;
                throw err;
              }
              router.replace("/?account=deleted");
            })
          }
        >
          Delete my account and data
        </button>
      </div>
    </AuthPage>
  );
}
