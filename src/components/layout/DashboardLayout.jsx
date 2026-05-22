// src/components/layout/DashboardLayout.js
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-wrapper">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`dashboard-main ${collapsed ? 'collapsed' : ''}`}>
        <Navbar />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
