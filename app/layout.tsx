import type { Metadata } from "next";
import { Shippori_Mincho, Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WeatherOverlay from "@/components/WeatherOverlay";
import { getSkyState } from "@/lib/weather";

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "600"],
  subsets: ["latin"],
  // Google Fonts omits subset comments on CJK shards, causing excess preloads.
  preload: false,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { brightness } = await getSkyState();

  return (
    <html
      lang="ko"
      className={`${shipporiMincho.variable} ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
      style={{ "--sky-brightness": brightness } as React.CSSProperties}
    >
      <body className="paper-texture relative flex min-h-full flex-col font-sans">
        <WeatherOverlay />
        <SiteHeader />
        <main className="relative z-10 flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
