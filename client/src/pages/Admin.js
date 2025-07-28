import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/products'),
        axios.get('/api/admin/orders')
      ]);
      setUsers(usersRes.data.users || []);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
    } catch (e) {
      setUsers([]); setProducts([]); setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-5">دسترسی فقط برای ادمین</div>;
  }

  return (
    <div className="admin-page fade-in">
      <h2 className="mb-4">
        <i className="fas fa-cog text-primary me-2"></i>
        ادمین پنل
      </h2>
      <div className="btn-group mb-4">
        <button className={`btn btn-outline-primary${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>کاربران</button>
        <button className={`btn btn-outline-primary${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>محصولات</button>
        <button className={`btn btn-outline-primary${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>سفارشات</button>
      </div>
      {loading ? (
        <div className="text-center py-5">در حال بارگذاری...</div>
      ) : (
        <>
          {tab === 'users' && (
            <div className="card p-3 mb-4">
              <h5 className="mb-3">لیست کاربران</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>نام</th>
                      <th>ایمیل</th>
                      <th>نقش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'products' && (
            <div className="card p-3 mb-4">
              <h5 className="mb-3">لیست محصولات</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>نام</th>
                      <th>قیمت</th>
                      <th>دسته‌بندی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.price?.toLocaleString()} تومان</td>
                        <td>{p.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'orders' && (
            <div className="card p-3 mb-4">
              <h5 className="mb-3">لیست سفارشات</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>شماره سفارش</th>
                      <th>کاربر</th>
                      <th>مبلغ</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td>#{o._id.slice(-6)}</td>
                        <td>{o.user?.name || '---'}</td>
                        <td>{o.total?.toLocaleString()} تومان</td>
                        <td>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin; 