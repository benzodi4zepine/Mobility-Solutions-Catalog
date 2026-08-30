import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ar';

const STORAGE_KEY = 'mafaz.lang';

/** Returns the string for the active language. Every user-facing string goes through this. */
export type Translate = (en: string, ar: string) => string;

type LanguageValue = {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageValue | null>(null);

function readStoredLang(): Lang {
  // Storage is unavailable in private modes and some embedded browsers; the
  // site must still render, so fall back to English rather than throwing.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LanguageValue>(() => ({
    lang,
    dir,
    setLang,
    toggleLang: () => setLang(lang === 'en' ? 'ar' : 'en'),
    t: (en: string, ar: string) => (lang === 'ar' ? ar : en),
  }), [lang, dir, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside a LanguageProvider');
  return value;
}
