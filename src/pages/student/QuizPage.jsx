// src/pages/student/QuizPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Alert } from '../../components/common/index';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './QuizPage.css';

const QuizPage = () => {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  
  const [quiz, setQuiz]       = useState(null);
  const [bestScore, setBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase]     = useState('intro');   // intro | attempt | result
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult]   = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchQuizAndScore = async () => {
      setLoading(true);
      try {
        const id = assessmentId || 1;
        
        // Fetch quiz details
        const quizRes = await assessmentAPI.getQuiz(id);
        setQuiz(quizRes.data);
        setTimeLeft((quizRes.data.timeLimitMinutes || 15) * 60);

        // Fetch best score separately so it doesn't break if no attempts exist
        try {
          const scoreRes = await assessmentAPI.getBestScore(user.userId, id);
          if (scoreRes.data && scoreRes.data.score !== undefined) {
            setBestScore(scoreRes.data.score);
          }
        } catch (scoreErr) {
          // No attempts yet, which is expected
          setBestScore(null);
        }

      } catch (err) {
        console.error("Error fetching quiz or score:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizAndScore();
  }, [assessmentId, user.userId]);

  useEffect(() => {
    if (phase === 'attempt') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { 
            clearInterval(timerRef.current); 
            handleSubmit(true); 
            return 0; 
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleAnswer = (qId, ans) => setAnswers(prev => ({ ...prev, [qId]: ans }));

  const handleStart = async () => {
    try {
      const res = await assessmentAPI.startAttempt(quiz.quizId, user.userId);
      console.log("Attempt started:", res.data);
      setAttemptId(res.data.attemptId);
      
      // Update the quiz state with the questions returned for this specific attempt
      if (res.data.questions && res.data.questions.length > 0) {
        setQuiz(prev => ({
          ...prev,
          questions: res.data.questions
        }));
      }
      
      setPhase('attempt');
    } catch (err) {
      console.error("Failed to start attempt:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to start quiz: ${msg}`);
      
      // Auto-publish for debugging if it's a "not published" error
      if (msg.toLowerCase().includes("not published")) {
         if (window.confirm("This quiz is not published. Would you like to publish it now to test?")) {
            try {
              await assessmentAPI.publishQuiz(quiz.quizId);
              alert("Quiz published! Try starting again.");
            } catch (pErr) {
              alert("Failed to auto-publish quiz.");
            }
         }
      }
    }
  };

  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    try {
      const res = await assessmentAPI.submitAttempt({ 
        attemptId: attemptId, 
        answers: answers 
      });
      setResult({ ...res.data, auto });
      setPhase('result');
      
      // Refresh best score after submission
      const scoreRes = await assessmentAPI.getBestScore(user.userId, quiz.quizId);
      if (scoreRes.data && scoreRes.data.score !== undefined) {
        setBestScore(scoreRes.data.score);
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  if (loading) return <DashboardLayout><p style={{ padding: 40 }}>Loading quiz...</p></DashboardLayout>;
  if (!quiz) return <DashboardLayout><p style={{ padding: 40 }}>Quiz not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Quiz" subtitle={quiz.title} />

      {/* ── Intro ─────────────────────────────────────── */}
      {phase === 'intro' && (
        <div className="quiz-intro card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
              <h2 style={{ marginBottom: 8 }}>{quiz.title}</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 28px' }}>
                Test your understanding with this quiz. Read each question carefully.
              </p>
              
              {bestScore !== null && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ 
                    display: 'inline-flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: bestScore >= quiz.passingScore ? '#d1fae5' : '#fff7ed',
                    border: `1px solid ${bestScore >= quiz.passingScore ? '#10b981' : '#f97316'}`,
                    color: bestScore >= quiz.passingScore ? '#065f46' : '#9a3412'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your Best Score</span>
                    <span style={{ fontSize: 32, fontWeight: 800 }}>{bestScore}%</span>
                    <span style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                      {bestScore >= quiz.passingScore ? '🏆 Result: PASSED' : '✍️ Result: FAILED'}
                    </span>
                  </div>
                </div>
              )}

              <div className="quiz-meta-grid">
                <div className="quiz-meta-item">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{quiz.totalQuestions || 0} Questions</span>
                </div>
                <div className="quiz-meta-item">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{quiz.timeLimitMinutes} Minutes</span>
                </div>
                <div className="quiz-meta-item">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{quiz.passingScore}% to Pass</span>
                </div>
              </div>

              <Alert type="warning">Once started, the timer cannot be paused.</Alert>
              <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ minWidth: 200, marginTop: 20 }}>
                {bestScore !== null ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attempt ───────────────────────────────────── */}
      {phase === 'attempt' && (
        <div className="quiz-attempt">
          {/* Timer bar */}
          <div className="quiz-header card">
            <div className="card-body" style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>Question {current + 1}</span>
                  <span style={{ color: 'var(--text-muted)' }}> of {quiz.questions?.length || 0}</span>
                </div>
                <div className={`timer-badge ${timeLeft < 60 ? 'danger' : timeLeft < 180 ? 'warning' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {Object.keys(answers).length}/{quiz.questions?.length || 0} answered
                </div>
              </div>
              {/* Progress */}
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: `${((current + 1) / (quiz.questions?.length || 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="quiz-body">
            {/* Question */}
            <div className="card">
              <div className="card-body">
                {quiz.questions.map((q, idx) => idx === current && (
                  <div key={q.questionId}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
                      <div className="q-num">{idx + 1}</div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.6, marginBottom: 6 }}>{q.text}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.marks} mark{q.marks > 1 ? 's' : ''} · {q.type}</p>
                      </div>
                    </div>
                    <div className="options-list">
                      {q.options.map(opt => (
                        <label key={opt} className={`option-item ${answers[q.questionId] === opt ? 'selected' : ''}`}>
                          <input type="radio" name={`q-${q.questionId}`} value={opt}
                            checked={answers[q.questionId] === opt}
                            onChange={() => handleAnswer(q.questionId, opt)} />
                          <span className="option-text">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="quiz-nav">
              <button className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quiz.questions?.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`btn btn-sm ${current === i ? 'btn-primary' : answers[quiz.questions[i].questionId] ? 'btn-success' : 'btn-ghost'}`}
                    style={{ minWidth: 36 }}>
                    {i + 1}
                  </button>
                ))}
              </div>
              {current < (quiz.questions?.length || 0) - 1 ? (
                <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Next →</button>
              ) : (
                <button className="btn btn-success" onClick={() => handleSubmit(false)}>Submit Quiz ✓</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Result ────────────────────────────────────── */}
      {phase === 'result' && result && (
        <div className="quiz-result card">
          <div className="card-body" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>{result.passed ? 'Congratulations! You Passed!' : 'Keep Trying!'}</h2>
            {result.auto && <p style={{ color: 'var(--warning)', marginBottom: 16 }}>Time's up — quiz auto-submitted.</p>}

            <div className="result-score-circle" style={{ background: result.passed ? '#d1fae5' : '#fee2e2', color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
              <div style={{ fontSize: 42, fontWeight: 800 }}>{result.score}%</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Your Score</div>
            </div>

            <div className="result-stats">
              {[
                ['Passing Score', `${quiz.passingScore}%`], 
                ['Status', result.passed ? 'PASSED' : 'FAILED'], 
                ['Questions', quiz.questions.length]
              ].map(([label, val]) => (
                <div key={label} className="result-stat">
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              <button className="btn btn-primary" onClick={() => { setPhase('intro'); setAnswers({}); setCurrent(0); setTimeLeft(quiz.timeLimitMinutes * 60); setResult(null); }}>
                Try Again
              </button>
              <Link to={`/student/quiz/result/${result.attemptId}`} className="btn btn-success">
                Review Detailed Results
              </Link>
              <button className="btn btn-outline" onClick={() => window.location.href = '/student/quiz'}>
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QuizPage;
