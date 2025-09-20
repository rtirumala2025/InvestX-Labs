import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher = () => {
  const { language, changeLanguage, availableLanguages } = useTranslation();

  const languageNames = {
    en: 'English',
    es: 'Español'
  };

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500/30 transition-all duration-200"
        aria-label="Select language"
      >
        {availableLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang] || lang}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
