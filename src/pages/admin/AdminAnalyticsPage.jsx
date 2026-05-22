// src/pages/admin/AdminAnalyticsPage.js
import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, StatCard, Loader } from '../../components/common/index';
import { courseAPI, authAPI, paymentAPI, enrollmentAPI } from '../../services/api';

const AdminAnalyticsPage = () => {
  const [users, setUsers] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [enrollments, setEnrollments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, userRes, payRes, enrolRes] = await Promise.all([
          courseAPI.getAll(),
          authAPI.getAllUsers(),
          paymentAPI.getAllPayments(),
          enrollmentAPI.getAll()
        ]);
        setCourses(courseRes.data || []);
        setUsers(userRes.data || []);
        setPayments(payRes.data || []);
        setEnrollments(enrolRes.data || []);
      } catch (err) {
        console.error("Error fetching data for analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    totalRevenue: payments
      .filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED')
      .reduce((acc, p) => acc + (p.amount || 0), 0),
    totalStudents: users.filter(u => u.role === 'STUDENT').length,
    publishedCourses: courses.filter(c => c.isPublished).length,
    totalUsers: users.length,
    totalInstructors: users.filter(u => u.role === 'INSTRUCTOR').length
  };

  // Calculate real enrollment counts per course
  const courseEnrollmentCounts = enrollments.reduce((acc, enrol) => {
    acc[enrol.courseId] = (acc[enrol.courseId] || 0) + 1;
    return acc;
  }, {});

  const coursesWithRealStats = courses.map(c => ({
    ...c,
    realEnrollments: courseEnrollmentCounts[c.courseId] || 0
  }));

  const topCourses = [...coursesWithRealStats]
    .sort((a, b) => b.realEnrollments - a.realEnrollments)
    .slice(0, 5);

  const categoryData = coursesWithRealStats.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.realEnrollments;
    return acc;
  }, {});

  const maxEnrollment = Math.max(0, ...Object.values(categoryData));

  return (
    <DashboardLayout>
      <PageHeader title="Platform Analytics" subtitle="Overview of platform performance and metrics" />

      {loading ? <Loader /> : (
        <>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
            <StatCard icon="💰" label="Total Revenue"       value={`₹${stats.totalRevenue.toLocaleString()}`} color="var(--success)" />
            <StatCard icon="👥" label="Total Students"      value={stats.totalStudents.toLocaleString()}          color="var(--primary)" />
            <StatCard icon="📚" label="Published Courses"   value={stats.publishedCourses}                        color="#7c3aed" />
          </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Top Courses */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🏆 Top Courses by Enrollment</h3>
            {topCourses.map((course, idx) => (
              <div key={course.courseId} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'var(--bg)', color: idx < 3 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {course.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                      <div style={{ width: topCourses[0].realEnrollments > 0 ? `${(course.realEnrollments / topCourses[0].realEnrollments) * 100}%` : '0%', height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {course.realEnrollments.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollments by Category */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Enrollments by Category</h3>
            {Object.entries(categoryData).map(([cat, count]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{count.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
                  <div style={{ width: maxEnrollment > 0 ? `${(count / maxEnrollment) * 100}%` : '0%', height: '100%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue & Subscription Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Revenue Summary</h3>
            {[
              { label: 'Total Course Revenue', value: `₹${stats.totalRevenue.toLocaleString()}` },
              { label: 'Avg Revenue per Course', value: `₹${stats.publishedCourses > 0 ? Math.round(stats.totalRevenue / stats.publishedCourses).toLocaleString() : 0}` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👥 User Summary</h3>
            {[
              { label: 'Total Users',      value: stats.totalUsers.toLocaleString(),       color: 'var(--primary)' },
              { label: 'Students',         value: stats.totalStudents.toLocaleString(),    color: '#7c3aed' },
              { label: 'Instructors',      value: stats.totalInstructors.toLocaleString(), color: 'var(--info)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;
