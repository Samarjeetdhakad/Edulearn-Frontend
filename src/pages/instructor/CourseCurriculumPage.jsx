// src/pages/instructor/CourseCurriculumPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Alert, Loader, Badge, EmptyState } from '../../components/common/index';
import { lessonAPI, courseAPI, assessmentAPI } from '../../services/api';
import './CourseCurriculumPage.css';

const CourseCurriculumPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', contentType: 'VIDEO', durationMinutes: '', isPreview: false, contentUrl: '',
    resourceFileBase64: null, resourceFileName: ''
  });

  // Quiz Modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    text: '', type: 'MCQ', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', marks: 10
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes, qRes] = await Promise.all([
        courseAPI.getById(courseId),
        lessonAPI.getByCourse(courseId),
        assessmentAPI.getQuizByCourse(courseId).catch(() => ({ data: [] }))
      ]);
      
      if (cRes.data) setCourse(cRes.data);
      if (lRes.data) setLessons(lRes.data.sort((a, b) => a.orderIndex - b.orderIndex));
      if (qRes.data) setQuizzes(qRes.data);
      
      setAlert(null); // Clear any previous errors
    } catch (err) {
      console.error("Curriculum Load Error:", err);
      const msg = err.response?.status === 503 ? "Service Unavailable (Is the Gateway/Lesson Service running?)" : "Failed to load curriculum data. Please check your backend.";
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        contentType: lesson.contentType,
        durationMinutes: lesson.durationMinutes,
        isPreview: lesson.isPreview,
        contentUrl: lesson.contentUrl || ''
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', contentType: 'VIDEO', durationMinutes: '', isPreview: false, contentUrl: '', resourceFileBase64: null, resourceFileName: '' });
    }
    setShowModal(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...lessonForm,
        courseId: parseInt(courseId),
        durationMinutes: parseInt(lessonForm.durationMinutes) || 0,
        orderIndex: editingLesson ? editingLesson.orderIndex : lessons.length
      };

      if (editingLesson) {
        await lessonAPI.update(editingLesson.lessonId, payload);
        if (lessonForm.resourceFileBase64) {
          await lessonAPI.addResource(editingLesson.lessonId, { name: lessonForm.resourceFileName, fileUrl: lessonForm.resourceFileBase64, fileType: 'PDF' });
        }
        setAlert({ type: 'success', message: 'Lesson updated!' });
      } else {
        const res = await lessonAPI.add(payload);
        if (lessonForm.resourceFileBase64 && res.data) {
          await lessonAPI.addResource(res.data.lessonId, { name: lessonForm.resourceFileName, fileUrl: lessonForm.resourceFileBase64, fileType: 'PDF' });
        }
        setAlert({ type: 'success', message: 'Lesson added!' });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to save lesson.' });
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await lessonAPI.delete(id);
      setAlert({ type: 'success', message: 'Lesson deleted.' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete lesson.' });
    }
  };

  const handleMove = async (index, direction) => {
    const newLessons = [...lessons];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap
    [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
    
    try {
      await lessonAPI.reorder(courseId, newLessons.map(l => l.lessonId));
      setLessons(newLessons);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to reorder lessons.' });
    }
  };

  const handleOpenQuizModal = async (quiz) => {
    setSelectedQuiz(quiz);
    setQuestionForm({ text: '', type: 'MCQ', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', marks: 10 });
    try {
      const res = await assessmentAPI.getQuiz(quiz.quizId);
      setSelectedQuiz(res.data);
    } catch (err) {
      console.error("Failed to fetch quiz details", err);
    }
    setShowQuizModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const options = questionForm.type === 'MCQ' 
        ? [questionForm.option1, questionForm.option2, questionForm.option3, questionForm.option4].filter(Boolean)
        : ['TRUE', 'FALSE'];
      
      const payload = {
        text: questionForm.text,
        type: questionForm.type,
        options: options,
        correctAnswer: questionForm.correctAnswer,
        marks: parseInt(questionForm.marks) || 10
      };

      await assessmentAPI.addQuestion(selectedQuiz.quizId, payload);
      setAlert({ type: 'success', message: 'Question added successfully!' });
      
      const res = await assessmentAPI.getQuiz(selectedQuiz.quizId);
      setSelectedQuiz(res.data);
      setQuestionForm({ ...questionForm, text: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to add question.' });
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await assessmentAPI.deleteQuestion(qId);
      const res = await assessmentAPI.getQuiz(selectedQuiz.quizId);
      setSelectedQuiz(res.data);
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete question.' });
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      await assessmentAPI.publishQuiz(quizId);
      setAlert({ type: 'success', message: 'Quiz published!' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to publish quiz.' });
    }
  };

  if (loading) return <DashboardLayout><Loader text="Loading curriculum..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader 
        title="Manage Curriculum" 
        subtitle={course ? `Organize lessons for "${course.title}"` : "Loading course details..."}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => navigate('/instructor/courses')}>Back to Courses</button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Lesson</button>
            <button className="btn btn-primary" onClick={() => {
              const title = prompt("Enter Quiz Title:");
              if (title) {
                assessmentAPI.createQuiz({
                  courseId: parseInt(courseId),
                  title: title,
                  description: "New Quiz",
                  timeLimitMinutes: 15,
                  passingScore: 70,
                  maxAttempts: 3
                }).then(() => fetchData()).catch(err => setAlert({ type: 'error', message: 'Failed to create quiz' }));
              }
            }}>+ Add Quiz</button>
          </div>
        }
      />

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <div className="curriculum-container">
        {lessons.length === 0 ? (
          <EmptyState 
            icon="📚" 
            title="No lessons yet" 
            description="Start building your course by adding your first lesson."
            action={<button className="btn btn-primary" onClick={() => handleOpenModal()}>Add Your First Lesson</button>}
          />
        ) : (
          <div className="lesson-cards">
            {lessons.map((lesson, idx) => (
              <div key={lesson.lessonId} className="curriculum-card card">
                <div className="card-body curriculum-item">
                  <div className="item-order">
                    <button className="order-btn" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>▲</button>
                    <span className="order-num">{idx + 1}</span>
                    <button className="order-btn" onClick={() => handleMove(idx, 1)} disabled={idx === lessons.length - 1}>▼</button>
                  </div>

                  <div className="item-content">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <Badge variant="primary">{lesson.contentType}</Badge>
                      {lesson.isPreview && <Badge variant="success">Free Preview</Badge>}
                    </div>
                    <h4 className="item-title">{lesson.title}</h4>
                    <p className="item-meta">{lesson.durationMinutes} minutes</p>
                  </div>

                  <div className="item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(lesson)}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDeleteLesson(lesson.lessonId)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quizzes.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ marginBottom: 20 }}>Course Quizzes</h3>
            <div className="lesson-cards">
              {quizzes.map((quiz, idx) => (
                <div key={quiz.quizId} className="curriculum-card card">
                  <div className="card-body curriculum-item" style={{ borderLeft: '4px solid #7c3aed' }}>
                    <div className="item-order">
                      <span className="order-num" style={{ color: '#7c3aed' }}>Q</span>
                    </div>

                    <div className="item-content">
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <Badge variant="primary" style={{ background: '#7c3aed' }}>QUIZ</Badge>
                        {quiz.isPublished ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Draft</Badge>}
                      </div>
                      <h4 className="item-title">{quiz.title}</h4>
                      <p className="item-meta">{quiz.timeLimitMinutes} mins · {quiz.totalQuestions || 0} questions · Pass: {quiz.passingScore}%</p>
                    </div>

                    <div className="item-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenQuizModal(quiz)}>Edit Questions</button>
                      {!quiz.isPublished && (
                         <button className="btn btn-ghost btn-sm text-success" onClick={() => handlePublishQuiz(quiz.quizId)}>Publish</button>
                      )}
                      <button className="btn btn-ghost btn-sm text-error">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="card-body">
              <h3 style={{ marginBottom: 20 }}>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <form onSubmit={handleSaveLesson}>
                <div className="form-group">
                  <label className="form-label">Lesson Title</label>
                  <input className="form-control" value={lessonForm.title} 
                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-control" value={lessonForm.contentType}
                      onChange={e => setLessonForm({...lessonForm, contentType: e.target.value})}>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>
                </div>

                {lessonForm.contentType === 'VIDEO' && (
                  <div className="form-group">
                    <label className="form-label">YouTube Video URL</label>
                    <input type="url" className="form-control" value={lessonForm.contentUrl} 
                      onChange={e => setLessonForm({...lessonForm, contentUrl: e.target.value})} 
                      placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Attach Resource (PDF / Document)</label>
                  <input type="file" accept="application/pdf,.doc,.docx" className="form-control"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLessonForm({...lessonForm, resourceFileBase64: reader.result, resourceFileName: file.name});
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setLessonForm({...lessonForm, resourceFileBase64: null, resourceFileName: ''});
                      }
                    }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    This resource will be available for students to download in the Resources tab.
                  </p>
                </div>

                <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="checkbox" checked={lessonForm.isPreview} 
                    onChange={e => setLessonForm({...lessonForm, isPreview: e.target.checked})} id="isPreview" />
                  <label htmlFor="isPreview" className="form-label" style={{ marginBottom: 0 }}>Enable Free Preview</label>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Lesson</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: 800 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Edit Quiz: {selectedQuiz.title}</h3>
                <button className="btn btn-ghost" onClick={() => setShowQuizModal(false)}>✕ Close</button>
              </div>

              <div style={{ display: 'flex', gap: 24 }}>
                {/* Existing Questions List */}
                <div style={{ flex: 1, borderRight: '1px solid var(--border)', paddingRight: 24, maxHeight: '60vh', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: 16 }}>Questions ({selectedQuiz.questions?.length || 0})</h4>
                  {(!selectedQuiz.questions || selectedQuiz.questions.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No questions added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedQuiz.questions.map((q, i) => (
                        <div key={q.questionId} style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px 0' }}>{i + 1}. {q.text}</p>
                            <button onClick={() => handleDeleteQuestion(q.questionId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}>✕</button>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Badge variant="primary">{q.type}</Badge>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.marks} marks</span>
                          </div>
                          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            {q.options.map(opt => (
                              <li key={opt} style={{ color: opt === q.correctAnswer ? 'var(--success)' : 'inherit', fontWeight: opt === q.correctAnswer ? 700 : 400 }}>
                                {opt} {opt === q.correctAnswer && '✓'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Question Form */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 16 }}>+ Add Question</h4>
                  <form onSubmit={handleSaveQuestion}>
                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <textarea className="form-control" rows={3} value={questionForm.text}
                        onChange={e => setQuestionForm({...questionForm, text: e.target.value})} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-control" value={questionForm.type}
                          onChange={e => setQuestionForm({...questionForm, type: e.target.value})}>
                          <option value="MCQ">Multiple Choice</option>
                          <option value="TRUE_FALSE">True / False</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Marks</label>
                        <input type="number" className="form-control" value={questionForm.marks}
                          onChange={e => setQuestionForm({...questionForm, marks: e.target.value})} required min="1" />
                      </div>
                    </div>

                    {questionForm.type === 'MCQ' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Options (At least 2 required)</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input className="form-control" placeholder="Option A" value={questionForm.option1} onChange={e => setQuestionForm({...questionForm, option1: e.target.value})} required />
                            <input className="form-control" placeholder="Option B" value={questionForm.option2} onChange={e => setQuestionForm({...questionForm, option2: e.target.value})} required />
                            <input className="form-control" placeholder="Option C (Optional)" value={questionForm.option3} onChange={e => setQuestionForm({...questionForm, option3: e.target.value})} />
                            <input className="form-control" placeholder="Option D (Optional)" value={questionForm.option4} onChange={e => setQuestionForm({...questionForm, option4: e.target.value})} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Correct Answer</label>
                          <select className="form-control" value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} required>
                            <option value="">-- Select Correct Option --</option>
                            {questionForm.option1 && <option value={questionForm.option1}>{questionForm.option1}</option>}
                            {questionForm.option2 && <option value={questionForm.option2}>{questionForm.option2}</option>}
                            {questionForm.option3 && <option value={questionForm.option3}>{questionForm.option3}</option>}
                            {questionForm.option4 && <option value={questionForm.option4}>{questionForm.option4}</option>}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Correct Answer</label>
                        <select className="form-control" value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} required>
                          <option value="">-- Select --</option>
                          <option value="TRUE">TRUE</option>
                          <option value="FALSE">FALSE</option>
                        </select>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>Save Question</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CourseCurriculumPage;
