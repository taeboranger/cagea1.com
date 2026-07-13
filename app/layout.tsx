import type { Metadata } from "next";
import { Shippori_Mincho, Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SnowOverlay from "@/components/SnowOverlay";

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cagea1.com",
  description: "개인 웹사이트 — 이력서와 사진 갤러리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${shipporiMincho.variable} ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="paper-texture relative flex min-h-full flex-col font-sans">
        <SnowOverlay />
        <SiteHeader />
        <main className="relative z-10 flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
