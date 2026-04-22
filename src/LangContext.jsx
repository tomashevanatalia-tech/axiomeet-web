import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detectInitialLang, persistLang, translate, SUPPORTED_LANGS, LANG_LABELS } from './i18n';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => detectInitialLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang: (next) => {
      if (!SUPPORTED_LANGS.includes(next)) return;
      persistLang(next);
      setLangState(next);
    },
    t: (key) => translate(lang, key),
    supportedLangs: SUPPORTED_LANGS,
    langLabels: LANG_LABELS,
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

/**
 * Small language switcher, used on auth pages.
 */
export function LangSwitcher({ compact = false }) {
  const { lang, setLang, supportedLangs, langLabels } = useLang();
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 3,
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 8,
        fontSize: compact ? 11 : 12,
      }}
    >
      {supportedLangs.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          style={{
            padding: compact ? '3px 8px' : '4px 10px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: 0.5,
            background: code === lang ? 'var(--primary, #1b3a5c)' : 'transparent',
            color: code === lang ? '#fff' : 'var(--text, #333)',
          }}
        >
          {langLabels[code]}
        </button>
      ))}
    </div>
  );
}
