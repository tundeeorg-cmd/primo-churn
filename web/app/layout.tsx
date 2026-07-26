import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display face with character (headlines, KPI numbers) + a neutral, highly
// legible body face + a tabular-figures face for ranked numeric columns —
// PROJECT_BRIEF.md Prompt 11's explicit type direction.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-tabular",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Oberry Member Retention Radar | PRIMO",
    template: "%s | Oberry Member Retention Radar",
  },
  description:
    "A churn-prediction and member-segmentation engine built for PRIMO, the AI loyalty & CRM platform, demonstrated on Oberry, a Thai café chain. Illustrative figures, synthetic data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
