// src/pages/instructor/CreateCoursePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Alert, Loader } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';
import './CreateCoursePage.css';

const CATEGORIES = ['Backend','Frontend','Data Science','DevOps','Database','Computer Science','Mobile','Cloud'];
const LEVELS     = ['BEGINNER','INTERMEDIATE','ADVANCED'];
const LANGUAGES  = ['English','Hindi','Telugu','Tamil','Marathi'];

const CreateCoursePage = () => {
  const { user }  = useAuth();
  const { courseId } = useParams();
  const navigate  = useNavigate();
  const isEdit    = !!courseId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [alert, setAlert]   = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', level: 'BEGINNER',
    price: '', language: 'English', thumbnailUrl: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchCourse = async () => {
        try {
          const res = await courseAPI.getById(courseId);
          const c = res.data;
          setForm({
            title: c.title, description: c.description, category: c.category,
            level: c.level, price: c.price, language: c.language, thumbnailUrl: c.thumbnailUrl || ''
          });
        } catch (err) {
          setAlert({ type: 'error', message: 'Failed to load course details.' });
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category)           e.category    = 'Category is required';
    if (form.price === '')        e.price       = 'Price is required';
    if (Number(form.price) < 0)   e.price       = 'Price cannot be negative';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await courseAPI.update(courseId, { ...form, price: Number(form.price), instructorName: user.fullName });
        setAlert({ type: 'success', message: 'Course updated successfully!' });
      } else {
        await courseAPI.create({ ...form, price: Number(form.price), instructorName: user.fullName });
        setAlert({ type: 'success', message: 'Course created! Now add lessons and publish.' });
      }
      setTimeout(() => navigate('/instructor/courses'), 1500);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Action failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><Loader text="Loading course..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader 
        title={isEdit ? "Edit Course" : "Create New Course"} 
        subtitle={isEdit ? `Update details for "${form.title}"` : "Fill in the details to create your course"} 
      />

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <div className="create-course-layout">
        <form onSubmit={handleSubmit} className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Course Information</h3>

            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input name="title" className={`form-control ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Complete Java Spring Boot Microservices"
                value={form.title} onChange={handleChange} />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className={`form-control ${errors.description ? 'error' : ''}`}
                rows={5} placeholder="What will students learn? What makes this course unique?"
                value={form.description} onChange={handleChange} />
              {errors.description && <p className="form-error">{errors.description}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className={`form-control ${errors.category ? 'error' : ''}`}
                  value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="form-error">{errors.category}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Level *</label>
                <select name="level" className="form-control" value={form.level} onChange={handleChange}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input name="price" type="number" min="0" className={`form-control ${errors.price ? 'error' : ''}`}
                  placeholder="0 for free" value={form.price} onChange={handleChange} />
                {errors.price && <p className="form-error">{errors.price}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Language *</label>
                <select name="language" className="form-control" value={form.language} onChange={handleChange}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Thumbnail URL</label>
              <input name="thumbnailUrl" className="form-control"
                placeholder="https://example.com/thumbnail.jpg"
                value={form.thumbnailUrl} onChange={handleChange} />
              <p className="form-hint">Paste an image URL or leave blank for auto-generated thumbnail.</p>
              {form.thumbnailUrl.trim() && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={form.thumbnailUrl}
                    alt="Thumbnail preview"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    onLoad={e => { e.target.style.display = 'block'; e.target.nextSibling.style.display = 'none'; }}
                    style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                  />
                  <div style={{ display: 'none', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--danger-light, #fef2f2)', border: '1px solid var(--danger, #ef4444)', borderRadius: 8, fontSize: 13, color: 'var(--danger, #ef4444)' }}>
                    ⚠️ Could not load image. Please check the URL.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Course')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/instructor/courses')}>
                Cancel
              </button>
            </div>
          </div>
        </form>

        {/* Tips panel */}
        <div className="tips-panel">
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💡 Tips for a great course</h4>
              {[
                ['📝', 'Write a clear, descriptive title that includes the technology.'],
                ['📖', 'Describe what students will build or achieve by the end.'],
                ['💰', 'Set a competitive price — check similar courses on EduLearn.'],
                ['🖼', 'Use a high-quality thumbnail (16:9 ratio, 1280×720px recommended).'],
                ['🎯', 'Choose the correct level so the right students find your course.'],
              ].map(([icon, tip]) => (
                <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-body">
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📋 After {isEdit ? 'Updating' : 'Creating'}:</h4>
              {['Add lessons with videos', 'Upload supplementary resources', 'Create quizzes', 'Submit for admin approval', 'Publish to students'].map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCoursePage;
