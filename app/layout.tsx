import type { Metadata } from "next";
// 구글 폰트 최적화 로드
import { Gowun_Dodum, Syne } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getBaseUrl } from "@/utils/url";

const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gowun-dodum",
  display: 'swap',
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-syne",
  display: 'swap',
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Morifolio",
  description: "Full Stack Developer Yun Jong Seo's Portfolio. Data driven design and scalable architecture.",
  keywords: ["Full Stack Developer", "Next.js", "React", "Portfolio", "Web Development", "Yun Jong Seo"],
  authors: [{ name: "Yun Jong Seo" }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Yun Jong Seo | Full Stack Developer",
    description: "Data driven design and scalable architecture.",
    url: baseUrl,
    siteName: "Yun Jong Seo Portfolio",
    images: [
      {
        // public/hero-profile.jpg 의 실제 크기. 선언값이 파일과 다르면 일부 플랫폼이
        // 미리보기를 잘못 자르거나 아예 버린다.
        url: "/hero-profile.jpg",
        width: 413,
        height: 531,
        alt: "Yun Jong Seo Profile"
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yun Jong Seo | Full Stack Developer",
    description: "Data driven design and scalable architecture.",
    images: ["/hero-profile.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Yun Jong Seo',
  jobTitle: 'Full Stack Developer',
  url: baseUrl,
  sameAs: [
    'https://github.com/YunMori',
  ],
  knowsAbout: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Node.js'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* CDN 도메인 사전 연결 (DNS+TLS 핸드셰이크 미리 처리 → LCP 개선) */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${gowunDodum.variable} ${syne.variable} antialiased bg-main text-stone-200 grain`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
        {/* 아이콘 CDN — 비동기 로딩 (렌더 블로킹 제거 → LCP/Speed Index 개선) */}
        <Script
          id="load-icon-fonts"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var fa=document.createElement('link');fa.rel='stylesheet';fa.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';fa.integrity='sha384-iw3OoTErCYJJB9mCa8LNS2hbsQ7M3C0EpIsO/H5+EGAkPGc6rk+V8i04oW/K5xq0';fa.crossOrigin='anonymous';document.head.appendChild(fa);
              var di=document.createElement('link');di.rel='stylesheet';di.href='https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0/devicon.min.css';di.integrity='sha384-6iv3tXABd3c9DYulXujJl8n22ahn/12f45MomxoPv6jBX4LBE4gNJjfkx5mAKIqR';di.crossOrigin='anonymous';document.head.appendChild(di);
            `
          }}
        />
      </body>
    </html>
  );
}
