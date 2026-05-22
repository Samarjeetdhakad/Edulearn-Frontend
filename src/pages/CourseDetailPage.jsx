// src/pages/CourseDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Badge, Loader, Alert, DiscussionBoard } from '../components/common/index';
import { useAuth } from '../context/AuthContext';
import { courseAPI, lessonAPI, enrollmentAPI, paymentAPI } from '../services/api';
import './CourseDetailPage.css';

const THUMBNAILS = {
  Backend: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
  Frontend: 'linear-gradient(135deg, #7c3aed, #db2777)',
  'Data Science': 'linear-gradient(135deg, #065f46, #10b981)',
  DevOps: 'linear-gradient(135deg, #92400e, #f59e0b)',
  Database: 'linear-gradient(135deg, #1e1b4b, #4f46e5)',
  'Computer Science': 'linear-gradient(135deg, #7f1d1d, #ef4444)',
};

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse]     = useState(null);
  const [lessons, setLessons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [enrolled, setEnrolled] = useState(() => {
    // Pre-populate from localStorage so Buy Now never flashes for enrolled students
    try {
      const cached = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
      return cached.includes(Number(window.location.pathname.split('/').pop()));
    } catch { return false; }
  });
  const [enrolling, setEnrolling] = useState(false);
  const [alert, setAlert]       = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewLesson, setPreviewLesson] = useState(null);

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAlert(null);
      try {
        console.log("Fetching course detail for ID:", courseId);
        
        let courseData;
        // Fetch course first
        try {
          const courseRes = await courseAPI.getById(courseId);
          courseData = courseRes.data;
          setCourse(courseData);
        } catch (cErr) {
          console.error("Course fetch failed:", cErr);
          setAlert({ type: 'error', message: 'The Course Service is temporarily unavailable. Please refresh.' });
          setLoading(false);
          return;
        }

        // Fetch lessons separately so it doesn't block the course view
        try {
          const lessonRes = await lessonAPI.getByCourse(courseId);
          setLessons(lessonRes.data);
        } catch (lErr) {
          console.error("Lessons fetch failed:", lErr);
        }
        
        if (user) {
          try {
            const enrollRes = await enrollmentAPI.isEnrolled(user.userId, courseId);
            const isInstructor = courseData?.instructorId === user.userId;
            const isEnrolled = enrollRes.data || isInstructor;
            setEnrolled(isEnrolled);
            // Cache enrollment status in localStorage
            if (isEnrolled) {
              try {
                const cached = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
                if (!cached.includes(Number(courseId))) {
                  cached.push(Number(courseId));
                  localStorage.setItem('enrolledCourses', JSON.stringify(cached));
                }
              } catch {}
            }
          } catch (eErr) {
            console.error("Enrollment check failed:", eErr);
          }
        }
      } catch (err) {
        console.error("General fetch error:", err);
        setAlert({ type: 'error', message: 'Failed to load page data. Please check your connection.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }

    // Free course → enroll directly
    if (!course.price || course.price === 0) {
      setEnrolling(true);
      try {
        await enrollmentAPI.enroll({ studentId: user.userId, courseId: Number(courseId) });
        setEnrolled(true);
        try {
          const cached = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
          if (!cached.includes(Number(courseId))) {
            cached.push(Number(courseId));
            localStorage.setItem('enrolledCourses', JSON.stringify(cached));
          }
        } catch {}
        setAlert({ type: 'success', message: 'Successfully enrolled! Start learning now.' });
      } catch (err) {
        setAlert({ type: 'error', message: 'Enrollment failed. Please try again.' });
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid course → Razorpay flow
    setEnrolling(true);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await paymentAPI.createOrder({
        studentId: user.userId,
        courseId: Number(courseId),
        amount: course.price,
        currency: 'INR'
      });

      const { razorpayOrderId, amount, currency } = orderRes.data;
      console.log('Order created:', orderRes.data);

      // 2. Open Razorpay checkout
      const options = {
        key: 'rzp_test_ShEiuCaziQNsKn', // Razorpay test key
        amount: amount, // in paise
        currency: currency || 'INR',
        name: 'EduLearn',
        description: `Purchase: ${course.title}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          console.log('Razorpay response received:', response);
          setAlert({ type: 'info', message: 'Verifying payment and enrolling...' });
          
          let verified = false;
          try {
            // 3. Verify payment on backend
            await paymentAPI.verifyPayment({
              studentId: user.userId,
              courseId: Number(courseId),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            verified = true;
          } catch (verifyErr) {
            console.error('Payment verification failed on server:', verifyErr);
            // We log but don't stop here to ensure user gets access if they paid
          }

          // 4. Auto-enroll after payment (Always try this if payment handler reached)
          try {
            await enrollmentAPI.enroll({ studentId: user.userId, courseId: Number(courseId) });
            setEnrolled(true);
            // Persist enrollment in localStorage
            try {
              const cached = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
              if (!cached.includes(Number(courseId))) {
                cached.push(Number(courseId));
                localStorage.setItem('enrolledCourses', JSON.stringify(cached));
              }
            } catch {}
            setAlert({ type: 'success', message: '🎉 Success! You are now enrolled and can start learning.' });
          } catch (enrollErr) {
            console.error('Auto-enrollment failed:', enrollErr);
            if (!verified) {
              setAlert({ type: 'error', message: 'There was a problem with your enrollment. Please contact support.' });
            } else {
              // Already enrolled or something else, but verified was true, so just show success
              setEnrolled(true);
              try {
                const cached = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
                if (!cached.includes(Number(courseId))) {
                  cached.push(Number(courseId));
                  localStorage.setItem('enrolledCourses', JSON.stringify(cached));
                }
              } catch {}
              setAlert({ type: 'success', message: '🎉 You are enrolled! Start learning.' });
            }
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function () {
            setEnrolling(false);
            setAlert({ type: 'info', message: 'Payment cancelled.' });
          }
        }
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setAlert({ type: 'error', message: 'Failed to initiate payment. Please try again.' });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div><Navbar /><Loader text="Loading course..." /></div>;
  if (!course) return <div><Navbar /><p style={{ padding: 40 }}>Course not found.</p></div>;

  const bg = THUMBNAILS[course.category] || 'linear-gradient(135deg, var(--primary), #7c3aed)';
  const hasThumb = course.thumbnailUrl && course.thumbnailUrl.trim() !== '';
  const enrollThumbStyle = hasThumb
    ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: bg };
  const totalHours = Math.floor(course.totalDuration / 60);
  const totalMins  = course.totalDuration % 60;

  return (
    <div className="course-detail-page">
      <Navbar />

      {/* ── Hero Banner ──────────────────────────────── */}
      <div className="detail-hero" style={{ background: '#0f172a' }}>
        <div className="container">
          <div className="detail-hero-inner">
            <div className="detail-hero-left">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <Badge variant="primary">{course.category}</Badge>
                <Badge variant={course.level === 'BEGINNER' ? 'success' : course.level === 'INTERMEDIATE' ? 'warning' : 'danger'}>{course.level}</Badge>
                <Badge variant="gray">{course.language}</Badge>
              </div>
              <h1 className="detail-title">{course.title}</h1>
              <p className="detail-desc">{course.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  {course.totalEnrollments.toLocaleString()} students
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Created by <strong style={{ color: '#fff' }}>{course.instructorName}</strong>
              </p>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                {[`${totalHours}h ${totalMins}m total`, `${lessons.length} lessons`, course.language, 'Last updated 2026'].map((text) => (
                  <span key={text} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{text}</span>
                ))}
              </div>
            </div>

            {/* Enroll Card */}
            <div className="enroll-card card">
              <div className="enroll-thumb" style={enrollThumbStyle}>
              </div>
              <div className="card-body">
                <div className="enroll-price">
                  {course.price === 0 ? (
                    <span style={{ color: 'var(--success)', fontSize: 28, fontWeight: 800 }}>FREE</span>
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 800 }}>₹{course.price.toLocaleString()}</span>
                  )}
                </div>

                {alert && <Alert type={alert.type}>{alert.message}</Alert>}

                {enrolled ? (
                  <Link to={`/student/lesson/${course.courseId}`} className="btn btn-success w-100 btn-lg">
                    {course.instructorId === user?.userId ? '▶ Preview Course Content' : '▶ Continue Learning'}
                  </Link>
                ) : (
                  <button className="btn btn-primary w-100 btn-lg" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll for Free' : 'Buy Now'}
                  </button>
                )}


                <div className="divider" />
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>This course includes:</p>
                {[`${totalHours}h ${totalMins}m video`, 'Downloadable resources', 'Certificate of completion', 'Lifetime access', 'Access on mobile & desktop'].map((text) => (
                  <p key={text} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="detail-tabs-bar">
        <div className="container">
          {['overview', 'curriculum', 'discussion'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────── */}
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="detail-body">
          <div className="detail-main">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body">
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What you'll learn</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {['Build production-ready microservices', 'Implement JWT authentication', 'Set up Spring Cloud Gateway', 'Use Eureka service discovery', 'Deploy with Docker', 'Write clean, testable code'].map(item => (
                        <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>About this course</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{course.description}</p>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginTop: 12 }}>
                      This course is designed for developers who want to build scalable, production-ready applications
                      using modern Java and Spring Boot ecosystem tools.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Course Curriculum</h2>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {lessons.length} lessons · {totalHours}h {totalMins}m
                    </span>
                  </div>
                  {lessons.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No lessons added yet.</p>
                  ) : (
                    lessons.map((lesson, idx) => (
                      <div key={lesson.lessonId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: idx < lessons.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 32, height: 32, background: lesson.isPreview ? 'var(--primary-light)' : 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{idx + 1}. {lesson.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {lesson.contentType} · {lesson.durationMinutes} min
                          </p>
                        </div>
                        {lesson.isPreview ? (
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              if (lesson.contentType === 'VIDEO') {
                                setPreviewLesson(lesson);
                              } else {
                                setAlert({ type: 'info', message: 'This preview content is not a video.' });
                              }
                            }}
                            style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            ▶ Watch Preview
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lesson.durationMinutes}m</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === 'discussion' && (
              <div className="card">
                <div className="card-body">
                  {enrolled ? (
                    <DiscussionBoard courseId={courseId} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                       <h3 style={{ marginBottom: 12 }}>Join the Conversation</h3>
                       <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                         Enroll in this course to participate in discussions and ask questions.
                       </p>
                       <button className="btn btn-primary" onClick={handleEnroll}>Enroll Now</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content card" style={{ maxWidth: 800, width: '90%' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>Free Preview: {previewLesson.title}</h3>
                <button className="btn btn-ghost" onClick={() => setPreviewLesson(null)}>✕ Close</button>
              </div>
              <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
                {getYoutubeEmbedUrl(previewLesson.contentUrl) ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    src={getYoutubeEmbedUrl(previewLesson.contentUrl)}
                    title={previewLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <p style={{ margin: 0 }}>This preview video URL is missing or invalid.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CourseDetailPage;
