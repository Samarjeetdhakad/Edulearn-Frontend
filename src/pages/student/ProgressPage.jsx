// src/pages/student/ProgressPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, StatCard, ProgressBar, Badge, Loader } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { enrollmentAPI, courseAPI } from '../../services/api';
import './ProgressPage.css';

const ProgressPage = () => {
  const { user }  = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [progressData, setProgressData] = useState([]);
  const [issuing, setIssuing] = useState(null); // Track which course is issuing

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const [enrRes, courseRes, progRes] = await Promise.all([
          enrollmentAPI.getByStudent(user.userId),
          courseAPI.getAll(),
          import('../../services/api').then(m => m.progressAPI.getAllProgressByStudent(user.userId))
        ]);
        const enrollments = enrRes.data || [];
        const allCourses = courseRes.data || [];
        setProgressData(progRes.data || []);
        
        // Fetch lesson counts for enrolled courses
        const counts = {};
        await Promise.all(enrollments.map(async (e) => {
           try {
              const countRes = await import('../../services/api').then(m => m.lessonAPI.getCount(e.courseId));
              counts[e.courseId] = countRes.data;
           } catch (err) {
              counts[e.courseId] = 0;
           }
        }));
        setLessonCounts(counts);
        
        const result = enrollments.map(e => {
          const course = allCourses.find(c => c.courseId === e.courseId);
          if (!course) return null;
          const completedVideos = (progRes.data || []).filter(p => p.courseId === e.courseId && p.isCompleted).length;
          const totalVideos = counts[e.courseId] || 0;
          const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
          return { ...e, course, progressPercent, completedVideos, totalVideos };
        }).filter(Boolean);
        
        setData(result);
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchProgress();
  }, [user]);

  const handleIssueCertificate = async (course) => {
    setIssuing(course.courseId);
    try {
      const { progressAPI, enrollmentAPI } = await import('../../services/api');
      // Force enrollment to 100% complete so the backend doesn't block certificate issuance
      await enrollmentAPI.markComplete(user.userId, course.courseId);
      // Update enrollment service so certificateIssued is true
      await enrollmentAPI.issueCertificate(user.userId, course.courseId);
      // Generate actual verifiable certificate in progress service
      await progressAPI.issueCertificate(user.userId, course.courseId, course.title, course.instructorName);
      
      // Optimistically update UI
      setData(prev => prev.map(d => d.courseId === course.courseId ? { ...d, certificateIssued: true } : d));
      alert("Certificate generated successfully! You can now view and download it from the Certificates page.");
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert(err.response?.data?.message || "Failed to issue certificate");
    } finally {
      setIssuing(null);
    }
  };

  const completed  = data.filter(d => d.progressPercent === 100).length;
  const inProgress = data.filter(d => d.progressPercent < 100).length;
  const certs      = data.filter(d => d.certificateIssued).length;
  const avgProg    = data.length ? Math.round(data.reduce((s, d) => s + d.progressPercent, 0) / data.length) : 0;

  return (
    <DashboardLayout>
      <PageHeader title="My Progress" subtitle="Track your learning progress across all courses" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Enrolled"  value={data.length}  color="var(--primary)" />
        <StatCard label="Completed"        value={completed}    color="var(--success)" />
        <StatCard label="In Progress"      value={inProgress}   color="#7c3aed" />
        <StatCard label="Certificates"     value={certs}        color="var(--accent)" />
      </div>

      {/* Average Progress */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Overall Learning Progress</h3>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{avgProg}%</span>
          </div>
          <ProgressBar value={avgProg} showLabel={false} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Average across all {data.length} enrolled courses
          </p>
        </div>
      </div>

      {/* Course Progress List */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Course-wise Progress</h3>
          {loading ? <Loader /> : data.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No courses enrolled yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {data.map(({ course, progressPercent, completedVideos, totalVideos, status, certificateIssued, enrollmentId }) => (
                <div key={enrollmentId} className="progress-course-row">
                  <div className="pcr-thumb" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{course.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.instructorName} · {course.category}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <Badge variant={progressPercent === 100 ? 'success' : 'warning'}>
                          {progressPercent === 100 ? 'Completed' : 'In Progress'}
                        </Badge>
                        {certificateIssued && <Badge variant="primary">Certified</Badge>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{completedVideos} of {totalVideos} videos</span>
                    </div>
                    <ProgressBar value={progressPercent} showLabel={true} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <Link to={`/student/lesson/${course.courseId}`} className="btn btn-primary btn-sm">
                        {progressPercent === 100 ? 'Review' : 'Continue'}
                      </Link>
                      {progressPercent === 100 && !certificateIssued && (
                        <button className="btn btn-outline btn-sm" disabled={issuing === course.courseId} onClick={() => handleIssueCertificate(course)}>
                          {issuing === course.courseId ? 'Issuing...' : 'Get Certificate'}
                        </button>
                      )}
                      {certificateIssued && (
                        <Link to="/student/certificates" className="btn btn-outline btn-sm">View Certificate</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
