import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      fetchOrders();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders/my');
      setOrders(res.data.orders || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/profile', form);
      updateProfile(res.data.user);
      setEditMode(false);
    } catch (e) {}
  };

  if (!user) return <div className="text-center py-5">برای مشاهده پروفایل باید وارد شوید.</div>;

  return (
    <div className="profile-page fade-in">
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card p-4 text-center">
            <div className="mb-3">
              <i className="fas fa-user-circle fa-5x text-primary"></i>
            </div>
            <h4>{user.name}</h4>
            <div className="text-muted mb-2">{user.email}</div>
            <div className="badge bg-secondary">{user.role === 'admin' ? 'مدیر' : 'کاربر'}</div>
          </div>
        </div>
        <div className="col-md-8 mb-4">
          <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>اطلاعات شخصی</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'انصراف' : 'ویرایش'}
              </button>
            </div>
            {editMode ? (
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label">نام</label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">ایمیل</label>
                  <input className="form-control" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">شماره تماس</label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">آدرس</label>
                  <input className="form-control" name="address" value={form.address} onChange={handleChange} />
                </div>
                <button className="btn btn-success" type="submit">ذخیره</button>
              </form>
            ) : (
              <div>
                <p><strong>نام:</strong> {user.name}</p>
                <p><strong>ایمیل:</strong> {user.email}</p>
                <p><strong>شماره تماس:</strong> {user.phone || 'ثبت نشده'}</p>
                <p><strong>آدرس:</strong> {user.address || 'ثبت نشده'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card p-4 mb-4">
        <h5 className="mb-3">سفارشات من</h5>
        {loading ? (
          <div className="text-center py-3">در حال بارگذاری...</div>
        ) : orders.length === 0 ? (
          <div className="text-muted">سفارشی ثبت نشده است.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>تاریخ</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td>{order.total?.toLocaleString()} تومان</td>
                    <td>
                      <span className={`badge bg-${order.status === 'paid' ? 'success' : 'warning'}`}>
                        {order.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 