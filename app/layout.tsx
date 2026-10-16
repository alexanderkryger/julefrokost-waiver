import type { Metadata, Viewport } from "next";
import { pixelFont, readableFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Legend of Julefrokost – Ansvarsfraskrivelse 2026",
  description: "Vælg din helt, bund en øl og underskriv ansvarsfraskrivelsen for julefrokosten på en ukendt destination.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body className={`${pixelFont.variable} ${readableFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
