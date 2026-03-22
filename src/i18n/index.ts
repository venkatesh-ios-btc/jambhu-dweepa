import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { kn } from './kn';
import { en } from './en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      kn: { translation: kn },
      en: { translation: en },
    },
    fallbackLng: 'kn',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
