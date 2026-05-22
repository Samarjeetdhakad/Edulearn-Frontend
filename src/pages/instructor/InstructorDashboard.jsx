// src/pages/instructor/InstructorDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, StatCard, Badge, Loader } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, enrollmentAPI, authAPI, paymentAPI } from '../../services/api';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { user }  = useAuth();
  const [courses, setCourses] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    totalRefunds: 0,
    avgRating: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      setLoading(true);
      try {
        const res = await courseAPI.getByInstructor(user.userId);
        const instructorCourses = res.data;
        setCourses(instructorCourses);

        // Fetch all enrollments for all courses to calculate aggregate stats
        let totalEnrols = 0;
        let completedEnrols = 0;
        let revenue = 0;
        let totalRefundsCount = 0;
        const allEnrollments = [];

        for (const course of instructorCourses) {
          try {
            const enrolRes = await enrollmentAPI.getByCourse(course.courseId);
            const courseEnrols = enrolRes.data || [];
            
            totalEnrols += courseEnrols.length;
            completedEnrols += courseEnrols.filter(e => e.status === 'COMPLETED').length;
            
            // Revenue from actual successful payments
            try {
              const payRes = await paymentAPI.getByCourse(course.courseId);
              const successPayments = payRes.data.filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED');
              revenue += successPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
              const refundedPayments = payRes.data.filter(p => p.status === 'REFUNDED');
              totalRefundsCount += refundedPayments.length;
            } catch (err) {
              console.error(`Failed to fetch payments for course ${course.courseId}`, err);
            }

            const mapped = courseEnrols.map(e => ({ ...e, courseTitle: course.title }));
            allEnrollments.push(...mapped);
          } catch (e) {}
        }

        // Set aggregate stats
        setStats({
          totalCourses: instructorCourses.length,
          publishedCourses: instructorCourses.filter(c => c.isPublished).length,
          totalEnrollments: totalEnrols,
          totalRevenue: revenue,
          totalRefunds: totalRefundsCount,
          avgRating: instructorCourses.length > 0 
            ? (instructorCourses.reduce((acc, c) => acc + (c.rating || 0), 0) / instructorCourses.length).toFixed(1) 
            : 0,
          completionRate: totalEnrols > 0 ? Math.round((completedEnrols / totalEnrols) * 100) : 0
        });

        // Sort by date and take latest 5 for the "Recent Students" section
        const sorted = allEnrollments
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
          .slice(0, 5);

        // Fetch student names for these recent students
        const enrichedRecent = [];
        for (const s of sorted) {
          try {
            const profileRes = await authAPI.getProfile(s.studentId);
            enrichedRecent.push({ ...s, studentName: profileRes.data.fullName });
          } catch (e) {
            enrichedRecent.push({ ...s, studentName: 'Unknown Student' });
          }
        }

        setRecentStudents(enrichedRecent);
        
      } catch (err) {
        console.error("Error fetching instructor data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchInstructorCourses();
  }, [user]);


  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0]}!`}
        subtitle="Here's an overview of your teaching activity"
        action={<Link to="/instructor/create-course" className="btn btn-primary">+ Create Course</Link>} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Courses"     value={stats.totalCourses}     color="var(--primary)" />
        <StatCard label="Published"         value={stats.publishedCourses}  color="var(--success)" />
        <StatCard label="Total Enrollments" value={stats.totalEnrollments.toLocaleString()} color="#7c3aed" />
        <StatCard label="Total Revenue"     value={`₹${(stats.totalRevenue/1000).toFixed(stats.totalRevenue > 1000 ? 1 : 0)}K`} color="var(--accent)" />
        <StatCard label="Refunds"           value={stats.totalRefunds}      color="var(--danger)" />
        <StatCard label="Completion Rate"   value={`${stats.completionRate}%`} color="var(--info)" />
      </div>

      {/* Quick Actions and Recent Students */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { to: '/instructor/create-course', label: 'Create Course' },
                { to: '/instructor/courses',       label: 'Manage Courses' },
                { to: '/instructor/enrollments',   label: 'View Enrollments' },
                { to: '/instructor/discussion',    label: 'Manage Discussions' },
              ].map(action => (
                <Link key={action.to} to={action.to} className="quick-action-btn">
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Students</h3>
              <Link to="/instructor/enrollments" style={{ fontSize: 12 }}>View All</Link>
            </div>
            {recentStudents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No recent activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentStudents.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, paddingBottom: 8, borderBottom: i < recentStudents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{s.studentName}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>#{s.studentId} · enrolled in {s.courseTitle}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'N/A'}
                      </span>
                      <Link to={`/instructor/discussion/${s.courseId}`} style={{ textDecoration: 'none', fontSize: 16 }} title="Go to course discussion">💬</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>My Courses</h3>
            <Link to="/instructor/courses" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {loading ? <Loader /> : courses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No courses created yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Students</th>

                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.courseId}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{course.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.category} · {course.level}</p>
                        </div>
                      </td>
                      <td>
                        <Badge variant={course.isPublished ? 'success' : 'gray'}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 600 }}>{(course.totalEnrollments || 0).toLocaleString()}</td>

                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/instructor/edit-course/${course.courseId}`} className="btn btn-primary btn-sm">Edit</Link>
                          <Link to={`/instructor/discussion/${course.courseId}`} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>💬</Link>
                          <Link to={`/courses/${course.courseId}`} className="btn btn-outline btn-sm">View</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
