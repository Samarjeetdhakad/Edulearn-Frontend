// src/pages/ProfilePage.js
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Alert, Badge } from '../components/common/index';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState({
    fullName:    user?.fullName    || '',
    email:       user?.email       || '',
    mobile:      user?.mobile      || '',
    bio:         user?.bio         || '',
    profilePicUrl: user?.profilePicUrl || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [saving, setSaving]       = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null);
  const [pwdAlert, setPwdAlert]         = useState(null);
  const [activeTab, setActiveTab]       = useState('profile');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // REAL: authAPI.updateProfile(user.userId, profile)
    await new Promise(r => setTimeout(r, 800));
    login({ ...user, ...profile },
      localStorage.getItem('accessToken'),
      localStorage.getItem('refreshToken'));
    setProfileAlert({ type: 'success', message: 'Profile updated successfully!' });
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdAlert({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPwdAlert({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPwd(true);
    // REAL: authAPI.changePassword(user.userId, { currentPassword, newPassword })
    await new Promise(r => setTimeout(r, 800));
    setPwdAlert({ type: 'success', message: 'Password changed successfully!' });
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSavingPwd(false);
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  const roleColor = { STUDENT: 'var(--primary)', INSTRUCTOR: '#7c3aed', ADMIN: '#dc2626' };

  return (
    <DashboardLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your account information" />

      {/* Profile Header Card */}
      <div className="card profile-header-card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="avatar-large" style={{ background: `linear-gradient(135deg, ${roleColor[user?.role] || 'var(--primary)'}, #7c3aed)` }}>
              {profile.profilePicUrl
                ? <img src={profile.profilePicUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initial}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile.fullName}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{profile.email}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge variant={user?.role === 'STUDENT' ? 'primary' : user?.role === 'INSTRUCTOR' ? 'info' : 'danger'}>
                  {user?.role}
                </Badge>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              📷 Change Photo
              <input type="file" style={{ display: 'none' }} accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setProfile(p => ({ ...p, profilePicUrl: URL.createObjectURL(file) }));
                }} />
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '0 16px', display: 'flex', gap: 4 }}>
          {[{ key: 'profile', label: '👤 Profile Info' }, { key: 'password', label: '🔒 Change Password' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="btn btn-sm"
              style={{ borderRadius: 0, borderBottom: activeTab === t.key ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === t.key ? 700 : 400, padding: '14px 16px' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-body" style={{ maxWidth: 560 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
            {profileAlert && <Alert type={profileAlert.type} onClose={() => setProfileAlert(null)}>{profileAlert.message}</Alert>}
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={profile.fullName}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" value={profile.email} disabled
                  style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
                <p className="form-hint">Email cannot be changed.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input className="form-control" type="tel" value={profile.mobile}
                  onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {user?.role === 'INSTRUCTOR' ? 'Bio & Expertise' : 'Bio / Learning Goals'}
                </label>
                <textarea className="form-control" rows={4} value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder={user?.role === 'INSTRUCTOR' ? 'Share your expertise and experience...' : 'What are you learning and why?'} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <div className="card-body" style={{ maxWidth: 460 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
            {pwdAlert && <Alert type={pwdAlert.type} onClose={() => setPwdAlert(null)}>{pwdAlert.message}</Alert>}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <input type="password" className="form-control" value={passwords.currentPassword}
                  onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input type="password" className="form-control" value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input type="password" className="form-control" value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
