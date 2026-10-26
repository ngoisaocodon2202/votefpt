import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FPT Polytechnic Đồng Nai | Cổng Bình Chọn Sinh Viên Tiêu Biểu 2026",
  description:
    "Cổng bình chọn trực tuyến thời gian thực tôn vinh gương mặt sinh viên tiêu biểu Cao đẳng FPT Polytechnic cơ sở Đồng Nai.",
  keywords: [
    "FPT Polytechnic Đồng Nai",
    "FPoly Đồng Nai",
    "Bình chọn sinh viên FPT Polytechnic",
    "Ong Vàng FPoly Đồng Nai",
    "FPT Education",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#F26F21]/20 selection:text-[#C84E09]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
