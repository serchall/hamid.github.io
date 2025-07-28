import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white dark:bg-gray-800 shadow-sm border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          <i className="fas fa-store me-2"></i>
          فروشگاه آنلاین
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/shop">
                <i className="fas fa-shopping-bag me-1"></i>
                فروشگاه
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/courses">
                <i className="fas fa-graduation-cap me-1"></i>
                دوره‌ها
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/videos">
                <i className="fas fa-video me-1"></i>
                ویدئوها
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary me-2"
              onClick={toggleTheme}
              title={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            >
              <i className={`fas fa-${isDark ? 'sun' : 'moon'}`}></i>
            </button>

            {user ? (
              <>
                <Link to="/cart" className="btn btn-outline-primary me-2 position-relative">
                  <i className="fas fa-shopping-cart"></i>
                  {getCartCount() > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {getCartCount()}
                    </span>
                  )}
                </Link>

                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-user me-1"></i>
                    {user.name}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="fas fa-user-circle me-2"></i>
                        پروفایل
                      </Link>
                    </li>
                    {user.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item" to="/admin">
                          <i className="fas fa-cog me-2"></i>
                          ادمین پنل
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        خروج
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary me-2">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  ورود
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <i className="fas fa-user-plus me-1"></i>
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 