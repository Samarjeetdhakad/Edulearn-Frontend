// src/pages/student/MyLearningPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CourseCard from '../../components/common/CourseCard';
import { PageHeader, EmptyState, Loader } from '../../components/common/index';
import { enrollmentAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MyLearningPage = () => {
  const { user } = useAuth();
  const [filter, setFilter]     = useState('ALL');
  const [enrollments, setEnr]   = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrRes, courseRes, progRes] = await Promise.all([
          enrollmentAPI.getByStudent(user.userId),
          courseAPI.getAll(),
          import('../../services/api').then(m => m.progressAPI.getAllProgressByStudent(user.userId))
        ]);
        setEnr(enrRes.data);
        setAllCourses(courseRes.data);
        setProgressData(progRes.data);

        // Fetch lesson counts for enrolled courses
        const counts = {};
        await Promise.all(enrRes.data.map(async (e) => {
           try {
              const countRes = await import('../../services/api').then(m => m.lessonAPI.getCount(e.courseId));
              counts[e.courseId] = countRes.data;
           } catch (err) {
              counts[e.courseId] = 0;
           }
        }));
        setLessonCounts(counts);
      } catch (err) {
        console.error("Error fetching my learning data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchData();
  }, [user]);

  const processedCourses = enrollments.map(e => {
    const courseDetail = allCourses.find(c => c.courseId === e.courseId);
    if (!courseDetail) return null;
    const completedVideos = progressData.filter(p => p.courseId === e.courseId && p.isCompleted).length;
    const totalVideos = lessonCounts[e.courseId] || 0;
    const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const derivedStatus = progressPercent === 100 ? 'COMPLETED' : 'ACTIVE';
    return { ...courseDetail, progressPercent, completedVideos, totalVideos, status: derivedStatus };
  }).filter(Boolean);

  const courses = processedCourses.filter(c => filter === 'ALL' || c.status === filter);

  const tabs = [{ key: 'ALL', label: 'All Courses' }, { key: 'ACTIVE', label: 'In Progress' }, { key: 'COMPLETED', label: 'Completed' }];

  return (
    <DashboardLayout>
      <PageHeader title="My Learning" subtitle="Track your progress across all enrolled courses" />
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '0 20px', display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="btn btn-sm" style={{ borderRadius: 0, borderBottom: filter === t.key ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', color: filter === t.key ? 'var(--primary)' : 'var(--text-muted)', fontWeight: filter === t.key ? 700 : 400, padding: '14px 16px' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Loader /> : courses.length === 0 ? (
        <EmptyState title="No courses here" description="Enroll in courses to start learning."
          action={<Link to="/courses" className="btn btn-primary">Browse Courses</Link>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {courses.map(c => <CourseCard key={c.courseId} course={c} showProgress progressPercent={c.progressPercent} completedVideos={c.completedVideos} totalVideos={c.totalVideos} enrolled />)}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyLearningPage;
