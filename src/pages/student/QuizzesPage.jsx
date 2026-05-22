// src/pages/student/QuizzesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Loader, EmptyState } from '../../components/common/index';
import { enrollmentAPI, assessmentAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './QuizzesPage.css';

const QuizzesPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const [enrRes, attRes] = await Promise.all([
          enrollmentAPI.getByStudent(user.userId),
          assessmentAPI.getAttempts(user.userId)
        ]);

        const enrolledCourses = enrRes.data;
        const userAttempts = attRes.data;
        
        const quizPromises = enrolledCourses.map(async (enr) => {
          const [qRes, cRes] = await Promise.all([
            assessmentAPI.getQuizByCourse(enr.courseId),
            courseAPI.getById(enr.courseId)
          ]);
          return { courseId: enr.courseId, courseName: cRes.data.title, quizzes: qRes.data };
        });

        const results = await Promise.all(quizPromises);
        
        const allQuizzes = [];
        results.forEach(res => {
          res.quizzes.forEach(q => {
            const attempt = userAttempts.find(a => a.quizId === q.quizId);
            allQuizzes.push({ 
              ...q, 
              courseName: res.courseName,
              userAttempt: attempt 
            });
          });
        });

        setQuizzes(allQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchQuizzes();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader title="Quizzes" subtitle="Test your knowledge with assessments from your enrolled courses" />

      {loading ? <Loader /> : quizzes.length === 0 ? (
        <EmptyState 
          title="No Quizzes Found" 
          description="Your enrolled courses don't have any quizzes yet, or you haven't enrolled in any courses." 
          action={<Link to="/courses" className="btn btn-primary">Browse Courses</Link>}
        />
      ) : (
        <div className="quizzes-grid">
          {quizzes.map(quiz => {
            const hasAttempt = !!quiz.userAttempt;
            const score = quiz.userAttempt?.score;
            const passed = quiz.userAttempt?.passed;

            return (
              <div key={quiz.quizId} className={`quiz-card card ${hasAttempt ? 'completed' : ''}`}>
                <div className="card-body">
                  <div className="quiz-card-header">
                    <div className="course-tag">{quiz.courseName}</div>
                    <div className="flex-between">
                      <h3 className="quiz-title">{quiz.title}</h3>
                      {hasAttempt && (
                        <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="quiz-desc">{quiz.description}</p>
                  
                  {hasAttempt ? (
                    <div className="quiz-score-display">
                      <div className="score-value">{score}%</div>
                      <div className="score-label">Your Score</div>
                    </div>
                  ) : (
                    <div className="quiz-info-row">
                      <span>⏱ {quiz.timeLimitMinutes} mins</span>
                      <span>❓ {quiz.totalQuestions} questions</span>
                      <span>🎯 {quiz.passingScore}% to pass</span>
                    </div>
                  )}

                  <div className="quiz-actions">
                    {hasAttempt ? (
                      <Link to={`/student/quiz/result/${quiz.userAttempt.attemptId}`} className="btn btn-ghost btn-block">
                        View Result
                      </Link>
                    ) : (
                      <Link to={`/student/quiz/${quiz.quizId}`} className="btn btn-primary btn-block">
                        Take Quiz
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default QuizzesPage;
