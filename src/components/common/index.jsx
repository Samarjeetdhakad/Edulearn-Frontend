// src/components/common/index.jsx
// All reusable components exported from one place

import React from 'react';

// ── Loader ────────────────────────────────────────────────────
export const Loader = ({ text = 'Loading...' }) => (
  <div className="loader-center" style={{ flexDirection: 'column', gap: 12 }}>
    <div className="spinner" />
    {text && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{text}</p>}
  </div>
);

// ── PageLoader ────────────────────────────────────────────────
export const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
    <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
    <p style={{ color: 'var(--text-muted)' }}>Loading page...</p>
  </div>
);

// ── Empty State ───────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {title       && <h3>{title}</h3>}
    {description && <p>{description}</p>}
    {action}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, sub, color = 'var(--primary)', trend }) => (
  <div className="card stat-card" style={{ '--accent-color': color }}>
    <div className="card-body" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{label}</p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>{value}</h2>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
          {trend && (
            <p style={{ fontSize: 12, marginTop: 6, color: trend.positive ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {trend.positive ? '▲' : '▼'} {trend.text}
            </p>
          )}
        </div>
        {icon && (
          <div style={{ width: 50, height: 50, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'primary' }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

// ── Progress Bar ──────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, showLabel = true, color }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Progress</span>
          <span style={{ fontWeight: 700, color: pct === 100 ? 'var(--success)' : 'var(--primary)' }}>{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color || (pct === 100 ? 'var(--success)' : 'var(--primary)') }} />
      </div>
    </div>
  );
};

// ── Rating Stars ──────────────────────────────────────────────
export const Stars = ({ rating, count }) => (
  <span>
    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
      {rating}{count !== undefined && ` (${count.toLocaleString()})`}
    </span>
  </span>
);

// ── Alert ─────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children, onClose }) => (
  <div className={`alert alert-${type}`}>
    <span style={{ flex: 1 }}>{children}</span>
    {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: size === 'lg' ? 720 : size === 'sm' ? 380 : 540 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Form Input ────────────────────────────────────────────────
export const FormInput = ({ label, error, hint, required, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>}
    <input className={`form-control ${error ? 'error' : ''}`} {...props} />
    {error && <p className="form-error">{error}</p>}
    {hint  && <p className="form-hint">{hint}</p>}
  </div>
);

// ── Form Select ───────────────────────────────────────────────
export const FormSelect = ({ label, error, required, children, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>}
    <select className={`form-control ${error ? 'error' : ''}`} {...props}>{children}</select>
    {error && <p className="form-error">{error}</p>}
  </div>
);

// ── Form Textarea ─────────────────────────────────────────────
export const FormTextarea = ({ label, error, required, rows = 4, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>}
    <textarea className={`form-control ${error ? 'error' : ''}`} rows={rows} style={{ resize: 'vertical' }} {...props} />
    {error && <p className="form-error">{error}</p>}
  </div>
);

// ── Page Header ───────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 15 }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ── Search Bar ────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...', onSearch }) => (
  <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
    <input
      type="text" value={value} onChange={onChange} placeholder={placeholder}
      className="form-control"
      onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
    />
    {onSearch && <button className="btn btn-primary" onClick={onSearch}>Search</button>}
  </div>
);

// ── Confirm Modal ─────────────────────────────────────────────
export const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading }) => (
  <Modal open={open} onClose={onClose} title={title}
    footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </button>
      </>
    }>
    <p style={{ color: 'var(--text-muted)' }}>{message}</p>
  </Modal>
);

// ── Status Badge helper ───────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE:      { variant: 'success',  label: 'Active' },
    COMPLETED:   { variant: 'primary',  label: 'Completed' },
    CANCELLED:   { variant: 'danger',   label: 'Cancelled' },
    PUBLISHED:   { variant: 'success',  label: 'Published' },
    UNPUBLISHED: { variant: 'gray',     label: 'Draft' },
    APPROVED:    { variant: 'success',  label: 'Approved' },
    PENDING:     { variant: 'warning',  label: 'Pending' },
    REJECTED:    { variant: 'danger',   label: 'Rejected' },
    SUCCESS:     { variant: 'success',  label: 'Success' },
    FAILED:      { variant: 'danger',   label: 'Failed' },
    REFUNDED:    { variant: 'info',     label: 'Refunded' },
    FREE:        { variant: 'gray',     label: 'Free' },
    MONTHLY:     { variant: 'primary',  label: 'Monthly' },
    ANNUAL:      { variant: 'info',     label: 'Annual' },
  };
  const cfg = map[status] || { variant: 'gray', label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

import DiscussionBoard from './DiscussionBoard';

export {
  DiscussionBoard
};