import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: 'fas fa-shopping-bag',
      title: 'فروشگاه آنلاین',
      description: 'محصولات متنوع با کیفیت بالا و قیمت مناسب',
      link: '/shop'
    },
    {
      icon: 'fas fa-graduation-cap',
      title: 'دوره‌های آموزشی',
      description: 'آموزش‌های تخصصی با بهترین اساتید',
      link: '/courses'
    },
    {
      icon: 'fas fa-video',
      title: 'ویدئوهای آموزشی',
      description: 'ویدئوهای رایگان و پولی در زمینه‌های مختلف',
      link: '/videos'
    },
    {
      icon: 'fas fa-comments',
      title: 'پیام‌رسان',
      description: 'ارتباط مستقیم با پشتیبانی و سایر کاربران',
      link: '/chat'
    }
  ];

  const stats = [
    { number: '1000+', label: 'محصول' },
    { number: '500+', label: 'دوره آموزشی' },
    { number: '10000+', label: 'کاربر راضی' },
    { number: '24/7', label: 'پشتیبانی' }
  ];

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero-section text-center py-5 mb-5">
        <div className="container">
          <h1 className="display-4 fw-bold mb-4">
            <i className="fas fa-store text-primary me-3"></i>
            فروشگاه آنلاین و مرکز آموزشی
          </h1>
          <p className="lead mb-4">
            بهترین محصولات، دوره‌های آموزشی و ویدئوهای تخصصی را در یک مکان پیدا کنید
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="btn btn-primary btn-lg me-3">
              <i className="fas fa-shopping-cart me-2"></i>
              شروع خرید
            </Link>
            <Link to="/courses" className="btn btn-outline-primary btn-lg">
              <i className="fas fa-graduation-cap me-2"></i>
              مشاهده دوره‌ها
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section mb-5">
        <div className="container">
          <h2 className="text-center mb-5">خدمات ما</h2>
          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-3 mb-4">
                <div className="feature-card text-center p-4 h-100">
                  <div className="feature-icon mb-3">
                    <i className={`${feature.icon} fa-3x text-primary`}></i>
                  </div>
                  <h4 className="mb-3">{feature.title}</h4>
                  <p className="text-muted mb-3">{feature.description}</p>
                  <Link to={feature.link} className="btn btn-outline-primary">
                    مشاهده بیشتر
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section mb-5">
        <div className="container">
          <div className="row text-center">
            {stats.map((stat, index) => (
              <div key={index} className="col-6 col-md-3 mb-4">
                <div className="stat-card p-3">
                  <div className="stat-number display-6 fw-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="stat-label text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section text-center py-5">
        <div className="container">
          <h2 className="mb-4">آماده شروع هستید؟</h2>
          <p className="lead mb-4">
            همین حالا ثبت‌نام کنید و از امکانات ویژه ما بهره‌مند شوید
          </p>
          <Link to="/register" className="btn btn-success btn-lg me-3">
            <i className="fas fa-user-plus me-2"></i>
            ثبت‌نام رایگان
          </Link>
          <Link to="/login" className="btn btn-outline-success btn-lg">
            <i className="fas fa-sign-in-alt me-2"></i>
            ورود
          </Link>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%);
          color: white;
          border-radius: var(--border-radius-lg);
          margin: -2rem -2rem 2rem -2rem;
        }
        
        .feature-card {
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          transition: var(--transition);
          border: 1px solid var(--border-color);
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .stat-card {
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
        }
        
        .cta-section {
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          margin: 0 -2rem -2rem -2rem;
        }
      `}</style>
    </div>
  );
};

export default Home; 