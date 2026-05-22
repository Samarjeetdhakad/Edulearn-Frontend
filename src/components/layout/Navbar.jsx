// src/components/layout/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchCount = async () => {
        try {
          const res = await notificationAPI.getUnreadCount(user.userId);
          const count = Number(res.data.unreadCount);
          console.log(`[Notification] Unread count for user ${user.userId}:`, count);
          setUnreadCount(isNaN(count) ? 0 : count);
        } catch (err) {
          console.error("Error fetching unread count:", err);
        }
      };
      fetchCount();
      // Refresh every 10 seconds for better responsiveness
      const interval = setInterval(fetchCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'STUDENT')    return '/student/dashboard';
    if (user.role === 'INSTRUCTOR') return '/instructor/dashboard';
    if (user.role === 'ADMIN')      return '/admin/dashboard';
    return '/';
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-text">EduLearn</span>
        </Link>

        {/* Center nav links (public) */}
        {!user && (
          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/courses">Courses</Link>
            <Link to="/#categories">Categories</Link>
            <Link to="/#about">About</Link>
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              {/* Notifications bell */}
              <Link to={`/${user.role.toLowerCase()}/notifications`} className="notif-btn" title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notif-dot"></span>}
              </Link>

              {/* Dashboard link */}
              <Link to={getDashboardPath()} className="btn btn-ghost btn-sm hide-mobile">
                Dashboard
              </Link>

              {/* Avatar dropdown */}
              <div className="avatar-wrap" onClick={() => setDropOpen(!dropOpen)}>
                <div className="avatar">{initial}</div>
                <span className="hide-mobile" style={{ fontSize: 14, fontWeight: 600 }}>
                  {user.fullName?.split(' ')[0]}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>▾</span>

                {dropOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.role}</div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to={getDashboardPath()} className="dropdown-item" onClick={() => setDropOpen(false)}>Dashboard</Link>
                    <Link to={`/${user.role.toLowerCase()}/profile`} className="dropdown-item" onClick={() => setDropOpen(false)}>Profile</Link>
                    {user.role === 'STUDENT' && (
                      <Link to="/student/my-learning" className="dropdown-item" onClick={() => setDropOpen(false)}>My Learning</Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
