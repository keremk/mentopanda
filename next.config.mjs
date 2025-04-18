/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(process.env.NODE_ENV === "development"
        ? [
            { protocol: "http", hostname: "localhost" },
            { protocol: "http", hostname: "127.0.0.1" },
          ]
        : []),
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  headers: async () => {
    const connectSrc =
      process.env.NODE_ENV === "development"
        ? "'self' http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321 https://api.openai.com https://*.supabase.co https://*.posthog.com https://eu.i.posthog.com https://us.i.posthog.com https://app.posthog.com"
        : "'self' https://api.openai.com https://*.supabase.co https://*.posthog.com https://eu.i.posthog.com https://us.i.posthog.com https://app.posthog.com";

    const imgSrc =
      process.env.NODE_ENV === "development"
        ? "'self' blob: data: http://localhost:54321 http://127.0.0.1:54321 https:"
        : "'self' blob: data: https:";

    const mediaSrc =
      process.env.NODE_ENV === "development"
        ? "'self' http://localhost:54321 http://127.0.0.1:54321 https://*.supabase.co https://*.youtube.com https://*.ytimg.com"
        : "'self' https://*.supabase.co https://*.youtube.com https://*.ytimg.com";

    // Add font-src directive
    const fontSrc = "'self' data:";

    // Add frame-src directive for YouTube embeds
    const frameSrc =
      process.env.NODE_ENV === "development"
        ? "'self' https://*.youtube.com https://*.youtube-nocookie.com"
        : "'self' https://*.youtube.com https://*.youtube-nocookie.com";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src ${imgSrc}`,
              `media-src ${mediaSrc}`,
              `connect-src ${connectSrc}`,
              `font-src ${fontSrc}`,
              `frame-src ${frameSrc}`,
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
