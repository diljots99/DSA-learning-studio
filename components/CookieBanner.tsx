"use client";

import { useEffect, useState } from "react";
import SardarIllustration from "./SardarIllustration";
import { OPEN_COOKIE_BANNER } from "./CookieSettingsLink";
import site from "@/content/site.json";
import s from "./CookieBanner.module.css";

const KEY = "dsa-studio-cookie-choice";

/**
 * The site only uses storage that is strictly necessary (progress on this device, staying
 * signed in, remembering this choice), so there is nothing optional to switch off. The banner
 * says so plainly, links to the privacy notice, and can be reopened from "cookie settings".
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) || "null") as { version?: string } | null;
      if (!saved || saved.version !== site.privacyNoticeVersion) setOpen(true);
    } catch {
      setOpen(true);
    }
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_BANNER, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_BANNER, reopen);
  }, []);

  if (!open) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ choice: "essential-only", version: site.privacyNoticeVersion, at: new Date().toISOString() }));
    } catch {
      /* storage blocked: the banner simply shows again next visit */
    }
    setOpen(false);
  };

  return (
    <section className={s.banner} role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-body">
      <SardarIllustration className={s.art} />
      <div className={s.text}>
        <h2 id="cookie-title" className={s.title}>
          Legally required cookie banner
        </h2>
        <p id="cookie-body" className={s.body}>
          Good news: there are <strong>no tracking or advertising cookies</strong> here. We only use what’s strictly necessary: saving your practice progress and notes on this
          device, keeping you signed in if you create an account, and remembering that you’ve read this.
        </p>
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={accept}>
            Theek hai, got it!
          </button>
          <a className={s.link} href="/privacy/">
            Read the privacy notice
          </a>
        </div>
      </div>
      <button type="button" className={s.close} onClick={accept} aria-label="Close cookie banner">
        ×
      </button>
    </section>
  );
}
