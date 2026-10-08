import { SupportedLanguage } from '../types';
import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en,
  mr,
  hi
};
