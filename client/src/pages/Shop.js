import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('خطا در بارگذاری محصولات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/products/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('خطا در بارگذاری دسته‌بندی‌ها');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">
          <i className="fas fa-shopping-bag text-primary me-2"></i>
          فروشگاه
        </h1>
        <div className="d-flex gap-2">
          <span className="text-muted">
            {filteredProducts.length} محصول
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="جستجو در محصولات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">مرتب‌سازی بر اساس نام</option>
              <option value="price-low">قیمت: کم به زیاد</option>
              <option value="price-high">قیمت: زیاد به کم</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSortBy('name');
              }}
            >
              <i className="fas fa-refresh me-1"></i>
              پاک کردن
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">محصولی یافت نشد</h4>
          <p className="text-muted">لطفاً فیلترهای خود را تغییر دهید</p>
        </div>
      ) : (
        <div className="row">
          {filteredProducts.map(product => (
            <div key={product._id} className="col-md-6 col-lg-4 col-xl-3 mb-4">
              <div className="product-card h-100">
                <div className="product-image">
                  <img
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="img-fluid"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  <div className="product-overlay">
                    <Link
                      to={`/product/${product._id}`}
                      className="btn btn-primary btn-sm me-2"
                    >
                      <i className="fas fa-eye me-1"></i>
                      مشاهده
                    </Link>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="fas fa-cart-plus me-1"></i>
                      افزودن
                    </button>
                  </div>
                </div>
                <div className="product-info p-3">
                  <h5 className="product-title mb-2">
                    <Link to={`/product/${product._id}`} className="text-decoration-none">
                      {product.name}
                    </Link>
                  </h5>
                  <p className="product-description text-muted small mb-2">
                    {product.description?.substring(0, 100)}...
                  </p>
                  <div className="product-meta d-flex justify-content-between align-items-center">
                    <span className="product-price fw-bold text-primary">
                      {product.price?.toLocaleString()} تومان
                    </span>
                    <span className="product-category badge bg-secondary">
                      {product.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .product-card {
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          transition: var(--transition);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .product-image {
          position: relative;
          overflow: hidden;
          height: 200px;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition);
        }
        
        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition);
        }
        
        .product-card:hover .product-overlay {
          opacity: 1;
        }
        
        .product-card:hover .product-image img {
          transform: scale(1.1);
        }
        
        .product-title {
          color: var(--text-primary);
        }
        
        .product-title:hover {
          color: var(--primary-color);
        }
        
        .filters-section {
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
};

export default Shop; 