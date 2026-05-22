// src/pages/instructor/PaymentsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Alert, Loader, Badge, EmptyState } from '../../components/common/index';
import { paymentAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './PaymentsPage.css';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, refunded: 0 });

  // Fetch instructor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getByInstructor(user.userId);
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setAlert({ type: 'error', message: 'Failed to load your courses.' });
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchCourses();
  }, [user]);

  // Fetch payments for selected course
  const fetchPayments = async (courseId) => {
    setPaymentsLoading(true);
    setAlert(null);
    try {
      const res = await paymentAPI.getByCourse(courseId);
      const data = res.data || [];
      setPayments(data);

      // Calculate stats
      const successPayments = data.filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED');
      const refundedPayments = data.filter(p => p.status === 'REFUNDED');
      setStats({
        total: successPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        count: successPayments.length,
        refunded: refundedPayments.length
      });
    } catch (err) {
      console.error('Failed to load payments:', err);
      setAlert({ type: 'error', message: 'Failed to load payments for this course.' });
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchPayments(course.courseId);
  };


  const getStatusBadge = (status) => {
    const map = {
      SUCCESS: 'success', COMPLETED: 'success',
      PENDING: 'warning', PROCESSING: 'warning',
      FAILED: 'danger', REFUNDED: 'gray'
    };
    return <Badge variant={map[status] || 'gray'}>{status}</Badge>;
  };

  if (loading) return <DashboardLayout><Loader text="Loading courses..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Payment Management"
        subtitle="Track revenue and manage payments for your courses"
        action={
          <button className="btn btn-outline" onClick={() => navigate('/instructor/dashboard')}>
            ← Back to Dashboard
          </button>
        }
      />

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      {/* Course Selector */}
      <div className="payments-course-selector">
        <h3 className="payments-section-title">Select a Course</h3>
        <div className="payments-course-grid">
          {courses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No courses found. Create a course first.</p>
          ) : (
            courses.map(course => (
              <div
                key={course.courseId}
                className={`payments-course-card card ${selectedCourse?.courseId === course.courseId ? 'selected' : ''}`}
                onClick={() => handleCourseSelect(course)}
              >
                <div className="card-body" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{course.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      ₹{course.price?.toLocaleString() || 'Free'}
                    </span>
                    <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'warning'}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Stats */}
      {selectedCourse && (
        <>
          <div className="payments-stats-row">
            <div className="payments-stat-card card">
              <div className="card-body">
                <p className="stat-label">Total Revenue</p>
                <h2 className="stat-value" style={{ color: 'var(--success)' }}>
                  ₹{stats.total.toLocaleString()}
                </h2>
              </div>
            </div>
            <div className="payments-stat-card card">
              <div className="card-body">
                <p className="stat-label">Successful Payments</p>
                <h2 className="stat-value" style={{ color: 'var(--primary)' }}>
                  {stats.count}
                </h2>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                Payments for "{selectedCourse.title}"
              </h3>

              {paymentsLoading ? (
                <Loader text="Loading payments..." />
              ) : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" subtitle="Payments will appear here once students purchase this course." />
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Student ID</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Mode</th>
                        <th>Status</th>
                         <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.paymentId}>
                          <td><code style={{ fontSize: 12 }}>{p.paymentId}</code></td>
                          <td>{p.studentId}</td>
                          <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                          <td>{p.currency || 'INR'}</td>
                          <td>{p.mode || '—'}</td>
                          <td>{getStatusBadge(p.status)}</td>
                           <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default PaymentsPage;
