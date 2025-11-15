import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserPreferences } from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { preferences, updateNestedPreference } = useUserPreferences();
  const [theme, setTheme] = useState(preferences.theme || 'light');

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateNestedPreference('theme', newTheme);
  };

  const setLightTheme = () => {
    setTheme('light');
    updateNestedPreference('theme', 'light');
  };

  const setDarkTheme = () => {
    setTheme('dark');
    updateNestedPreference('theme', 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

