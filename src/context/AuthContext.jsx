// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('accessToken');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isStudent    = () => user?.role === 'STUDENT';
  const isInstructor = () => user?.role === 'INSTRUCTOR';
  const isAdmin      = () => user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStudent, isInstructor, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
