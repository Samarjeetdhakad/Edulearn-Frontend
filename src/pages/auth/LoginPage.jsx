// src/pages/auth/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Alert } from '../../components/common/index';
import './AuthPages.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || null;

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      login(user, accessToken, refreshToken);

      const redirectMap = { STUDENT: '/student/dashboard', INSTRUCTOR: '/instructor/dashboard', ADMIN: '/admin/dashboard' };
      navigate(from || redirectMap[user.role] || '/');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect directly to auth-service on 8081 to avoid Gateway/CORS issues with OAuth2
    window.location.href = `http://localhost:8081/oauth2/authorization/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">🎓 EduLearn</Link>
          <h1>Welcome back to<br /><span className="gradient-text">your learning</span></h1>
          <p>Continue where you left off. Thousands of courses await you.</p>
          <div className="auth-features">
            {['📚 Access 245+ courses', '🏆 Earn certificates', '💬 Join community discussions', '📱 Learn on any device'].map(f => (
              <div key={f} className="auth-feature">{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Sign in to EduLearn</h2>
          <p className="auth-subtitle">Don't have an account? <Link to="/register">Create one free</Link></p>


          {apiError && <Alert type="error">{apiError}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input name="email" type="email" className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com" value={form.email} onChange={handleChange} autoFocus />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                <Link to="/forgot-password" style={{ fontSize: 13 }}>Forgot password?</Link>
              </div>
              <input name="password" type="password" className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password" value={form.password} onChange={handleChange} />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-100" style={{ padding: '13px', fontSize: 15 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn btn-outline w-100" style={{ gap: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleGoogleLogin}>
            🔵 Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
