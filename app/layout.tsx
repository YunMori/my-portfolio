import type { Metadata } from "next";
// 구글 폰트 최적화 로드
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "My Portfolio | Yun Jong Seo",
  description: "Full Stack Developer Yun Jong Seo's Portfolio. Data driven design and scalable architecture.",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Yun Jong Seo | Full Stack Developer",
    description: "Data driven design and scalable architecture.",
    url: "https://my-portfolio.com", // Replace with actual URL
    siteName: "Yun Jong Seo Portfolio",
    images: [
      {
        url: "/og-image.jpg", // Needs to be added to public
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yun Jong Seo | Full Stack Developer",
    description: "Data driven design and scalable architecture.",
  },
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
      </head>
      <body
        className={`${notoSansKr.variable} ${spaceGrotesk.variable} antialiased bg-main text-stone-200`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
