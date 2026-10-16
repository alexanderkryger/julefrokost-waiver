import { Press_Start_2P, VT323 } from "next/font/google";

export const pixelFont = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

// Læsevenlig pixelskrift med fuld dansk understøttelse (æøå ÆØÅ §)
export const readableFont = VT323({
  variable: "--font-vt",
  subsets: ["latin"],
  weight: "400",
});
