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

const site = "https://centiv-gilt.vercel.app";
const title = "Centiv — research that pays in cents, and can stop";
const description =
  "Centiv is a research agent that buys data one call at a time, inside a spending cap you approve with Kite Passport. When a call would break the cap, it stops.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description,
  openGraph: {
    title,
    description,
    url: site,
    siteName: "Centiv",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Centiv — research that pays in cents, and can stop" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
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
