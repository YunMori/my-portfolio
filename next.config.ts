import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next.js 인라인 스크립트(hydration) 때문에 script-src에 'unsafe-inline'이 필요하고,
// 개발 모드(HMR)에서만 'unsafe-eval'을 추가로 허용한다.
//
// 'wasm-unsafe-eval'은 이력서 빌더 때문에 필요하다. @react-pdf/pdfkit v6는 PDF 스트림
// 압축에 emscripten으로 빌드한 zlib(wasm)을 쓰는데, WebAssembly.instantiate()는 CSP가
// 명시적으로 허용하지 않으면 막힌다. 개발 모드에서는 'unsafe-eval'이 이걸 덮어줘서
// 통과하지만 프로덕션 빌드에서는 미리보기와 PDF 내보내기가 둘 다 CompileError로 죽었다.
//
// 'unsafe-eval'을 켜지 않고 'wasm-unsafe-eval'만 쓴다 — 이 토큰은 WebAssembly 컴파일만
// 허용하고 eval()/new Function()은 계속 막는다 (CSP Level 3). 이걸 모르는 구형 브라우저는
// 토큰을 무시하므로 wasm이 여전히 차단되지만, 그 경우 빌더가 빈 화면 대신 에러 메시지를
// 보여준다 (components/admin/resume/ResumePreview.tsx).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
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
      {
        // 이력서 빌더가 쓰는 한글 TTF는 합쳐서 4MB에 가깝고 내용이 바뀌지 않는다.
        // 캐시가 없으면 빌더에 들어올 때마다 다시 받느라 첫 미리보기가 그만큼 늦어진다.
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
