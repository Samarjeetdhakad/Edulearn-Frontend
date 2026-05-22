// src/pages/CoursesPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CourseCard from '../components/common/CourseCard';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Loader, EmptyState } from '../components/common/index';
import { useAuth } from '../context/AuthContext';
import { courseAPI, enrollmentAPI } from '../services/api';
import './CoursesPage.css';

const LEVELS      = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const CATEGORIES  = ['All', 'Backend', 'Frontend', 'Data Science', 'DevOps', 'Database', 'Computer Science'];
const LANGUAGES   = ['All', 'English', 'Hindi'];
const SORT_OPTIONS= [
  { value: 'popular',  label: 'Most Popular' },
  { value: 'newest',   label: 'Newest First' },
  { value: 'price-asc',label: 'Price: Low to High' },
  { value: 'price-desc',label: 'Price: High to Low' },
];

const CoursesPage = () => {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(params.get('search') || '');
  const [category, setCategory]   = useState(params.get('category') || 'All');
  const [level, setLevel]         = useState('All');
  const [language, setLanguage]   = useState('All');
  const { user }                  = useAuth();
  const [sortBy, setSortBy]       = useState('popular');
  const [maxPrice, setMaxPrice]   = useState(5000);
  const [page, setPage]           = useState(1);
  const PER_PAGE = 6;

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        let res;
        if (search) {
          res = await courseAPI.search(search);
        } else if (category !== 'All') {
          res = await courseAPI.getByCategory(category);
        } else {
          res = await courseAPI.getAll();
        }
        setCourses(res.data);

        if (user) {
          const enrollRes = await enrollmentAPI.getByStudent(user.userId);
          setEnrollments((enrollRes.data || []).map(e => e.courseId));
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, category, user]);

  useEffect(() => {
    let result = courses.filter(c => c.isPublished);
    if (search)               result = result.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All')   result = result.filter(c => c.category === category);
    if (level !== 'All')      result = result.filter(c => c.level === level);
    if (language !== 'All')   result = result.filter(c => c.language === language);
    result = result.filter(c => c.price <= maxPrice);

    switch (sortBy) {
      case 'newest':    result.sort((a,b) => b.courseId - a.courseId); break;
      case 'price-asc': result.sort((a,b) => a.price - b.price); break;
      case 'price-desc':result.sort((a,b) => b.price - a.price); break;
      default:          result.sort((a,b) => b.totalEnrollments - a.totalEnrollments);
    }
    setFiltered(result);
    setPage(1);
  }, [courses, search, category, level, language, sortBy, maxPrice]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const clearFilters = () => { setSearch(''); setCategory('All'); setLevel('All'); setLanguage('All'); setSortBy('popular'); setMaxPrice(5000); };

  const content = (
    <div className="courses-page">
      {/* Sidebar filters */}
      <aside className="filters-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Filters</h3>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear All</button>
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            {CATEGORIES.map(cat => (
              <label key={cat} className="filter-option">
                <input type="radio" name="category" checked={category === cat} onChange={() => setCategory(cat)} />
                <span>{cat}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <label className="filter-label">Level</label>
            {LEVELS.map(l => (
              <label key={l} className="filter-option">
                <input type="radio" name="level" checked={level === l} onChange={() => setLevel(l)} />
                <span>{l}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <label className="filter-label">Language</label>
            {LANGUAGES.map(lang => (
              <label key={lang} className="filter-option">
                <input type="radio" name="language" checked={language === lang} onChange={() => setLanguage(lang)} />
                <span>{lang}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <label className="filter-label">Max Price: ₹{maxPrice.toLocaleString()}</label>
            <input type="range" min={0} max={5000} step={100} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>₹0</span><span>₹5,000</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="courses-main">
          {/* Search + Sort bar */}
          <div className="courses-topbar">
            <div className="search-wrap">
              <span className="search-ico">🔍</span>
              <input type="text" placeholder="Search courses..." value={search}
                onChange={e => setSearch(e.target.value)} className="form-control"
                style={{ paddingLeft: 40 }} />
            </div>
            <select className="form-control" style={{ width: 200 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Result count */}
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Showing <strong>{filtered.length}</strong> course{filtered.length !== 1 ? 's' : ''}
            {search && <> for "<strong>{search}</strong>"</>}
          </p>

          {loading ? (
            <Loader text="Loading courses..." />
          ) : paginated.length === 0 ? (
            <EmptyState icon="🔍" title="No courses found" description="Try adjusting your search or filters."
              action={<button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>} />
          ) : (
            <>
              <div className="courses-grid">
                {paginated.map(course => (
                  <CourseCard 
                    key={course.courseId} 
                    course={course} 
                    enrolled={enrollments.includes(course.courseId)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
  );

  if (user) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return (
    <div>
      <Navbar />
      {content}
      <Footer />
    </div>
  );
};

export default CoursesPage;
