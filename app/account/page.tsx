import type { Metadata } from "next";
import { Suspense } from "react";
import AccountView from "@/components/auth/AccountView";
import { listProblemIndex } from "@/lib/content";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function Page() {
  // Built on the server: which problems belong to which chapter, for the progress summary.
  const chapters = listProblemIndex();
  return (
    <Suspense>
      <AccountView chapters={chapters} />
    </Suspense>
  );
}
