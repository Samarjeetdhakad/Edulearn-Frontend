import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { enrollmentAPI, courseAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InstructorCertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;
      
      setLoading(true);
      try {
        // 1. Get instructor's courses
        const courseRes = await courseAPI.getByInstructor(user.userId);
        const instructorCourses = courseRes.data;
        
        // 2. Get enrollments for each course and filter for certificates
        const allIssuedEnrollments = [];
        for (const course of instructorCourses) {
          try {
            const enrolRes = await enrollmentAPI.getByCourse(course.courseId);
            // Filter only issued certificates and enrich with course title
            const issued = enrolRes.data
              .filter(enrol => enrol.certificateIssued)
              .map(enrol => ({ 
                ...enrol, 
                courseTitle: course.title 
              }));
            allIssuedEnrollments.push(...issued);
          } catch (e) {
            console.error(`Failed to fetch enrollments for course ${course.courseId}`, e);
          }
        }

        // 3. Fetch student names for unique student IDs
        const uniqueStudentIds = [...new Set(allIssuedEnrollments.map(e => e.studentId))];
        const studentDataMap = {};
        
        // We could use authAPI.getAllUsers() but it might be restricted to ADMIN.
        // Fetching profiles individually as done in InstructorEnrollmentsPage.
        await Promise.all(uniqueStudentIds.map(async (sId) => {
          try {
            const profileRes = await authAPI.getProfile(sId);
            studentDataMap[sId] = {
              name: profileRes.data.fullName || `Student #${sId}`,
              email: profileRes.data.email || 'N/A'
            };
          } catch (e) {
            studentDataMap[sId] = { name: `Student #${sId}`, email: 'N/A' };
          }
        }));

        // 4. Map final data
        const mappedData = allIssuedEnrollments.map(enrol => {
          const student = studentDataMap[enrol.studentId];
          return {
            ...enrol,
            studentName: student ? student.name : `Student #${enrol.studentId}`,
            studentEmail: student ? student.email : 'N/A'
          };
        });

        // 5. Sort by date (completedAt or enrolledAt)
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
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Student Certificates" 
        subtitle="View students who have completed your courses and received certificates."
      />

      {loading ? (
        <Loader text="Loading certificates..." />
      ) : certificates.length === 0 ? (
        <EmptyState 
          icon="📜"
          title="No Certificates Issued Yet"
          message="There are currently no students who have earned a certificate in your courses."
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
                {certificates.map((cert, idx) => (
                  <tr key={`${cert.enrollmentId}-${idx}`}>
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
                      <Badge variant="warning">🏆 CERTIFIED</Badge>
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

export default InstructorCertificatesPage;
