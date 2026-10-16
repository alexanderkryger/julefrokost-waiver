import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond, Press_Start_2P } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const pixel = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Ansvarsfraskrivelse – Julefrokost Anno 2026",
  description:
    "Officiel og juridisk fuldstændig uforpligtende ansvarsfraskrivelse for julefrokosten på en ukendt destination.",
};

export const viewport: Viewport = {
  themeColor: "#0b0906",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body className={`${cinzel.variable} ${garamond.variable} ${pixel.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
