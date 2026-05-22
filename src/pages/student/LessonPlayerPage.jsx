// src/pages/student/LessonPlayerPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ProgressBar, Badge, DiscussionBoard } from '../../components/common/index';
import { courseAPI, lessonAPI, progressAPI, assessmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './LessonPlayerPage.css';

const LessonPlayerPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completed, setCompleted]       = useState(new Set());
  const [showNotes, setShowNotes]       = useState(false);
  const [notes, setNotes]               = useState('');
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, lessonRes, progressRes, quizRes] = await Promise.all([
          courseAPI.getById(courseId),
          lessonAPI.getByCourse(courseId),
          progressAPI.getAllProgressByStudent(user.userId),
          assessmentAPI.getQuizByCourse(courseId).catch(() => ({ data: [] }))
        ]);
        
        setCourse(courseRes.data);
        setLessons(lessonRes.data);
        
        if (quizRes.data && quizRes.data.length > 0) {
          setCourseQuizzes(quizRes.data);
        }
        
        if (progressRes.data) {
          // Filter progress for this specific course and lessons that are marked completed
          const courseCompletedIds = progressRes.data
            .filter(p => p.courseId === Number(courseId) && p.isCompleted)
            .map(p => p.lessonId);
          setCompleted(new Set(courseCompletedIds));
        }
      } catch (err) {
        console.error("Error fetching lesson data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchData();
  }, [courseId, user]);

  const current = lessons[activeLesson];
  const progress = lessons.length > 0 ? Math.round((completed.size / lessons.length) * 100) : 0;

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    // If it's already an embed URL, return it
    if (url.includes('youtube.com/embed/')) return url;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // Fallback: If the URL itself looks like a video ID (11 chars)
    if (url.trim().length === 11 && !url.includes('/') && !url.includes('.')) {
      return `https://www.youtube.com/embed/${url.trim()}`;
    }
    
    return null;
  };

  const embedUrl = current ? getYoutubeEmbedUrl(current.contentUrl) : null;

  const playerRef = React.useRef(null);
  const [player, setPlayer] = useState(null);

  // Load YouTube API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    let progressInterval;

    const onPlayerStateChange = (event) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        progressInterval = setInterval(() => {
          const duration = event.target.getDuration();
          const currentTime = event.target.getCurrentTime();
          if (duration > 0 && (currentTime / duration) >= 0.9) {
            if (!completed.has(current.lessonId)) {
              markComplete();
              clearInterval(progressInterval);
            }
          }
        }, 2000);
      } else {
        clearInterval(progressInterval);
      }
    };

    const initPlayer = () => {
      if (embedUrl && window.YT && window.YT.Player) {
        // Use a small timeout to ensure the iframe is definitely in the DOM
        setTimeout(() => {
          try {
            const newPlayer = new window.YT.Player('youtube-player', {
              events: {
                'onStateChange': onPlayerStateChange
              }
            });
            setPlayer(newPlayer);
          } catch (err) {
            console.warn("YouTube Player initialization failed, retrying...", err);
          }
        }, 100);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(progressInterval);
      if (player && player.destroy) {
        try {
          player.destroy();
        } catch (e) {}
      }
      setPlayer(null);
    };
  }, [current?.lessonId, embedUrl]);

  const handleLessonClick = (idx) => {
    if (activeLesson === idx) {
      if (player && player.seekTo) {
        player.seekTo(0);
        player.playVideo();
      }
    } else {
      setActiveLesson(idx);
    }
  };

  const markComplete = async () => {
    if (!current) return;
    try {
      await progressAPI.markLessonComplete(user.userId, courseId, current.lessonId);
      setCompleted(prev => new Set([...prev, current.lessonId]));
    } catch (err) {
      console.error("Failed to mark lesson complete", err);
    }
  };

  if (loading) return <DashboardLayout><p style={{ padding: 40 }}>Loading...</p></DashboardLayout>;
  if (!current) return <DashboardLayout><p style={{ padding: 40 }}>No lessons available.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="player-layout">
        {/* Main Video Area */}
        <div className="player-main">
          {/* Video player */}
          <div className="video-player">
            {embedUrl ? (
              <div style={{ width: '100%', height: '100%' }}>
                <iframe
                  id="youtube-player"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  src={`${embedUrl}?enablejsapi=1&autoplay=1&mute=1&rel=0`}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="video-placeholder">
                <div className="play-btn-big">▶</div>
                <p>{current.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {current.contentType} · {current.durationMinutes} min
                </p>
              </div>
            )}
          </div>

          <div className="player-info card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Badge variant="primary">{current.contentType}</Badge>
                {current.isPreview && <Badge variant="success">Free Preview</Badge>}
                {completed.has(current.lessonId) && <Badge variant="success">✓ Completed</Badge>}
              </div>
                  <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
                    <button className={`btn btn-ghost btn-sm ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                      Notes
                    </button>
                    <button className={`btn btn-ghost btn-sm ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
                      Resources
                    </button>
                    <button className={`btn btn-ghost btn-sm ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
                       Discussion
                    </button>
                    {courseQuizzes.length > 0 && (
                      <Link to={`/student/quiz/${courseQuizzes[0].quizId}`} className="btn btn-primary btn-sm" style={{ background: '#7c3aed', borderRadius: 8 }}>
                        Take Course Quiz
                      </Link>
                    )}
                    {completed.has(current.lessonId) && (
                      <span className="badge badge-success" style={{ padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  {activeTab === 'overview' && (
                    <div className="overview-content">
                      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{current.title}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{course.title}</p>
                      <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                        This lesson covers the fundamentals of {course.category}. 
                        Use the discussions tab to ask questions or help others!
                      </div>
                    </div>
                  )}

                  {activeTab === 'resources' && (
                    <div className="resources-area">
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Supplementary Resources</h3>
                      {!current.resources || current.resources.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No resources available for this lesson.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {current.resources.map(res => (
                            <div key={res.resourceId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontSize: 24 }}>📄</div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{res.name}</p>
                                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{res.fileType}</p>
                                </div>
                              </div>
                              <a href={res.fileUrl} download={res.name} className="btn btn-outline btn-sm">
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

              {activeTab === 'discussion' && (
                <DiscussionBoard courseId={courseId} />
              )}

              {activeTab === 'notes' && (
                <div className="notes-area">
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 My Private Notes</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Type your notes here... (Only you can see these)" rows={8}
                    className="form-control" style={{ resize: 'vertical' }} />
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <button className="btn btn-primary btn-sm">Save Notes</button>
                  </div>
                </div>
              )}

              {/* Prev / Next navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-sm" disabled={activeLesson === 0} onClick={() => setActiveLesson(i => i - 1)}>← Previous</button>
                <div style={{ display: 'flex', gap: 10 }}>
                   {courseQuizzes.length > 0 && (
                      <Link to={`/student/quiz/${courseQuizzes[0].quizId}`} className="btn btn-ghost btn-sm" style={{ color: '#7c3aed' }}>
                        🎓 Take Course Quiz
                      </Link>
                    )}
                   <button className="btn btn-primary btn-sm" disabled={activeLesson === lessons.length - 1} onClick={() => setActiveLesson(i => i + 1)}>Next →</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: lesson list */}
        <aside className="player-sidebar card">
          <div style={{ padding: '16px 16px 0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Course Content</h3>
            <ProgressBar value={progress} showLabel={false} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 14 }}>
              {completed.size} / {lessons.length} lessons · {progress}% complete
            </p>
          </div>
          <div className="lesson-list">
            {lessons.map((lesson, idx) => (
              <div key={lesson.lessonId}
                className={`lesson-item ${activeLesson === idx ? 'active' : ''} ${completed.has(lesson.lessonId) ? 'done' : ''}`}
                onClick={() => handleLessonClick(idx)}>
                <div className="lesson-status">
                  {completed.has(lesson.lessonId) ? '✅' : activeLesson === idx ? '▶' : <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', display: 'inline-block' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: activeLesson === idx ? 700 : 400, fontSize: 13, color: activeLesson === idx ? 'var(--primary)' : 'var(--text)', lineHeight: 1.4 }}>
                    {idx + 1}. {lesson.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {lesson.contentType} · {lesson.durationMinutes}m
                    {lesson.isPreview && <span style={{ color: 'var(--success)', marginLeft: 6 }}>Free</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlayerPage;
