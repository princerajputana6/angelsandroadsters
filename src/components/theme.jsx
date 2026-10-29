'use client';
import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Scoped light/dark theming for the admin console and race-control shells
 * (the public marketing site stays dark). The provider renders a wrapper with
 * `data-theme`, which flips the charcoal CSS variables (see globals.css).
 *
 * One shared preference key ('ar-theme') is persisted in localStorage so the
 * toggle is consistent across admin + race. Until the user toggles, each area
 * uses its own `defaultTheme` (race-control defaults to light for daytime use).
 */
const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} });
const STORAGE_KEY = 'ar-theme';

export function ThemeProvider({ defaultTheme = 'dark', className = '', children }) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch (_) { /* storage blocked — use default */ }
  }, []);

  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* ignore */ }
      return next;
    });

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div data-theme={theme} className={className}>{children}</div>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center gap-2 rounded-full border border-charcoal-700 px-3 py-1.5 text-xs font-medium hover:border-terra-500 transition ${className}`}
    >
      <span className="text-sm">{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
