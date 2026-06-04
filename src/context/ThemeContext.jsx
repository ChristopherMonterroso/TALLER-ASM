import { createContext, useContext, useEffect, useState } from 'react';
import { getConfig, setConfig } from '../firebase/firestore';

const THEMES = {
  'steel-dark': {
    '--color-bg': '#0F172A',
    '--color-surface': '#1E293B',
    '--color-surface-2': '#263347',
    '--color-primary': '#3B82F6',
    '--color-primary-hover': '#2563EB',
    '--color-primary-light': 'rgba(59,130,246,0.15)',
    '--color-accent': '#F59E0B',
    '--color-accent-hover': '#D97706',
    '--color-text': '#E2E8F0',
    '--color-text-muted': '#94A3B8',
    '--color-border': 'rgba(255,255,255,0.08)',
    '--color-danger': '#EF4444',
    '--color-success': '#22C55E',
    '--color-warning': '#F59E0B',
    '--shadow': '0 4px 24px rgba(0,0,0,0.4)',
  },
  'carbon-fire': {
    '--color-bg': '#111111',
    '--color-surface': '#1C1C1C',
    '--color-surface-2': '#2A2A2A',
    '--color-primary': '#EF4444',
    '--color-primary-hover': '#DC2626',
    '--color-primary-light': 'rgba(239,68,68,0.15)',
    '--color-accent': '#F97316',
    '--color-accent-hover': '#EA580C',
    '--color-text': '#F5F5F5',
    '--color-text-muted': '#A3A3A3',
    '--color-border': 'rgba(255,255,255,0.07)',
    '--color-danger': '#EF4444',
    '--color-success': '#22C55E',
    '--color-warning': '#F97316',
    '--shadow': '0 4px 24px rgba(0,0,0,0.5)',
  },
  'midnight-garage': {
    '--color-bg': '#0D1117',
    '--color-surface': '#161B22',
    '--color-surface-2': '#21262D',
    '--color-primary': '#10B981',
    '--color-primary-hover': '#059669',
    '--color-primary-light': 'rgba(16,185,129,0.15)',
    '--color-accent': '#F0B429',
    '--color-accent-hover': '#D99F20',
    '--color-text': '#C9D1D9',
    '--color-text-muted': '#6E7681',
    '--color-border': 'rgba(255,255,255,0.07)',
    '--color-danger': '#EF4444',
    '--color-success': '#22C55E',
    '--color-warning': '#F0B429',
    '--shadow': '0 4px 24px rgba(0,0,0,0.45)',
  },
  'classic-light': {
    '--color-bg': '#F8FAFC',
    '--color-surface': '#FFFFFF',
    '--color-surface-2': '#F1F5F9',
    '--color-primary': '#2563EB',
    '--color-primary-hover': '#1D4ED8',
    '--color-primary-light': 'rgba(37,99,235,0.08)',
    '--color-accent': '#D97706',
    '--color-accent-hover': '#B45309',
    '--color-text': '#0F172A',
    '--color-text-muted': '#64748B',
    '--color-border': '#E2E8F0',
    '--color-danger': '#EF4444',
    '--color-success': '#10B981',
    '--color-warning': '#F59E0B',
    '--shadow': '0 4px 20px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.02)',
  }
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('steel-dark');

  const applyTheme = (themeName) => {
    const vars = THEMES[themeName] || THEMES['steel-dark'];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    setThemeState(themeName);
  };

  useEffect(() => {
    getConfig('appearance').then(data => {
      const t = data?.theme || 'steel-dark';
      applyTheme(t);
    });
  }, []);

  const changeTheme = async (themeName) => {
    applyTheme(themeName);
    await setConfig('appearance', { theme: themeName });
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export { THEMES };
