import React, { createContext, useContext, useState, useCallback } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const LATIN_DIGITS_MAP: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function indexToLetterTag(idx: number): string {
  let s = '';
  let n = idx;
  do {
    s = ALPHABET[n % 26] + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export const toDevanagariDigits = (val: string | number): string => {
  const str = String(val);

  // Protect vehicle registration plates (e.g. MH-08-E-4219, MH 12 Q 8821, MH-04-T-1904)
  // and internal vehicle IDs / hub codes (e.g. veh-1, veh-2, HUB-RAT-DAP-01)
  const vehicleAndCodeRegex = /\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4}|veh(?:icle)?[-_][0-9a-zA-Z_-]+|HUB-[0-9a-zA-Z_-]+)\b/gi;

  const placeholders: string[] = [];
  const masked = str.replace(vehicleAndCodeRegex, (match) => {
    placeholders.push(match);
    return `__PROTECTEDID_${indexToLetterTag(placeholders.length - 1)}__`;
  });

  // Convert remaining Latin digits [0-9] to Devanagari
  const converted = masked.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);

  // Restore protected vehicle IDs and codes
  return converted.replace(/__PROTECTEDID_([A-Z]+)__/g, (_, tag) => {
    let idx = 0;
    for (let i = 0; i < tag.length; i++) {
      idx = idx * 26 + (tag.charCodeAt(i) - 65 + 1);
    }
    return placeholders[idx - 1] || '';
  });
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
        const isVehicleOrDriverKey = /^(vehicleId|vehicleNumber|driver|driverName|vehicle|plate)$/i.test(pKey);
        const formattedVal = isVehicleOrDriverKey ? String(pVal) : formatDigitsByLang(pVal, language);
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
