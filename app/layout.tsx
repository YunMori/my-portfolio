import type { Metadata } from "next";
// 구글 폰트 최적화 로드
import { Gowun_Dodum, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/Providers";

const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gowun-dodum",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "My Portfolio | Yun Jong Seo",
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
        url: "/hero-profile.jpg", // Valid existing image
        width: 1200,
        height: 630,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* 아이콘 사용을 위한 FontAwesome CDN (간편 적용) */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {/* Devicon CDN for tech stack icons not in FontAwesome */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
      </head>
      <body
        className={`${gowunDodum.variable} ${spaceGrotesk.variable} antialiased bg-main text-stone-200`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
