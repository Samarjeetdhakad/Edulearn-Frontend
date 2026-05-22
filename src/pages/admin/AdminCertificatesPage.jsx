import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { enrollmentAPI, courseAPI, authAPI } from '../../services/api';

const AdminCertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
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

        // Filter only enrollments where a certificate was issued
        const issuedEnrollments = enrolRes.data.filter(enrol => enrol.certificateIssued);

        // Map course and student data into each issued certificate record
        const mappedData = issuedEnrollments.map(enrol => {
          const course = allCourses.find(c => c.courseId === enrol.courseId);
          const student = allUsers.find(u => u.userId === enrol.studentId);
          
          return {
            ...enrol,
            courseTitle: course ? course.title : `Course #${enrol.courseId}`,
            studentName: student ? student.fullName : `Student #${enrol.studentId}`,
            studentEmail: student ? student.email : 'N/A'
          };
        });

        // Sort by enrollment date (or completedAt if available)
        mappedData.sort((a, b) => {
          const dateA = a.completedAt ? new Date(a.completedAt) : new Date(a.enrolledAt);
          const dateB = b.completedAt ? new Date(b.completedAt) : new Date(b.enrolledAt);
          return dateB - dateA;
        });
        
        setCertificates(mappedData);
      } catch (err) {
        console.error("Error fetching certificates data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Issued Certificates" 
        subtitle="View students who have successfully completed courses and received certificates."
      />

      {loading ? (
        <Loader fullPage />
      ) : certificates.length === 0 ? (
        <EmptyState 
          icon="📜"
          title="No Certificates Issued Yet"
          message="There are currently no students who have earned a certificate."
        />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course Completed</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.enrollmentId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {cert.studentName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{cert.studentName}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cert.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{cert.courseTitle}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-bg" style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              background: 'var(--success)' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>100%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="warning">CERTIFIED</Badge>
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

export default AdminCertificatesPage;
