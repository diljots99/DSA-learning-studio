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
};

export default nextConfig;
