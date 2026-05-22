// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const studentNav = [
  { path: '/student/dashboard',      icon: '', label: 'Dashboard' },
  { path: '/student/my-learning',    icon: '', label: 'My Learning' },
  { path: '/courses',                icon: '', label: 'Browse Courses' },
  { path: '/student/progress',       icon: '', label: 'Progress' },
  { path: '/student/quiz',           icon: '', label: 'Quizzes' },
  { path: '/student/certificates',   icon: '', label: 'Certificates' },
];

const instructorNav = [
  { path: '/instructor/dashboard',   icon: '', label: 'Dashboard' },
  { path: '/instructor/courses',     icon: '', label: 'My Courses' },
  { path: '/instructor/create-course', icon: '', label: 'Create Course' },
  { path: '/instructor/enrollments', icon: '', label: 'Enrollments' },
  { path: '/instructor/certificates', icon: '', label: 'Certificates' },
  { path: '/instructor/payments',    icon: '', label: 'Payments' },
  { path: '/instructor/analytics',   icon: '', label: 'Analytics' },
];

const adminNav = [
  { path: '/admin/dashboard',        icon: '', label: 'Dashboard' },
  { path: '/admin/users',            icon: '', label: 'Manage Users' },
  { path: '/admin/courses',          icon: '', label: 'Manage Courses' },
  { path: '/admin/enrollments',      icon: '', label: 'Enrollments' },
  { path: '/admin/certificates',     icon: '', label: 'Certificates' },
  { path: '/admin/analytics',        icon: '', label: 'Analytics' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    if (user?.role === 'INSTRUCTOR') return instructorNav;
    if (user?.role === 'ADMIN')      return adminNav;
    return studentNav;
  };

  const getRoleColor = () => {
    if (user?.role === 'INSTRUCTOR') return '#7c3aed';
    if (user?.role === 'ADMIN')      return '#dc2626';
    return 'var(--primary)';
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        {!collapsed && <span className="brand-name">EduLearn</span>}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="sidebar-role" style={{ background: getRoleColor() + '15', color: getRoleColor() }}>
          {user?.role}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {getNavItems().map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
};

export default Sidebar;
