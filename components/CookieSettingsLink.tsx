"use client";

export const OPEN_COOKIE_BANNER = "dsa:open-cookie-banner";

/** Re-opens the cookie banner so visitors can review it at any time. */
export default function CookieSettingsLink({ label = "cookie settings" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_BANNER))}
      style={{ font: "inherit", color: "var(--blue)", textDecoration: "underline", background: "none", border: 0, padding: 0, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
