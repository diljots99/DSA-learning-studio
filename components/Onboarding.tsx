"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { COOKIE_CHOICE_MADE, cookieChoiceMade } from "./CookieBanner";
import s from "./Onboarding.module.css";

export const OPEN_GUIDE = "dsa:open-guide";
const GUIDE_KEY = "dsa-studio-guide-seen";
const AUTH_PAGES = ["/login", "/signup", "/reset-password", "/account"];

const seen = (key: string) => {
  try {
    return Boolean(window.localStorage.getItem(key));
  } catch {
    return true; // storage blocked: stay quiet rather than show the card on every page
  }
};
const remember = (key: string) => {
  try {
    window.localStorage.setItem(key, new Date().toISOString());
  } catch {
    /* ignore */
  }
};

/**
 * One thing at a time, after the cookie banner has been answered:
 *   1. first visit → a short "how to use the site" card (remembered once closed; reopen it from the home page footer)
 *   2. every later page load while signed out → the page fades and a banner points at the
 *      Sign in button. Closing it hides it for this page view only; it comes back on refresh.
 */
export default function Onboarding() {
  const { enabled, loading, user } = useAuth();
  const pathname = usePathname() ?? "/";
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<"guide" | "nudge" | null>(null);
  /** At most one card shows by itself per page view, so the guide and the nudge never chain. */
  const shown = useRef(false);

  useEffect(() => {
    const check = () => setReady(cookieChoiceMade());
    check();
    const open = () => setCard("guide");
    window.addEventListener(COOKIE_CHOICE_MADE, check);
    window.addEventListener(OPEN_GUIDE, open);
    return () => {
      window.removeEventListener(COOKIE_CHOICE_MADE, check);
      window.removeEventListener(OPEN_GUIDE, open);
    };
  }, []);

  useEffect(() => {
    if (!ready || loading || shown.current) return;
    if (!seen(GUIDE_KEY)) setCard("guide");
    else if (enabled && !user) setCard("nudge");
    else return;
    shown.current = true;
  }, [ready, loading, enabled, user]);

  const spotlight = card === "nudge" && enabled && !user && !AUTH_PAGES.some((p) => pathname.startsWith(p));
  useEffect(() => {
    if (!spotlight) return;
    // Lifts the Sign in button (AccountButton) above the faded page; see globals.css.
    document.documentElement.dataset.spotlight = "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCard(null);
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.documentElement.dataset.spotlight;
      window.removeEventListener("keydown", onKey);
    };
  }, [spotlight]);

  if (!card || AUTH_PAGES.some((p) => pathname.startsWith(p))) return null;
  if (card === "nudge" && (user || !enabled)) return null;

  const close = () => {
    if (card === "guide") remember(GUIDE_KEY);
    setCard(null);
  };
  const next = encodeURIComponent(pathname);

  if (card === "guide") {
    return (
      <section className={s.card} role="dialog" aria-modal="false" aria-labelledby="guide-title">
        <h2 id="guide-title" className={s.title}>
          New here? Here’s how it works
        </h2>
        <ol className={s.list}>
          <li>
            <b>Pick a chapter</b> from the home page. Each one is an illustrated lesson with diagrams, Python code and cited sources.
          </li>
          <li>
            <b>Play with the labs.</b> Step through the interactive labs to watch each algorithm run on real data.
          </li>
          <li>
            <b>Practise.</b> Every chapter ends with problems grouped by level. Filter by difficulty, open a problem to solve it, then tick it off and keep notes on your approach.
          </li>
          <li>
            <b>Watch your progress.</b> The progress bar counts what you’ve solved.{" "}
            {enabled ? "It’s saved in this browser, or synced to your account if you sign in." : "It’s saved in this browser."}
          </li>
        </ol>
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={close}>
            Got it, let’s start
          </button>
        </div>
        <button type="button" className={s.close} onClick={close} aria-label="Close the guide">
          ×
        </button>
      </section>
    );
  }

  return (
    <>
      <div className={s.backdrop} onClick={close} aria-hidden="true" />
      <section className={s.spot} role="dialog" aria-modal="true" aria-labelledby="nudge-title">
        <h2 id="nudge-title" className={s.title}>
          Sign in to keep your progress
        </h2>
        <p className={s.body}>Your ticks and notes are only saved in this browser right now. With a free account:</p>
        <ul className={s.list}>
          <li>Solved problems and notes sync to your account, so they’re there on any device.</li>
          <li>Progress you’ve already made here is copied in when you sign in. Nothing is lost.</li>
          <li>Your account page shows progress by chapter and your recent notes.</li>
          <li>You can download or delete your data at any time.</li>
        </ul>
        <div className={s.actions}>
          <a className={s.primary} href={`/login/?next=${next}`} autoFocus>
            Sign in
          </a>
          <a className={s.link} href={`/signup/?next=${next}`}>
            Create a free account
          </a>
        </div>
        <button type="button" className={s.close} onClick={close} aria-label="Close">
          ×
        </button>
      </section>
    </>
  );
}

/** Footer link that reopens the guide. */
export function GuideLink({ label = "How to use this site" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_GUIDE))}
      style={{ font: "inherit", color: "var(--blue)", textDecoration: "underline", background: "none", border: 0, padding: 0, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
