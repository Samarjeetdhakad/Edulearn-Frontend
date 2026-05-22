// src/pages/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CourseCard from '../../components/common/CourseCard';
import { StatCard, ProgressBar, Loader, EmptyState } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { enrollmentAPI, courseAPI, notificationAPI, progressAPI, lessonAPI } from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lessonCounts, setLessonCounts]   = useState({});
  const [progressData, setProgressData]   = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrolRes, courseRes, notifRes, progRes] = await Promise.all([
          enrollmentAPI.getByStudent(user.userId),
          courseAPI.getAll(),
          notificationAPI.getByUser(user.userId),
          progressAPI.getAllProgressByStudent(user.userId)
        ]);
        setEnrollments(enrolRes.data);
        setCourses(courseRes.data);
        setNotifications(notifRes.data);
        setProgressData(progRes.data);

        // Fetch lesson counts for enrolled courses
        const counts = {};
        await Promise.all(enrolRes.data.map(async (e) => {
           try {
              const countRes = await lessonAPI.getCount(e.courseId);
              counts[e.courseId] = countRes.data;
           } catch (err) {
              counts[e.courseId] = 0;
           }
        }));
        setLessonCounts(counts);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) fetchData();
  }, [user]);

  const getProgress = (courseId) => {
     const completedVideos = progressData.filter(p => p.courseId === courseId && p.isCompleted).length;
     const totalVideos = lessonCounts[courseId] || 0;
     const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
     return { completedVideos, totalVideos, percentage };
  };

  const enrolledCourses = courses.filter(c => enrollments.some(e => e.courseId === c.courseId));
  
  // Calculate dynamic stats based on exact video progress instead of backend enrollment status
  let completedCount = 0;
  let inProgressCount = 0;
  
  enrollments.forEach(e => {
      const { percentage } = getProgress(e.courseId);
      if (percentage === 100) {
          completedCount++;
      } else {
          inProgressCount++;
      }
  });

  const certificates = enrollments.filter(e => e.certificateIssued).length;

  // getProgress moved above

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      {/* ── Welcome banner ──────────────────────────────── */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            You have <strong style={{ color: '#fff' }}>{inProgressCount} course{inProgressCount !== 1 ? 's' : ''}</strong> in progress. Keep it up!
          </p>
          <Link to="/courses" className="btn btn-sm" style={{ background: '#fff', color: 'var(--primary)', marginTop: 16, fontWeight: 700 }}>
            Browse More Courses →
          </Link>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="stats-row">
        <StatCard label="Enrolled Courses"   value={enrollments.length}  color="var(--primary)" />
        <StatCard label="Completed"          value={completedCount}       color="var(--success)" />
        <StatCard label="Certificates"       value={certificates}         color="var(--accent)" />
        <StatCard label="In Progress"        value={inProgressCount}      color="#7c3aed" />
      </div>

      {/* ── Continue Learning ───────────────────────────── */}
      <section className="dash-section">
        <div className="section-header">
          <h2 className="section-heading">Continue Learning</h2>
          <Link to="/student/my-learning" className="btn btn-outline btn-sm">View All →</Link>
        </div>

        {loading ? (
          <Loader text="Loading your courses..." />
        ) : enrolledCourses.length === 0 ? (
          <EmptyState title="No courses yet" description="Browse our catalog and enroll in your first course!"
            action={<Link to="/courses" className="btn btn-primary">Browse Courses</Link>} />
        ) : (
          <div className="courses-row">
            {enrolledCourses.slice(0, 3).map(course => {
              const { completedVideos, totalVideos, percentage } = getProgress(course.courseId);
              return (
                <div key={course.courseId} className="continue-card card">
                  <div className="continue-thumb" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                    {percentage === 100 && totalVideos > 0 && (
                      <div className="completed-overlay">✓ Completed</div>
                    )}
                  </div>
                  <div className="continue-body">
                    <p className="continue-category">{course.category}</p>
                    <h4 className="continue-title">{course.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {course.instructorName}
                    </p>
                    <div style={{ marginBottom: 12 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                         <span style={{ color: 'var(--text-muted)' }}>{completedVideos} of {totalVideos} videos</span>
                         <span style={{ fontWeight: 700, color: percentage === 100 ? 'var(--success)' : 'var(--primary)' }}>
                           {percentage}%
                         </span>
                       </div>
                       <div className="progress-bar">
                         <div className="progress-fill" style={{ width: `${percentage}%`, background: percentage === 100 ? 'var(--success)' : 'var(--primary)' }} />
                       </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link to={`/student/lesson/${course.courseId}`}
                        className={`btn btn-sm w-100 ${percentage === 100 ? 'btn-outline' : 'btn-primary'}`}>
                        {percentage === 100 ? '✓ Review Course' : '▶ Continue Learning'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bottom row: Notifications + Recommended ──── */}
      <div className="dash-bottom">
        {/* Recent Notifications */}
        <div className="card">
          <div className="card-body">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Notifications</h3>
              <Link to="/student/notifications" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            {notifications.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No new notifications</p>
            ) : (
              notifications.slice(0, 4).map(n => (
                <div key={n.notificationId} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: n.isRead ? 400 : 700, fontSize: 14, marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                  {!n.isRead && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommended Courses */}
        <div className="card">
          <div className="card-body">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recommended For You</h3>
              <Link to="/courses" className="btn btn-ghost btn-sm">See More</Link>
            </div>
            {courses.filter(c => c.isPublished && !enrollments.some(e => e.courseId === c.courseId)).length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recommendations yet</p>
            ) : (
              courses.filter(c => c.isPublished && !enrollments.some(e => e.courseId === c.courseId)).slice(0, 3).map(course => (
                <Link key={course.courseId} to={`/courses/${course.courseId}`} className="rec-course-item">
                  <div className="rec-thumb" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.level}</p>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    ₹{course.price?.toLocaleString()}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
