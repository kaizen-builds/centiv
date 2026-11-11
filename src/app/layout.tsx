import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
});

const serif = Newsreader({
  variable: "--font-serif-ui",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Centiv — research that stops at your cap",
  description:
    "Research that stops at your cap. You approve a spending cap, and it buys data one call at a time, in cents, only when that call is worth what’s left.",
};

export const viewport: Viewport = {
  themeColor: "#fff9f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
