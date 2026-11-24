"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { useProgressStore } from "../ProgressProvider";
import CookieSettingsLink from "../CookieSettingsLink";
import { FirestoreProgressStore } from "@/lib/progress/firestore-store";
import { hasSolution, type ProblemProgress, type ProgressMap } from "@/lib/progress/types";
import type { ProblemIndexEntry } from "@/lib/content";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthPage, NotConfigured } from "./shared";
import s from "./account.module.css";

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—");
const fmtDateTime = (iso: string) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const initialsOf = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "•";
const PROVIDERS: Record<string, string> = { password: "Email & password", "google.com": "Google" };

/** One line for the "recent" list: the revision note, else the approach, else what was saved. */
function preview(p: ProblemProgress) {
  const meta = [p.language, p.timeComplexity && `time ${p.timeComplexity}`, p.spaceComplexity && `space ${p.spaceComplexity}`].filter(Boolean).join(" · ");
  const text = p.note.trim() || p.approach.trim() || (p.code.trim() ? "Code saved" : "");
  const short = text.length > 140 ? `${text.slice(0, 140)}…` : text;
  return meta ? `${short} (${meta})` : short;
}

export default function AccountView({ chapters }: { chapters: ProblemIndexEntry[] }) {
  const auth = useAuth();
  const store = useProgressStore();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  /** Set when the learner signs out or deletes their account here, so we go home instead of to the login page. */
  const leaving = useRef(false);

  useEffect(() => {
    if (!auth.loading && !auth.user && auth.enabled && !leaving.current) router.replace("/login/?next=/account/");
  }, [auth.loading, auth.user, auth.enabled, router]);

  useEffect(() => {
    if (store instanceof FirestoreProgressStore) store.loadAll().then(setProgress).catch(() => setProgress({}));
  }, [store]);

  const lookup = useMemo(() => {
    const m = new Map<string, { name: string; chapter: ProblemIndexEntry }>();
    chapters.forEach((c) => c.problems.forEach((p) => m.set(p.id, { name: p.name, chapter: c })));
    return m;
  }, [chapters]);

  const summary = useMemo(() => {
    if (!progress) return null;
    // A problem can appear in more than one chapter: count each one once in the totals.
    const allIds = new Set(chapters.flatMap((c) => c.problems.map((p) => p.id)));
    const total = allIds.size;
    const solved = [...allIds].filter((id) => progress[id]?.solved).length;
    const perChapter = chapters.map((c) => ({ ...c, solved: c.problems.filter((p) => progress[p.id]?.solved).length }));
    const notes = Object.entries(progress)
      .filter(([id, p]) => (p.note.trim() || hasSolution(p)) && lookup.has(id))
      .sort((a, b) => (b[1].updatedAt || "").localeCompare(a[1].updatedAt || ""));
    return { total, solved, perChapter, notes, started: perChapter.filter((c) => c.solved > 0).length };
  }, [progress, chapters, lookup]);

  if (!auth.enabled) return <AuthPage><NotConfigured /></AuthPage>;
  if (auth.loading || !auth.user) return <AuthPage><p className={s.muted}>Loading your account…</p></AuthPage>;

  const user = auth.user;
  const profile = auth.profile;
  const displayName = profile?.displayName || user.displayName || user.email || "Learner";
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
    <main className={s.page}>
      <a className={s.back} href="/">
        ← All chapters
      </a>

      {msg && (
        <p className={msg.kind === "ok" ? s.ok : s.error} role="status">
          {msg.text}
        </p>
      )}

      {/* ---------- Profile header ---------- */}
      <section className={`${s.card} ${s.hero}`}>
        <div className={s.avatar} aria-hidden="true">
          {initialsOf(displayName)}
        </div>
        <div className={s.heroText}>
          {editing ? (
            <form
              className={s.nameForm}
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await auth.updateName(name);
                  setEditing(false);
                }, "Name updated.");
              }}
            >
              <input aria-label="Display name" value={name} maxLength={80} autoFocus onChange={(e) => setName(e.target.value)} />
              <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy || !name.trim()}>
                Save
              </button>
              <button type="button" className={s.btn} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <h1 className={s.name}>
              {displayName}
              <button
                type="button"
                className={s.edit}
                onClick={() => {
                  setName(profile?.displayName || "");
                  setEditing(true);
                }}
                aria-label="Edit your display name"
              >
                ✎ Edit
              </button>
            </h1>
          )}
          <p className={s.email}>
            {user.email}
            <span className={`${s.badge} ${user.emailVerified ? s.verified : s.unverified}`}>{user.emailVerified ? "✓ verified" : "not verified"}</span>
          </p>
          <div className={s.chips}>
            {user.providerData.map((p) => (
              <span key={p.providerId} className={s.chip}>
                {PROVIDERS[p.providerId] ?? p.providerId}
              </span>
            ))}
            <span className={s.chip}>Joined {fmtDate(profile?.createdAt ?? "")}</span>
          </div>
        </div>
      </section>

      {!user.emailVerified && usesPassword && (
        <div className={s.notice}>
          <span>Please verify your email address so you can always recover your account.</span>
          <button type="button" className={s.linkBtn} disabled={busy} onClick={() => run(auth.resendVerification, "Verification email sent. Check your inbox.")}>
            Resend email
          </button>
        </div>
      )}

      {/* ---------- Stats ---------- */}
      <section className={s.stats} aria-label="Your progress at a glance">
        <div className={`${s.stat} ${s.statGreen}`}>
          <b>{summary ? summary.solved : "–"}</b>
          <span>problems solved{summary ? ` of ${summary.total}` : ""}</span>
        </div>
        <div className={`${s.stat} ${s.statPurple}`}>
          <b>{summary ? summary.notes.length : "–"}</b>
          <span>problems with solutions or notes</span>
        </div>
        <div className={`${s.stat} ${s.statBlue}`}>
          <b>{summary ? summary.started : "–"}</b>
          <span>chapters started of {chapters.length}</span>
        </div>
      </section>

      <div className={s.grid}>
        {/* ---------- Progress by chapter ---------- */}
        <section className={s.card}>
          <h2 className={s.h2}>Progress by chapter</h2>
          {!summary ? (
            <p className={s.muted}>Loading…</p>
          ) : (
            <ul className={s.bars}>
              {summary.perChapter.map((c) => {
                const pct = c.problems.length ? Math.round((100 * c.solved) / c.problems.length) : 0;
                return (
                  <li key={c.slug}>
                    <a href={`/chapters/${c.slug}/#practice`}>
                      <span className={s.barLabel}>
                        <span className={s.num}>{String(c.number).padStart(2, "0")}</span>
                        {c.title}
                      </span>
                      <span className={s.barCount}>
                        {c.solved}/{c.problems.length}
                      </span>
                      <span className={s.track}>
                        <span className={s.fill} style={{ width: `${pct}%` }} />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Recent notes ---------- */}
        <section className={s.card}>
          <h2 className={s.h2}>Recent solutions &amp; notes</h2>
          {!summary ? (
            <p className={s.muted}>Loading…</p>
          ) : summary.notes.length === 0 ? (
            <p className={s.muted}>Nothing saved yet. Open any practice problem’s “My solution” button to save your code, approach and notes.</p>
          ) : (
            <ul className={s.notes}>
              {summary.notes.slice(0, 5).map(([id, p]) => {
                const info = lookup.get(id)!;
                return (
                  <li key={id}>
                    <a href={`/chapters/${info.chapter.slug}/#practice`}>
                      <b>{info.name}</b>
                      <span className={s.noteMeta}>
                        {info.chapter.title} · {fmtDate(p.updatedAt)}
                      </span>
                      <span className={s.noteText}>{preview(p)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- Data & privacy ---------- */}
      <section className={s.card}>
        <h2 className={s.h2}>Your data &amp; privacy</h2>
        <p className={s.muted}>
          You agreed to the privacy notice (version {profile?.consent.version || "—"}) on {fmtDateTime(profile?.consent.acceptedAt ?? "")} and confirmed you are 18 or older. Your
          progress and notes are stored in your account only; nothing is used for advertising.
        </p>
        <div className={s.actions}>
          <button type="button" className={s.btn} disabled={busy} onClick={download}>
            ⬇ Download my data
          </button>
          <button
            type="button"
            className={s.btn}
            disabled={busy}
            onClick={() =>
              run(async () => {
                leaving.current = true;
                await auth.signOut();
                router.replace("/");
              })
            }
          >
            Sign out
          </button>
          <span className={s.links}>
            <a href="/privacy/">Privacy notice</a> · <CookieSettingsLink label="Cookie settings" />
          </span>
        </div>
      </section>

      {/* ---------- Withdraw consent & delete (small, expandable) ---------- */}
      <details className={s.danger}>
        <summary>Withdraw consent &amp; delete account</summary>
        <div className={s.dangerBody}>
          <p>
            This permanently deletes your profile, consent record, solved problems and notes, and removes your sign-in. It can’t be undone. Progress saved in this browser stays on
            this device.
          </p>
          <div className={s.dangerRow}>
            <label>
              Type <code>DELETE</code>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
            </label>
            {usesPassword ? (
              <label>
                Password
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            ) : (
              <span className={s.hint}>You’ll confirm with Google.</span>
            )}
            <button
              type="button"
              className={s.dangerBtn}
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
              Delete account
            </button>
          </div>
        </div>
      </details>
    </main>
  );
}
