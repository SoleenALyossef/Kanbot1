import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export const ACCENTS = ['indigo', 'violet', 'teal', 'rose', 'slate'] as const;
export type Accent = (typeof ACCENTS)[number];

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}
const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = 'kanbot.theme';
const ACCENT_KEY = 'kanbot.accent';

function initialTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialAccent(): Accent {
  const attr = document.documentElement.dataset.accent as Accent | undefined;
  return attr && (ACCENTS as readonly string[]).includes(attr) ? attr : 'indigo';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccentState] = useState<Accent>(initialAccent);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* storage unavailable */
    }
  }, [accent]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const setAccent = useCallback((a: Accent) => setAccentState(a), []);
  const value = useMemo(() => ({ theme, toggle, accent, setAccent }), [theme, toggle, accent, setAccent]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
