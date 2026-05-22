// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, StatCard, Badge, Loader } from '../../components/common/index';
import { courseAPI, authAPI, paymentAPI } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allCourses, setAllCourses]         = useState([]);
  const [allUsers, setAllUsers]             = useState([]);
  const [allPayments, setAllPayments]       = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [courseRes, userRes, payRes] = await Promise.all([
          courseAPI.getAll(),
          authAPI.getAllUsers(),
          paymentAPI.getAllPayments()
        ]);
        setAllCourses(courseRes.data || []);
        setAllUsers(userRes.data || []);
        setAllPayments(payRes.data || []);
        setPendingCourses((courseRes.data || []).filter(c => c.approvalStatus === 'PENDING'));
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const stats = {
    totalUsers: allUsers.length,
    totalStudents: allUsers.filter(u => u.role === 'STUDENT').length,
    totalInstructors: allUsers.filter(u => u.role === 'INSTRUCTOR').length,
    totalCourses: allCourses.length,
    publishedCourses: allCourses.filter(c => c.isPublished).length,
    totalRevenue: allPayments
      .filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED')
      .reduce((acc, p) => acc + (p.amount || 0), 0),
    pendingApprovals: pendingCourses.length
  };

  const handleApprove = async (courseId) => {
    try {
      await courseAPI.approve(courseId);
      setPendingCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch (err) {
      alert("Failed to approve course");
    }
  };

  const handleReject = async (courseId) => {
    try {
      await courseAPI.reject(courseId);
      setPendingCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch (err) {
      alert("Failed to reject course");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide overview and management" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Users"          value={stats.totalUsers.toLocaleString()}        color="var(--primary)" />
        <StatCard label="Students"             value={stats.totalStudents.toLocaleString()}     color="#7c3aed" />
        <StatCard label="Instructors"        value={stats.totalInstructors.toLocaleString()}  color="var(--info)" />
        <StatCard label="Total Courses"        value={stats.totalCourses}                       color="var(--success)" />
        <StatCard label="Published Courses"    value={stats.publishedCourses}                   color="var(--success)" />
        <StatCard label="Total Revenue"        value={`₹${stats.totalRevenue.toLocaleString()}`} color="var(--accent)" />
        <StatCard label="Pending Approvals"    value={stats.pendingApprovals}                   color="var(--warning)" />
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Management</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { to: '/admin/users',        label: 'Manage Users',    color: 'var(--primary)' },
              { to: '/admin/courses',      label: 'Manage Courses',  color: '#7c3aed' },
              { to: '/admin/payments',     label: 'Payments',        color: 'var(--success)' },
              { to: '/admin/analytics',    label: 'Analytics',       color: 'var(--info)' },
              { to: '/admin/certificates', label: 'Certificates',    color: 'var(--accent)' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="admin-quick-link" style={{ borderColor: item.color + '40', color: item.color }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-bottom-grid">
        {/* Pending Approvals */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pending Approvals</h3>
              <Link to="/admin/courses" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            {loading ? <Loader /> : pendingCourses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No pending approvals!</p>
            ) : (
              pendingCourses.map(course => (
                <div key={course.courseId} className="approval-item">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{course.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      by {course.instructorName} · {course.category}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(course.courseId)}>Approve</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => handleReject(course.courseId)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Stats Summary */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Platform Summary</h3>
            {[
              { label: 'Total Revenue',         value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'var(--success)' },
              { label: 'Course Approval Rate',  value: stats.totalCourses > 0 ? `${Math.round((stats.publishedCourses/stats.totalCourses)*100)}%` : '0%', color: '#7c3aed' },
              { label: 'Student-Instructor Ratio', value: stats.totalInstructors > 0 ? `${Math.round(stats.totalStudents/stats.totalInstructors)}:1` : '0:1', color: 'var(--info)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
