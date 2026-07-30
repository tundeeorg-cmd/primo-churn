import { cookies } from "next/headers";
import type { Locale } from "./index";
import { isLocale, LOCALE_COOKIE_NAME } from "./cookie";

// Server-only (next/headers). Never import this from a Client Component —
// see the comment at the top of cookie.ts.

/**
 * Server-side read, used by layout.tsx and any Server Component that needs
 * to render translated text without a client round-trip (avoids a flash of
 * English before Thai loads). Defaults to 'th' when no cookie is present.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(value) ? value : "th";
}
