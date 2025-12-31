import type { Metadata } from "next";
// 구글 폰트 최적화 로드
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
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
  title: "My Portfolio | Data Driven",
  description: "Next.js와 Tailwind로 만든 포트폴리오",
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
      </body>
    </html>
  );
}
