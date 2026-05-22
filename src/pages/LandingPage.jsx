// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CourseCard from '../components/common/CourseCard';

import { courseAPI } from '../services/api';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await courseAPI.getFeatured();
        setFeaturedCourses(res.data);
      } catch (err) {
        console.error("Error fetching featured courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    else navigate('/courses');
  };

  const stats = [
    { value: '12,000+', label: 'Active Students' },
    { value: '245+',    label: 'Expert Courses' },
    { value: '90+',     label: 'Instructors' },
    { value: '98%',     label: 'Satisfaction Rate' },
  ];

  const features = [
    { icon: '🎯', title: 'Structured Learning', desc: 'Carefully designed curriculum from beginner to advanced levels.' },
    { icon: '📱', title: 'Learn Anywhere',      desc: 'Access courses on desktop, tablet, and mobile anytime.' },
    { icon: '🏆', title: 'Earn Certificates',   desc: 'Verifiable certificates to showcase your achievements.' },
    { icon: '💬', title: 'Community Forums',    desc: 'Learn together with peers and get help from instructors.' },
    { icon: '♾️', title: 'Lifetime Access',     desc: 'Buy once, access forever. Learn at your own pace.' },
    { icon: '🔄', title: 'Regular Updates',     desc: 'Content updated regularly to match industry standards.' },
  ];

  const testimonials = [
    { name: 'Ravi Kumar',   role: 'Backend Developer', text: 'EduLearn helped me land my first job! The Spring Boot course was exceptional.', rating: 5 },
    { name: 'Priya Singh',  role: 'Data Analyst',      text: 'The Python ML course was perfectly structured. Got placed in a top firm.', rating: 5 },
    { name: 'Arjun Sharma', role: 'Full Stack Dev',    text: 'Best platform for learning! The discussions and live projects helped a lot.', rating: 5 },
  ];

  return (
    <div className="landing">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">India's #1 Tech Learning Platform</div>
            <h1 className="hero-title">
              Learn <span className="gradient-text">In-Demand Skills</span><br />
              Build Your Career
            </h1>
            <p className="hero-sub">
              Master Java, React, Python, DevOps & more with hands-on projects,
              industry mentors, and verifiable certificates.
            </p>

            {/* Search */}
            <div className="hero-search">
              <input
                type="text" placeholder="Search for courses, skills, topics..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            </div>

            {/* Popular tags */}
            <div className="hero-tags">
              <span>Popular:</span>
              {['Spring Boot', 'React.js', 'Python', 'DSA', 'Docker'].map(tag => (
                <Link key={tag} to={`/courses?search=${tag}`} className="tag-pill">{tag}</Link>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">Start Learning Free</Link>
              <Link to="/courses" className="btn btn-outline btn-lg">Browse Courses</Link>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual">
            <div className="hero-card main-card">
              <div className="card-thumb" style={{ padding: 0, overflow: 'hidden' }}>
                <img
                  src="/course-thumbnail.png"
                  alt="Spring Boot Microservices"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div className="card-info">
                <p className="card-title">Spring Boot Microservices</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="mini-progress" style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ width: '65%', height: '100%', background: '#2563eb', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>65%</span>
                </div>
              </div>
            </div>
            <div className="static-badge badge-1">
              🏆 Certificate Earned!
            </div>
            <div className="static-badge badge-2">
              🚀 3,420 Students
            </div>
            <div className="static-badge badge-3">
              ⭐ 4.8 Rating
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="section" id="categories">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Explore by Category</h2>
            <p className="section-sub">Find courses in your area of interest</p>
          </div>
          <div className="categories-grid">
            {[
              { name: "Backend", icon: "", count: 45 },
              { name: "Frontend", icon: "", count: 38 },
              { name: "Data Science", icon: "", count: 29 },
              { name: "DevOps", icon: "", count: 22 },
              { name: "Database", icon: "", count: 17 },
              { name: "Computer Science", icon: "", count: 31 }
            ].map((cat, i) => (
              <Link key={i} to={`/courses?category=${cat.name}`} className="category-card">
                <div className="cat-name">{cat.name}</div>
                <div className="cat-count">{cat.count} courses</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="flex-between mb-4">
            <div>
              <h2 className="section-title">Featured Courses</h2>
              <p className="section-sub">Top picks by our expert instructors</p>
            </div>
            <Link to="/courses" className="btn btn-outline">View All →</Link>
          </div>
          <div className="grid-3">
            {loading ? (
              <p>Loading featured courses...</p>
            ) : featuredCourses.length === 0 ? (
              <p>No featured courses at the moment.</p>
            ) : (
              featuredCourses.slice(0, 3).map(course => (
                <CourseCard key={course.courseId} course={course} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="section features-section">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Why Choose EduLearn?</h2>
            <p className="section-sub">Everything you need to succeed in your learning journey</p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="feature-card card">
                <div className="card-body">
                  <div className="feature-icon">{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instructor CTA ────────────────────────────────── */}
      <section className="instructor-cta">
        <div className="container">
          <div className="cta-content">
            <div>
              <h2>Are you an Expert? Teach on EduLearn</h2>
              <p>Share your knowledge, build your audience, and earn income teaching what you love.</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
                <Link to="/register?role=instructor" className="btn btn-primary btn-lg">Start Teaching</Link>
                <a href="#" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>Learn More</a>
              </div>
            </div>
            <div className="cta-stats">
              {[['₹2.4 Cr+', 'Paid to instructors'], ['15,000+', 'Student enrollments']].map(([v, l]) => (
                <div key={l} className="cta-stat">
                  <div className="cta-stat-value">{v}</div>
                  <div className="cta-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">What Our Students Say</h2>
            <p className="section-sub">Real stories from real learners</p>
          </div>
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card card">
                <div className="card-body">

                  <p style={{ marginTop: 14, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="final-cta">
        <div className="container text-center">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>Join 12,000+ learners who are already building their careers on EduLearn</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started — It's Free</Link>
            <Link to="/courses"  className="btn btn-outline btn-lg">Browse Courses</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
