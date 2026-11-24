import type { Metadata } from "next";
import { Suspense } from "react";
import SolutionPage from "@/components/solution/SolutionPage";
import { listProblemIndex } from "@/lib/content";

export const metadata: Metadata = { title: "Your solution", robots: { index: false } };

/** /problems/?id=<problem id>: one problem's solution write-up on its own page. */
export default function Page() {
  return (
    <Suspense>
      <SolutionPage chapters={listProblemIndex()} />
    </Suspense>
  );
}
