import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="auth-card">
            <div className="auth-header text-center mb-4">
              <i className="fas fa-sign-in-alt fa-3x text-primary mb-3"></i>
              <h2>ورود به حساب کاربری</h2>
              <p className="text-muted">اطلاعات خود را وارد کنید</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">ایمیل</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">رمز عبور</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="رمز عبور"
                  required
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="mb-3">
                <Link to="/forgot-password" className="text-decoration-none">
                  رمز عبور را فراموش کرده‌اید؟
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    در حال ورود...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    ورود
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer text-center">
              <p className="mb-0">
                حساب کاربری ندارید؟{' '}
                <Link to="/register" className="text-decoration-none">
                  ثبت‌نام کنید
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
        }
        
        .auth-card {
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 2rem;
          border: 1px solid var(--border-color);
        }
        
        .auth-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.5rem;
        }
        
        .auth-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default Login; 