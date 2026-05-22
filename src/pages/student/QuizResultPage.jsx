import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Loader, Alert } from '../../components/common/index';
import { assessmentAPI } from '../../services/api';
import './QuizResultPage.css';

const QuizResultPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await assessmentAPI.getAttemptDetails(attemptId);
        setResult(res.data);
      } catch (err) {
        setError("Failed to load quiz results.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;
  if (error) return <DashboardLayout><Alert type="error">{error}</Alert></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader 
        title="Quiz Review" 
        subtitle={`Reviewing results for: ${result.quizTitle}`}
        action={<Link to="/student/quiz" className="btn btn-outline btn-sm">Back to Quizzes</Link>}
      />

      <div className="result-summary card mb-4">
        <div className="card-body flex-between">
          <div>
            <div className="summary-label">Final Score</div>
            <div className="summary-value">{result.score}%</div>
          </div>
          <div className="text-right">
            <div className="summary-label">Status</div>
            <div className={`summary-status ${result.passed ? 'passed' : 'failed'}`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        </div>
      </div>

      <div className="questions-review">
        {result.questions.map((q, idx) => {
          const options = q.options ? q.options.split('|') : [];
          
          return (
            <div key={q.questionId} className={`review-card card mb-3 ${q.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="card-body">
                <div className="review-header">
                  <span className="question-number">Question {idx + 1}</span>
                  <span className={`result-badge ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                    {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                
                <h3 className="question-text">{q.text}</h3>
                
                <div className="options-list">
                  {options.map((opt, oIdx) => {
                    const isSelected = q.studentAnswer === opt;
                    const isCorrect = q.correctAnswer === opt;
                    
                    let optClass = "option-item";
                    if (isCorrect) optClass += " correct-opt";
                    if (isSelected && !isCorrect) optClass += " wrong-opt";

                    return (
                      <div key={oIdx} className={optClass}>
                        <div className="option-radio">
                          <div className={`radio-circle ${isSelected ? 'selected' : ''}`}></div>
                        </div>
                        <span className="option-text">{opt}</span>
                        {isCorrect && <span className="opt-indicator">Correct Answer</span>}
                        {isSelected && !isCorrect && <span className="opt-indicator">Your Choice</span>}
                      </div>
                    );
                  })}
                </div>
                
                {!q.isCorrect && q.studentAnswer && (
                  <div className="feedback-box">
                    <strong>Your Answer:</strong> {q.studentAnswer}
                  </div>
                )}
                {!q.studentAnswer && (
                  <div className="feedback-box warning">
                    <strong>Not Answered</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default QuizResultPage;
