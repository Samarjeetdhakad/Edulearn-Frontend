// src/pages/auth/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/common/index';
import { authAPI } from '../../services/api';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">🎓 EduLearn</Link>
          <h1>Reset your <span className="gradient-text">password</span></h1>
          <p>Enter the email associated with your account and we'll send you a reset link.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          {sent ? (
            <div className="text-center">
              <div style={{ fontSize: 60, marginBottom: 20 }}>📧</div>
              <h2>Check your inbox</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
                We've sent a password reset link to <strong>{email}</strong>.
                The link expires in 30 minutes.
              </p>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => { setSent(false); setEmail(''); }}>
                  Send another link
                </button>
                <Link to="/login" className="btn btn-ghost">Back to Sign In</Link>
              </div>
            </div>
          ) : (
            <>
              <h2>Forgot Password?</h2>
              <p className="auth-subtitle">Remember it? <Link to="/login">Sign in</Link></p>

              {error && <Alert type="error">{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className={`form-control ${error ? 'error' : ''}`}
                    placeholder="you@example.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }} autoFocus />
                </div>
                <button type="submit" className="btn btn-primary w-100" style={{ padding: '13px' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Link to="/login" className="btn btn-ghost">← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
