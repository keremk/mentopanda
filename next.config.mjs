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
        ? "'self' http://localhost:54321 http://127.0.0.1:54321 ws://localhost:54321 ws://127.0.0.1:54321 https://api.openai.com https://*.supabase.co"
        : "'self' https://api.openai.com https://*.supabase.co";

    const imgSrc =
      process.env.NODE_ENV === "development"
        ? "'self' blob: data: http://localhost:54321 http://127.0.0.1:54321 https:"
        : "'self' blob: data: https:";

    const mediaSrc =
      process.env.NODE_ENV === "development"
        ? "'self' http://localhost:54321 http://127.0.0.1:54321 https://*.supabase.co"
        : "'self' https://*.supabase.co";

    // Add font-src directive
    const fontSrc = "'self' data:";

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
