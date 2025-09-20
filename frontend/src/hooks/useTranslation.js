import { useState, useEffect } from 'react';

// Import translation files
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';

const translationData = {
  en: enTranslations,
  es: esTranslations
};

export const useTranslation = () => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to English
    return localStorage.getItem('language') || 'en';
  });

  const [translations, setTranslations] = useState(translationData[language]);

  useEffect(() => {
    // Update translations when language changes
    setTranslations(translationData[language]);
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, fallback = key) => {
    // Navigate through nested object keys
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : fallback;
  };

  const changeLanguage = (newLanguage) => {
    if (translationData[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  return {
    t,
    language,
    changeLanguage,
    availableLanguages: Object.keys(translationData)
  };
};
