import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
    >
      <i className={`fas fa-${isDark ? 'sun' : 'moon'}`}></i>
    </button>
  );
};

export default ThemeToggle; 