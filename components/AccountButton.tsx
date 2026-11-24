"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const style: React.CSSProperties = {
  position: "fixed",
  top: 12,
  right: 12,
  zIndex: 60,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--ink)",
  background: "#fff",
  border: "2px solid var(--ink)",
  borderRadius: 999,
  padding: "5px 12px 5px 6px",
  boxShadow: "2px 2px 0 var(--ink)",
  textDecoration: "none",
};
const dot: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "var(--purple)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
};

/** Small sign-in / account pill in the top-right corner of every page. */
export default function AccountButton() {
  const { enabled, loading, user, profile } = useAuth();
  const pathname = usePathname() ?? "/";
  if (!enabled || loading) return null;
  if (["/login", "/signup", "/reset-password"].some((p) => pathname.startsWith(p))) return null;

  if (!user) {
    return (
      <a href={`/login/?next=${encodeURIComponent(pathname)}`} style={style} aria-label="Sign in to sync your progress">
        <span style={dot}>→</span>Sign in
      </a>
    );
  }
  const name = profile?.displayName || user.displayName || user.email || "Account";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <a href="/account/" style={style} aria-label="Your account">
      <span style={dot}>{initials || "•"}</span>
      Account
    </a>
  );
}
