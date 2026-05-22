import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, DiscussionBoard, Loader } from '../../components/common/index';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';

const DiscussionPage = () => {
  const { user } = useAuth();
  const { courseId: paramCourseId } = useParams();
  const [instructorCourses, setInstructorCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!paramCourseId && user?.role === 'INSTRUCTOR') {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          const res = await courseAPI.getByInstructor(user.userId);
          setInstructorCourses(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }
  }, [paramCourseId, user]);
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Discussions" 
        subtitle={paramCourseId ? "Ask questions about this specific course" : "Select a course to see its discussions"}
      />
      
      <div className="card">
        <div className="card-body">
          {paramCourseId ? (
            <DiscussionBoard courseId={parseInt(paramCourseId)} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
              <h2>Select a Course</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '10px auto 24px' }}>
                Discussions are course-specific. Select one of your courses below to see its discussion board.
              </p>
              
              {loading ? <Loader /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
                  {instructorCourses.map(c => (
                    <Link key={c.courseId} to={`/instructor/discussion/${c.courseId}`} className="card" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', transition: 'transform 0.2s' }}>
                      <div className="card-body" style={{ padding: 16 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.totalEnrollments || 0} Students</p>
                      </div>
                    </Link>
                  ))}
                  {instructorCourses.length === 0 && user?.role === 'INSTRUCTOR' && (
                    <p>You haven't created any courses yet.</p>
                  )}
                  {user?.role !== 'INSTRUCTOR' && (
                    <Link to="/student/my-learning" className="btn btn-primary">
                      Go to My Learning
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DiscussionPage;
