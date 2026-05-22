// src/pages/instructor/InstructorCoursesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';
import { courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InstructorCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      setLoading(true);
      try {
        const res = await courseAPI.getByInstructor(user.userId);
        console.log("Instructor Courses:", res.data);
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching instructor courses:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchInstructorCourses();
  }, [user]);

  const handlePublishRequest = async (courseId) => {
    try {
      await courseAPI.publish(courseId);
      setCourses(prev => prev.map(c =>
        c.courseId === courseId ? { ...c, isPublished: true, approvalStatus: 'APPROVED' } : c
      ));
    } catch (err) {
      alert("Failed to publish course");
    }
  };

  const handleUnpublish = async (courseId) => {
    try {
      await courseAPI.unpublish(courseId);
      setCourses(prev => prev.map(c =>
        c.courseId === courseId ? { ...c, isPublished: false, approvalStatus: 'DRAFT' } : c
      ));
    } catch (err) {
      alert("Failed to unpublish course");
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    try {
      await courseAPI.delete(courseId);
      setCourses(prev => prev.filter(c => c.courseId !== courseId));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Courses"
        subtitle="Manage all your courses"
        action={<Link to="/instructor/create-course" className="btn btn-primary">+ Create Course</Link>}
      />

      {loading ? <Loader /> : courses.length === 0 ? (
        <EmptyState icon="📚" title="No courses yet"
          description="Create your first course and start teaching!"
          action={<Link to="/instructor/create-course" className="btn btn-primary">Create Course</Link>} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Students</th>

                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.courseId}>
                    <td style={{ maxWidth: 260 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{course.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.level} · {course.language}</p>
                    </td>
                    <td>
                      <Badge variant="gray">{course.category}</Badge>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {course.price === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${course.price.toLocaleString()}`}
                    </td>
                    <td>{course.totalEnrollments.toLocaleString()}</td>

                    <td>
                      {course.isPublished ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant={
                          course.approvalStatus === 'PENDING' ? 'warning' : 
                          course.approvalStatus === 'REJECTED' ? 'danger' : 'gray'
                        }>
                          {course.approvalStatus === 'PENDING' ? 'Pending Approval' : 
                           course.approvalStatus === 'REJECTED' ? 'Rejected' : 'Draft'}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link to={`/instructor/edit-course/${course.courseId}`} className="btn btn-primary btn-sm">Edit</Link>
                        <Link to={`/instructor/course/${course.courseId}/curriculum`} className="btn btn-outline btn-sm">Curriculum</Link>
                        <Link to={`/student/discussion/${course.courseId}`} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>💬 Discussion</Link>
                        {!course.isPublished && course.approvalStatus !== 'PENDING' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handlePublishRequest(course.courseId)}>
                            Publish
                          </button>
                        )}
                        {course.isPublished && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleUnpublish(course.courseId)}>
                            Unpublish
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.courseId)}>Delete</button>
                      </div>
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

export default InstructorCoursesPage;
