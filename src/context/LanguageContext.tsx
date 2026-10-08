import React, { createContext, useContext, useState, useCallback } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const LATIN_DIGITS_MAP: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

export const toDevanagariDigits = (val: string | number): string => {
  return String(val).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
};

export const toLatinDigits = (val: string | number): string => {
  return String(val).replace(/[०-९]/g, (d) => LATIN_DIGITS_MAP[d] || d);
};

export const formatDigitsByLang = (val: string | number, lang: SupportedLanguage): string => {
  if (lang === 'mr') {
    return toDevanagariDigits(val);
  }
  return toLatinDigits(val);
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, explicitFallback?: string) => string;
  formatNumber: (val: string | number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('graminlink_lang');
      if (saved === 'mr' || saved === 'hi' || saved === 'en') {
        return saved as SupportedLanguage;
      }
    } catch {
      // ignore
    }
    return 'en'; // Default language: English
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('graminlink_lang', lang);
    } catch (e) {
      console.warn('Failed to save language in localStorage:', e);
    }
  }, []);

  const formatNumber = useCallback((val: string | number): string => {
    return formatDigitsByLang(val, language);
  }, [language]);

  const t = useCallback((
    key: string,
    paramsOrFallback?: Record<string, string | number> | string,
    explicitFallback?: string
  ): string => {
    let params: Record<string, string | number> | undefined;
    let fallback: string | undefined;

    if (typeof paramsOrFallback === 'string') {
      fallback = paramsOrFallback;
    } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
      params = paramsOrFallback;
      fallback = explicitFallback;
    }

    const currentDict = translations[language];
    let text = currentDict?.[key];

    // Missing key check: log console warning and fall back to English, never to another language
    if (!text) {
      if (language !== 'en') {
        console.warn(`[i18n] Missing translation for key "${key}" in language "${language}". Falling back to English.`);
      }
      text = translations.en?.[key];
    }

    if (!text) {
      console.warn(`[i18n] Missing translation for key "${key}" in English fallback dictionary.`);
      text = fallback || key;
    }

    // Replace params if provided
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        const formattedVal = formatDigitsByLang(pVal, language);
        text = text.replace(new RegExp(`{${pKey}}`, 'g'), formattedVal);
      });
    }

    // Convert digits: Devanagari in Marathi, Latin in English and Hindi
    return formatDigitsByLang(text, language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
