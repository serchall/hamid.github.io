import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="settings-page fade-in">
      <h2 className="mb-4">
        <i className="fas fa-cog text-primary me-2"></i>
        تنظیمات
      </h2>
      <div className="card p-4 mb-4">
        <h5 className="mb-3">ظاهر سایت</h5>
        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="themeSwitch"
            checked={isDark}
            onChange={toggleTheme}
          />
          <label className="form-check-label" htmlFor="themeSwitch">
            {isDark ? 'تم تاریک' : 'تم روشن'}
          </label>
        </div>
      </div>
      <div className="card p-4 mb-4">
        <h5 className="mb-3">اطلاعات کاربری</h5>
        <p><strong>نام:</strong> {user?.name}</p>
        <p><strong>ایمیل:</strong> {user?.email}</p>
        <p><strong>نقش:</strong> {user?.role === 'admin' ? 'مدیر' : 'کاربر'}</p>
      </div>
    </div>
  );
};

export default Settings; 