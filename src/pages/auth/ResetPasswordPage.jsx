import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/common/index';
import { authAPI } from '../../services/api';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Reset link is invalid or expired. Please request a new one.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">🎓 EduLearn</Link>
          <h1>Set a new <span className="gradient-text">password</span></h1>
          <p>Choose a strong password to secure your account.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          {success ? (
            <div className="text-center">
              <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
              <h2>Password Changed!</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
                Your password has been reset successfully. Redirecting you to login...
              </p>
              <div style={{ marginTop: 28 }}>
                <Link to="/login" className="btn btn-primary w-100">Go to Sign In</Link>
              </div>
            </div>
          ) : (
            <>
              <h2>Reset Password</h2>
              <p className="auth-subtitle">
                Remember it? <Link to="/login">Sign in</Link>
              </p>

              {error && <Alert type="error">{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    className={`form-control ${error ? 'error' : ''}`}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className={`form-control ${error ? 'error' : ''}`}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ padding: '13px' }}
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Link to="/forgot-password" className="btn btn-ghost">← Request new link</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
