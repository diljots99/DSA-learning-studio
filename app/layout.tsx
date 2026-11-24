import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { ProgressProvider } from "@/components/ProgressProvider";
import AccountButton from "@/components/AccountButton";
import ConsentGate from "@/components/ConsentGate";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DSA Learning Studio", template: "%s · DSA Learning Studio" },
  description: "Illustrated, interactive textbook chapters on data structures and algorithms.",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <AuthProvider>
          <ProgressProvider>
            {children}
            <AccountButton />
            <ConsentGate />
            <CookieBanner />
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
