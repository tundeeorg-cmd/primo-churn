import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

// Display face with character (headlines, KPI numbers) + a neutral, highly
// legible body face + a tabular-figures face for ranked numeric columns —
// PROJECT_BRIEF.md Prompt 11's explicit type direction. These are named
// with a "-base" suffix (rather than the Tailwind-facing --font-display /
// --font-body names) so globals.css can layer the Thai font in front of
// them under :lang(th) without a circular custom-property reference — see
// the comment in globals.css.
const fraunces = Fraunces({
  variable: "--font-display-base",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body-base",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-tabular-base",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// i18n Step 4.1 — a proper Thai typeface. Paired with IBM Plex Mono
// (already used for tabular figures) rather than Noto Sans Thai, since the
// two IBM Plex families are designed to sit together.
const plexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Oberry Member Retention Radar | PRIMO",
    template: "%s | Oberry Member Retention Radar",
  },
  description:
    "A churn-prediction and member-segmentation engine built for PRIMO, the AI loyalty & CRM platform, demonstrated on Oberry, a Thai café chain. Illustrative figures, synthetic data.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read server-side so the first render already matches the saved
  // language — no flash of English before Thai loads (i18n Step 1).
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} ${plexSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
