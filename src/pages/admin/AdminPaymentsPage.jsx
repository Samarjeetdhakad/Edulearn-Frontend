import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { paymentAPI, courseAPI, authAPI } from '../../services/api';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payRes, courseRes, userRes] = await Promise.all([
          paymentAPI.getAllPayments(),
          courseAPI.getAll(),
          authAPI.getAllUsers()
        ]);

        const allCourses = courseRes.data || [];
        const allUsers   = userRes.data || [];

        // Enrich payments with names
        const enriched = (payRes.data || []).map(p => {
          const course = allCourses.find(c => c.courseId === p.courseId);
          const student = allUsers.find(u => u.userId === p.studentId);
          return {
            ...p,
            courseName: course ? course.title : 'Subscription / General',
            instructorName: course ? course.instructorName : 'N/A',
            studentName: student ? student.fullName : 'Unknown Student',
            studentEmail: student ? student.email : ''
          };
        });

        setPayments(enriched);
      } catch (err) {
        console.error("Error fetching admin payments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = payments.filter(p => {
    const matchSearch = p.studentName.toLowerCase().includes(search.toLowerCase()) ||
                        p.courseName.toLowerCase().includes(search.toLowerCase()) ||
                        p.transactionId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <PageHeader title="Transaction History" subtitle="View and monitor all platform payments" />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" style={{ maxWidth: 300 }} 
            placeholder="Search student, course, or transaction..."
            value={search} onChange={e => setSearch(e.target.value)} />
          
          <select className="form-control" style={{ width: 160 }} 
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing <strong>{filtered.length}</strong> transactions
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div style={{ padding: 40 }}><Loader /></div>
         : filtered.length === 0 ? (
          <div style={{ padding: 40 }}>
            <EmptyState icon="💰" title="No payments found" description="Transactions will appear here once students start buying courses." />
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Course & Instructor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.paymentId}>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      {new Date(p.paidAt).toLocaleDateString()} <br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{p.studentName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.studentEmail}</p>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{p.courseName}</p>
                      <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Instr: {p.instructorName}</p>
                    </td>
                    <td style={{ fontWeight: 800 }}>₹{p.amount.toLocaleString()}</td>
                    <td>
                      <Badge variant={
                        p.status === 'SUCCESS' ? 'success' :
                        p.status === 'REFUNDED' ? 'warning' :
                        p.status === 'FAILED' ? 'danger' : 'primary'
                      }>
                        {p.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {p.transactionId || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentsPage;
