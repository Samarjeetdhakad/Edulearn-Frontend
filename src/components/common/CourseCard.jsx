import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './index';
import { useAuth } from '../../context/AuthContext';
import './CourseCard.css';

const levelColors = { BEGINNER: 'success', INTERMEDIATE: 'warning', ADVANCED: 'danger' };

const THUMBNAILS = {
  Backend:          'linear-gradient(135deg, #1e3a5f, #2563eb)',
  Frontend:         'linear-gradient(135deg, #7c3aed, #db2777)',
  'Data Science':   'linear-gradient(135deg, #065f46, #10b981)',
  DevOps:           'linear-gradient(135deg, #92400e, #f59e0b)',
  Database:         'linear-gradient(135deg, #1e1b4b, #4f46e5)',
  'Computer Science':'linear-gradient(135deg, #7f1d1d, #ef4444)',
};

const CourseCard = ({ course, showProgress, progressPercent, completedVideos, totalVideos, enrolled }) => {
  const { user } = useAuth();
  const isGuest = !user;

  const gradientBg = THUMBNAILS[course.category] || 'linear-gradient(135deg, var(--primary), #7c3aed)';
  const hasImage = course.thumbnailUrl && course.thumbnailUrl.trim() !== '';
  const thumbStyle = hasImage
    ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: gradientBg };

  const targetLink = isGuest ? '/login' : `/courses/${course.courseId}`;

  return (
    <div className={`course-card card card-hover ${isGuest ? 'guest-locked' : ''}`}>
      {/* Thumbnail */}
      <Link to={targetLink} className="course-thumb" style={thumbStyle}>
        <div className="thumb-overlay">
          <div className="thumb-category">{course.category}</div>
          <div className="thumb-duration">{Math.floor(course.totalDuration / 60)}h {course.totalDuration % 60}m</div>
        </div>
        {course.isPublished === false && (
          <div className="draft-ribbon">Draft</div>
        )}
        {isGuest && (
          <div className="guest-lock-badge">
            <span>🔒 Login to access</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="course-body">
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <Badge variant={levelColors[course.level] || 'gray'}>{course.level}</Badge>
          <Badge variant="gray">{course.language}</Badge>
          {enrolled && <Badge variant="primary">Enrolled</Badge>}
        </div>

        <Link to={targetLink} className="course-title">
          {course.title}
        </Link>

        <p className="course-instructor">{course.instructorName}</p>

        {showProgress && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {completedVideos !== undefined ? `${completedVideos} of ${totalVideos} videos` : 'Progress'}
              </span>
              <span style={{ fontWeight: 700, color: progressPercent === 100 ? 'var(--success)' : 'var(--primary)' }}>
                {progressPercent}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? 'var(--success)' : 'var(--primary)'
              }} />
            </div>
          </div>
        )}

        <div className="course-footer">
          <div className="course-price">
            {course.price === 0 ? (
              <span style={{ color: 'var(--success)', fontWeight: 800 }}>FREE</span>
            ) : (
              <span>₹{course.price.toLocaleString()}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {enrolled ? (
              <Link to={`/student/lesson/${course.courseId}`} className="btn btn-success btn-sm">
                Continue
              </Link>
            ) : isGuest ? (
              <Link to="/login" className="btn btn-primary btn-sm">
                View Course
              </Link>
            ) : (
              <Link to={`/courses/${course.courseId}`} className="btn btn-outline btn-sm">
                View Course
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
