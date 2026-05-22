import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import CourseCard from '../components/common/CourseCard';
import { StatCard, Loader } from '../components/common/index';
import { courseAPI } from '../services/api';
import './GuestDashboard.css';

const GuestDashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getAll();
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const stats = [
    { label: 'Active Students', value: '12,000+', color: 'var(--primary)' },
    { label: 'Expert Courses',  value: '245+',    color: 'var(--success)' },
    { label: 'Instructors',     value: '90+',     color: 'var(--accent)' },
    { label: 'Satisfaction',    value: '98%',     color: '#7c3aed' },
  ];

  return (
    <DashboardLayout>
      <div className="guest-dash">
        {/* ── Welcome banner ──────────────────────────────── */}
        <div className="welcome-banner guest-banner">
          <div className="welcome-text">
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
              Welcome to <span style={{ color: '#fbbf24' }}>EduLearn</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, maxWidth: 600, lineHeight: 1.6 }}>
              Join the world's most innovative learning platform. 
              Explore thousands of courses and start your career journey today.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Link to="/register" className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700 }}>
                Join for Free
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div className="stats-row">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} color={s.color} />
          ))}
        </div>

        {/* ── Featured Content ───────────────────────────── */}
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-heading">Available Courses</h2>
            <Link to="/courses" className="btn btn-outline btn-sm">Browse All →</Link>
          </div>

          {loading ? (
            <Loader text="Loading amazing courses..." />
          ) : (
            <div className="courses-row">
              {courses.slice(0, 6).map(course => (
                <div key={course.courseId} className="guest-course-wrapper">
                  <CourseCard course={course} />
                  <div className="lock-overlay">
                    <div className="lock-content">
                      <span className="lock-icon">🔒</span>
                      <p>Login to Enroll</p>
                      <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Why Join ───────────────────────────────────── */}
        <div className="dash-bottom" style={{ gridTemplateColumns: '1fr' }}>
          <div className="card promo-card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 30, padding: 30 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--secondary)' }}>
                  Unlock Your Full Potential
                </h3>
                <ul className="promo-list">
                  <li>✨ Industry-recognized certificates</li>
                  <li>👥 Expert-led discussions</li>
                  <li>📊 Personalized progress tracking</li>
                  <li>🛠️ Hands-on projects and quizzes</li>
                </ul>
                <Link to="/register" className="btn btn-primary" style={{ marginTop: 20 }}>
                  Create Account Now
                </Link>
              </div>
              <div className="promo-visual">
                <div className="visual-circle" />
                <div className="visual-badge">100% Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GuestDashboardPage;
