// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Alert } from '../../components/common/index';
import './AuthPages.css';

const RegisterPage = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const defaultRole  = params.get('role')?.toUpperCase() === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    mobile: '', role: defaultRole, bio: '', otp: ''
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email)           e.email    = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)        e.password = 'Password is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.otp)             e.otp      = 'Verification code is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
    setSuccessMessage('');
  };

  const handleSendOtp = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors({ email: 'Valid email is required to send code' });
      return;
    }
    setOtpLoading(true);
    setApiError('');
    try {
      await authAPI.sendOtp(form.email);
      setSuccessMessage('Verification code sent to your email!');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        mobile: form.mobile ? Number(form.mobile) : null,
        role: (form.role || '').toUpperCase(),
        bio: form.bio,
        otp: form.otp
      };
      const res = await authAPI.register(payload);
      const { accessToken, refreshToken, userId, fullName: resFullName, email: resEmail, role: resRole } = res.data;
      const user = { userId, fullName: resFullName, email: resEmail, role: resRole };
      login(user, accessToken, refreshToken);

      const roleMap = { STUDENT: '/student/dashboard', INSTRUCTOR: '/instructor/dashboard' };
      navigate(roleMap[resRole] || '/student/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">🎓 EduLearn</Link>
          <h1>Start your<br /><span className="gradient-text">learning journey</span></h1>
          <p>Join thousands of learners building in-demand skills every day.</p>
          <div className="auth-features">
            {['✅ Free to join', '🎓 245+ expert courses', '🏆 Earn certificates', '💬 Community support'].map(f => (
              <div key={f} className="auth-feature">{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap" style={{ maxWidth: 480 }}>
          <h2>Create your account</h2>
          <p className="auth-subtitle">Already have one? <Link to="/login">Sign in</Link></p>

          {apiError && <Alert type="error">{apiError}</Alert>}
          {successMessage && <Alert type="success">{successMessage}</Alert>}

          {/* Role selector */}
          <div className="role-selector">
            {[{ role: 'STUDENT', icon: '📚', label: 'Student', desc: 'I want to learn' }, { role: 'INSTRUCTOR', icon: '🎓', label: 'Instructor', desc: 'I want to teach' }].map(r => (
              <div key={r.role} className={`role-option ${form.role === r.role ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, role: r.role }))}>
                <div className="role-icon">{r.icon}</div>
                <div className="role-label">{r.label}</div>
                <div className="role-desc">{r.desc}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input name="fullName" type="text" className={`form-control ${errors.fullName ? 'error' : ''}`}
                placeholder="Your full name" value={form.fullName} onChange={handleChange} />
              {errors.fullName && <p className="form-error">{errors.fullName}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input name="email" type="email" className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com" value={form.email} onChange={handleChange} style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={handleSendOtp} disabled={otpLoading} style={{ minWidth: 100 }}>
                  {otpLoading ? '...' : 'Send Code'}
                </button>
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Verification Code <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input name="otp" type="text" className={`form-control ${errors.otp ? 'error' : ''}`}
                placeholder="Enter 6-digit code" value={form.otp} onChange={handleChange} maxLength={6} />
              {errors.otp && <p className="form-error">{errors.otp}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="password" type="password" className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input name="confirmPassword" type="password" className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input name="mobile" type="tel" className="form-control"
                placeholder="+91 98765 43210" value={form.mobile} onChange={handleChange} />
            </div>

            {form.role === 'INSTRUCTOR' && (
              <div className="form-group">
                <label className="form-label">Expertise / Bio</label>
                <textarea name="bio" className="form-control" rows={3}
                  placeholder="Tell students about your expertise..." value={form.bio} onChange={handleChange} />
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100" style={{ padding: '13px', fontSize: 15, marginTop: 10 }} disabled={loading}>
              {loading ? 'Creating account...' : `Create ${form.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'} Account`}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
            By registering you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
