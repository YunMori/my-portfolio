import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next.js 인라인 스크립트(hydration) 때문에 script-src에 'unsafe-inline'이 필요하고,
// 개발 모드(HMR)에서만 'unsafe-eval'을 추가로 허용한다
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  // 이력서 빌더의 <PDFViewer>는 생성한 PDF를 <iframe src="blob:...">로 띄운다.
  // frame-src 지시자가 없으면 default-src 'self'로 폴백해 blob:이 막히고 미리보기가 통째로
  // 빈 화면이 된다. 남이 우리를 임베드하는 것은 frame-ancestors 'none'이 계속 막는다.
  "frame-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
