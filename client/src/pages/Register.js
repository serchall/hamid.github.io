import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'نام الزامی است';
    if (!formData.email.trim()) newErrors.email = 'ایمیل الزامی است';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'ایمیل معتبر نیست';
    if (!formData.password) newErrors.password = 'رمز عبور الزامی است';
    else if (formData.password.length < 8) newErrors.password = 'رمز عبور حداقل ۸ کاراکتر باشد';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    if (result.success) {
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="auth-card">
            <div className="auth-header text-center mb-4">
              <i className="fas fa-user-plus fa-3x text-primary mb-3"></i>
              <h2>ثبت‌نام</h2>
              <p className="text-muted">فرم ثبت‌نام را تکمیل کنید</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">نام</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="نام کامل"
                  required
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
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
                  placeholder="حداقل ۸ کاراکتر"
                  required
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">تکرار رمز عبور</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="تکرار رمز عبور"
                  required
                />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
              <button
                type="submit"
                className="btn btn-success w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    در حال ثبت‌نام...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus me-2"></i>
                    ثبت‌نام
                  </>
                )}
              </button>
            </form>
            <div className="auth-footer text-center">
              <p className="mb-0">
                حساب کاربری دارید؟{' '}
                <Link to="/login" className="text-decoration-none">
                  وارد شوید
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

export default Register; 