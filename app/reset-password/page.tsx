import type { Metadata } from "next";
import { Suspense } from "react";
import ResetForm from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
