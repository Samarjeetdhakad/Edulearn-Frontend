// src/pages/instructor/InstructorEnrollmentsPage.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { enrollmentAPI, courseAPI, authAPI } from '../../services/api';
import './InstructorEnrollmentsPage.css';

const InstructorEnrollmentsPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get instructor's courses first
        const courseRes = await courseAPI.getByInstructor(user.userId);
        const instructorCourses = courseRes.data;
        setCourses(instructorCourses);

        // 2. Get enrollments for each course
        const allEnrollments = [];
        for (const course of instructorCourses) {
          try {
            const enrolRes = await enrollmentAPI.getByCourse(course.courseId);
            // Add course title to each enrollment for the table
            const mapped = enrolRes.data.map(e => ({ ...e, courseTitle: course.title }));
            allEnrollments.push(...mapped);
          } catch (e) {
            console.error(`Failed to fetch enrollments for course ${course.courseId}`);
          }
        }
        // Fetch student names for all unique student IDs
        const uniqueStudentIds = [...new Set(allEnrollments.map(e => e.studentId))];
        const studentNamesMap = {};
        for (const sId of uniqueStudentIds) {
          try {
            const profileRes = await authAPI.getProfile(sId);
            studentNamesMap[sId] = profileRes.data.fullName;
          } catch (e) {
            studentNamesMap[sId] = 'Unknown Student';
          }
        }
        
        const enrichEnrollments = allEnrollments.map(e => ({
          ...e,
          studentName: studentNamesMap[e.studentId] || 'Unknown Student'
        }));
        setEnrollments(enrichEnrollments);
      } catch (err) {
        console.error("Error fetching enrollment data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchData();
  }, [user]);

  const handleRemoveStudent = async (studentId, courseId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove Student #${studentId} from this course? This will delete all their progress and access.`)) {
      return;
    }

    try {
      await enrollmentAPI.removeStudent(studentId, courseId);
      // Update local state to remove the student from the view
      setEnrollments(prev => prev.filter(e => !(e.studentId === studentId && e.courseId === courseId)));
      alert("Student removed successfully.");
    } catch (err) {
      console.error("Failed to remove student:", err);
      alert("Failed to remove student. Please try again.");
    }
  };

  const filtered = filterCourse === 'All' 
    ? enrollments 
    : enrollments.filter(e => e.courseId === parseInt(filterCourse));

  return (
    <DashboardLayout>
      <PageHeader 
        title="Student Enrollments" 
        subtitle="Track your students' progress across all your courses" 
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Filter by Course:</label>
          <select 
            className="form-control" 
            style={{ width: 300 }} 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="All">All Courses</option>
            {courses.map(c => (
              <option key={c.courseId} value={c.courseId}>{c.title}</option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 14 }}>
            Showing <strong>{filtered.length}</strong> total enrollments
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Fetching student data..." />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon="👥" 
          title="No enrollments found" 
          description={filterCourse === 'All' ? "Nobody has enrolled in your courses yet." : "No students enrolled in this specific course yet."} 
        />
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Enrolled Date</th>
                    <th>Certificate</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((enrol, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{enrol.studentName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{enrol.studentId}</div>
                      </td>
                      <td>{enrol.courseTitle}</td>
                      <td>
                        <Badge variant={enrol.status === 'COMPLETED' ? 'success' : 'primary'}>
                          {enrol.status}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ width: 120 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span>{enrol.progressPercent}%</span>
                          </div>
                          <div className="progress-bar" style={{ height: 6 }}>
                            <div 
                              className="progress-fill" 
                              style={{ width: `${enrol.progressPercent}%`, background: enrol.progressPercent === 100 ? 'var(--success)' : 'var(--primary)' }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {enrol.enrolledAt ? new Date(enrol.enrolledAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {enrol.certificateIssued ? (
                          <Badge variant="warning">🏆 Issued</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--danger)', padding: '4px 8px' }}
                          onClick={() => handleRemoveStudent(enrol.studentId, enrol.courseId)}
                          title="Remove student from course"
                        >
                          🗑️ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorEnrollmentsPage;
