"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { setClientLocaleCookie } from "./cookie";
import {
  t as translate,
  tf as translateFormat,
  type Locale,
  type TranslationKey,
} from "./index";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  tf: (key: TranslationKey, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * `initialLocale` comes from the server-read cookie (app/layout.tsx) so the
 * very first render already matches the user's saved language — no flash
 * of English before Thai loads.
 */
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      setClientLocaleCookie(next);
      // Client component state (filters, selected member, etc.) lives in
      // useState inside Dashboard.tsx and is preserved across refresh() —
      // this only re-runs Server Components (e.g. dashboard/page.tsx's own
      // header strings, and <html lang> in the root layout), it does not
      // remount the client tree. That's what keeps Step 6's "switching
      // must not lose page state or reset filters" true.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
      tf: (key: TranslationKey, vars: Record<string, string | number>) =>
        translateFormat(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage() must be used within a LanguageProvider");
  return ctx;
}
