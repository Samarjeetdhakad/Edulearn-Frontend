// src/pages/admin/AdminCoursesPage.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { courseAPI } from '../../services/api';

const AdminCoursesPage = () => {
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    console.log("AdminCoursesPage: useEffect triggered");
    const fetchCourses = async () => {
      setLoading(true);
      try {
        console.log("AdminCoursesPage: Calling courseAPI.getAll()...");
        const res = await courseAPI.getAll();
        console.log("AdminCoursesPage: Data received:", res.data);
        setCourses(res.data);
      } catch (err) {
        console.error("AdminCoursesPage: Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleApprove = async (courseId) => {
    try {
      await courseAPI.approve(courseId);
      setCourses(prev => prev.map(c =>
        c.courseId === courseId ? { ...c, approvalStatus: 'APPROVED' } : c
      ));
    } catch (err) {
      alert("Failed to approve course");
    }
  };

  const handleReject = async (courseId) => {
    try {
      await courseAPI.reject(courseId);
      setCourses(prev => prev.map(c =>
        c.courseId === courseId ? { ...c, approvalStatus: 'REJECTED' } : c
      ));
    } catch (err) {
      alert("Failed to reject course");
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course permanently?')) return;
    try {
      await courseAPI.delete(courseId);
      setCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  const filtered = courses.filter(c => {
    const matchSearch = (c.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
                        String(c.instructorId).includes(search);
    const matchFilter = filter === 'ALL' || c.approvalStatus === filter;
    return matchSearch && matchFilter;
  });

  const tabs = [
    { key: 'ALL',      label: `All (${courses.length})` },
    { key: 'PENDING',  label: `Pending (${courses.filter(c => c.approvalStatus === 'PENDING').length})` },
    { key: 'APPROVED', label: `Approved (${courses.filter(c => c.approvalStatus === 'APPROVED').length})` },
    { key: 'REJECTED', label: `Rejected (${courses.filter(c => c.approvalStatus === 'REJECTED').length})` },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Manage Courses" subtitle="Review, approve, and manage all platform courses" />

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="btn btn-sm"
              style={{ borderRadius: 0, borderBottom: filter === t.key ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', color: filter === t.key ? 'var(--primary)' : 'var(--text-muted)', fontWeight: filter === t.key ? 700 : 400, padding: '14px 14px', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: 14 }}>
          <input className="form-control" placeholder="Search by course title or instructor ID..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div style={{ padding: 40 }}><Loader /></div>
         : filtered.length === 0 ? (
          <div style={{ padding: 40 }}>
            <EmptyState icon="📚" title="No courses found" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor ID</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(course => (
                  <tr key={course.courseId}>
                    <td style={{ maxWidth: 240 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{course.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.level} · {course.language}</p>
                    </td>
                    <td style={{ fontSize: 14 }}>{course.instructorId}</td>
                    <td><Badge variant="gray">{course.category}</Badge></td>
                    <td style={{ fontWeight: 700 }}>
                      {course.price === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${course.price.toLocaleString()}`}
                    </td>
                    <td>
                      <Badge variant={
                        course.approvalStatus === 'APPROVED' ? 'success' :
                        course.approvalStatus === 'PENDING'  ? 'warning' : 'danger'
                      }>
                        {course.approvalStatus}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {course.approvalStatus === 'PENDING' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(course.courseId)}>Approve</button>
                            <button className="btn btn-warning btn-sm" onClick={() => handleReject(course.courseId)}>Reject</button>
                          </>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.courseId)}>Delete</button>
                      </div>
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

export default AdminCoursesPage;
