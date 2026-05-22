import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Alert } from '../../components/common/index';
import './AuthPages.css';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/admin/dashboard';

  // Hardcode the admin email
  const [form, setForm]       = useState({ email: 'admin@edulearn.com', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent changing the email
    if (name === 'email') return;
    
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      const { accessToken, refreshToken, userId, fullName, email, role } = res.data;
      const user = { userId, fullName, email, role };
      
      if (user.role !== 'ADMIN') {
        setApiError('Unauthorized: Account is not an administrator.');
        setLoading(false);
        return;
      }

      login(user, accessToken, refreshToken);
      navigate(from);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">🎓 EduLearn</Link>
          <h1>Secure<br /><span className="gradient-text">Admin Portal</span></h1>
          <p>Authorized access only. Monitor and manage the entire learning platform.</p>
          <div className="auth-features">
            {['🛡️ Secure infrastructure', '👥 Manage thousands of users', '📊 View global analytics', '⚙️ Control platform settings'].map(f => (
              <div key={f} className="auth-feature">{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Administrator Sign In</h2>
          <p className="auth-subtitle">Restricted to system administrators</p>

          {apiError && <Alert type="error">{apiError}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input name="email" type="email" className="form-control"
                value={form.email} readOnly style={{ backgroundColor: 'var(--bg-lighter)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              </div>
              <input name="password" type="password" className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password" value={form.password} onChange={handleChange} autoFocus />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-100" style={{ padding: '13px', fontSize: 15 }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Secure Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>System Access</span></div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <Link to="/login" style={{ fontSize: 14, color: 'var(--text-muted)' }}>← Return to Standard Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
