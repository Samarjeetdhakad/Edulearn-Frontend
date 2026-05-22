import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { enrollmentAPI, courseAPI, authAPI } from '../../services/api';

const AdminEnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrolRes, courseRes, userRes] = await Promise.all([
          enrollmentAPI.getAll(),
          courseAPI.getAll(),
          authAPI.getAllUsers()
        ]);

        const allCourses = courseRes.data;
        const allUsers = userRes.data;

        // Map course and student data into each enrollment
        const mappedData = enrolRes.data.map(enrol => {
          const course = allCourses.find(c => c.courseId === enrol.courseId);
          const student = allUsers.find(u => u.userId === enrol.studentId);
          
          return {
            ...enrol,
            courseTitle: course ? course.title : `Course #${enrol.courseId}`,
            studentName: student ? student.fullName : `Student #${enrol.studentId}`,
            studentEmail: student ? student.email : 'N/A'
          };
        });

        // Sort by enrollment date (newest first)
        mappedData.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
        
        setEnrollments(mappedData);
      } catch (err) {
        console.error("Error fetching enrollments data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'ACTIVE': return 'primary';
      case 'DROPPED': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="All Enrollments" 
        subtitle="View and monitor student course enrollments across the platform."
      />

      {loading ? (
        <Loader fullPage />
      ) : enrollments.length === 0 ? (
        <EmptyState 
          icon="🎓"
          title="No Enrollments Found"
          message="There are currently no enrollments in any courses."
        />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Enrolled Date</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrol) => (
                  <tr key={enrol.enrollmentId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {enrol.studentName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{enrol.studentName}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enrol.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{enrol.courseTitle}</strong>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(enrol.enrolledAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-bg" style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${enrol.progressPercent}%`, 
                              height: '100%', 
                              background: 'var(--primary)' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{enrol.progressPercent}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusColor(enrol.status)}>
                        {enrol.status}
                      </Badge>
                    </td>
                    <td>
                      {enrol.certificateIssued ? (
                        <Badge variant="warning">ISSUED</Badge>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminEnrollmentsPage;
