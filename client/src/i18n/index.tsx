import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type MsgKey } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';
export type Params = Record<string, string | number>;
export type TFn = (key: MsgKey, params?: Params) => string;
export type TPFn = (key: MsgKey, n: number, params?: Params) => string;

const dictionaries: Record<Lang, Record<MsgKey, string>> = { en, ar };
const STORAGE_KEY = 'kanbot.lang';

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** English: one | other. Arabic: one | two | few (3–10) | many (0 and 11+ use the last forms). */
export function pluralIndex(lang: Lang, n: number): number {
  if (lang === 'ar') {
    if (n === 1) return 0;
    if (n === 2) return 1;
    const mod = n % 100;
    return mod >= 3 && mod <= 10 ? 2 : n === 0 ? 2 : 3;
  }
  return n === 1 ? 0 : 1;
}

export function translate(lang: Lang, key: MsgKey, params?: Params): string {
  return interpolate(dictionaries[lang][key] ?? en[key], params);
}

export function translatePlural(lang: Lang, key: MsgKey, n: number, params?: Params): string {
  const forms = (dictionaries[lang][key] ?? en[key]).split('|');
  const form = forms[Math.min(pluralIndex(lang, n), forms.length - 1)] ?? '';
  return interpolate(form, { n, ...params });
}

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  // Keep English as the required v1 default; Arabic is enabled only by an explicit user choice.
  return 'en';
}

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: TFn;
  tp: TPFn;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'ar' : 'en')), []);
  const t = useCallback<TFn>((key, params) => translate(lang, key, params), [lang]);
  const tp = useCallback<TPFn>((key, n, params) => translatePlural(lang, key, n, params), [lang]);

  const value = useMemo(() => ({ lang, dir, setLang, toggleLang, t, tp }), [lang, dir, setLang, toggleLang, t, tp]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export type { MsgKey };
