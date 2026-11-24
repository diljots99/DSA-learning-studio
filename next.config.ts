import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the URLs the static site used: /chapters/<slug>/
  trailingSlash: true,
  // Chapter labs are plain scripts that attach listeners once; Strict Mode's
  // double-run of effects in development would attach them twice.
  reactStrictMode: false,
  // Chapter content is read from disk on the server.
  outputFileTracingIncludes: {
    "/chapters/[slug]": ["./content/**/*"],
    "/": ["./content/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Google sign-in opens a popup that must be able to report back to this page.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
