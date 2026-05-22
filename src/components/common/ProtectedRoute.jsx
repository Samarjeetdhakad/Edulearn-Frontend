// src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from './index';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = { STUDENT: '/student/dashboard', INSTRUCTOR: '/instructor/dashboard', ADMIN: '/admin/dashboard' };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
