import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/', icon: 'fas fa-home', label: 'خانه' },
    { path: '/shop', icon: 'fas fa-shopping-bag', label: 'فروشگاه' },
    { path: '/courses', icon: 'fas fa-graduation-cap', label: 'دوره‌ها' },
    { path: '/videos', icon: 'fas fa-video', label: 'ویدئوها' },
    { path: '/chat', icon: 'fas fa-comments', label: 'پیام‌رسان' },
    ...(user ? [{ path: '/profile', icon: 'fas fa-user', label: 'پروفایل' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: 'fas fa-cog', label: 'ادمین' }] : [])
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="btn btn-link sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <i className={`${item.icon} me-2`}></i>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {user && !isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role === 'admin' ? 'مدیر' : 'کاربر'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 