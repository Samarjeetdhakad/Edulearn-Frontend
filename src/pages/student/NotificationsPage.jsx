// src/pages/student/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, EmptyState, Loader, Badge } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import './NotificationsPage.css';

const TYPE_CONFIG = {
  ENROLLMENT:    { color: 'var(--primary)',  bg: 'var(--primary-light)' },
  CERTIFICATION: { color: 'var(--accent)',   bg: '#fef3c7' },
  QUIZ:          { color: '#7c3aed',          bg: '#ede9fe' },
  PAYMENT:       { color: 'var(--success)',  bg: '#d1fae5' },
  COURSE:        { color: 'var(--info)',     bg: '#e0f2fe' },
  APPROVAL:      { color: 'var(--warning)',  bg: '#fffbeb' },
};

const NotificationsPage = () => {
  const { user }  = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('ALL');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await notificationAPI.getByUser(user.userId);
        setNotifications(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead(user.userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read");
    }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch (err) {
      console.error("Failed to delete notification");
    }
  };

  const filtered = notifications.filter(n =>
    filter === 'ALL' ? true : filter === 'UNREAD' ? !n.isRead : n.type === filter
  );

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0)  return `${days}d ago`;
    if (hrs > 0)   return `${hrs}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <DashboardLayout>
      <PageHeader title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        action={unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            Mark All Read
          </button>
        )} />

      {/* Filter tabs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {['ALL', 'UNREAD', 'ENROLLMENT', 'PAYMENT'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="btn btn-sm"
              style={{ borderRadius: 0, borderBottom: filter === f ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', color: filter === f ? 'var(--primary)' : 'var(--text-muted)', fontWeight: filter === f ? 700 : 400, padding: '14px 14px', whiteSpace: 'nowrap' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40 }}><Loader /></div>
           : filtered.length === 0 ? (
            <div style={{ padding: 40 }}>
              <EmptyState title="No notifications" description="You're all caught up!" />
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const cfg = TYPE_CONFIG[notif.type] || { color: 'var(--text-muted)', bg: 'var(--bg)' };
              return (
                <div key={notif.notificationId}
                  className={`notif-row ${!notif.isRead ? 'unread' : ''}`}
                  style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  
                  {/* Unread indicator */}
                  {!notif.isRead && <div className="unread-bar" />}
                  
                  <div style={{ flex: 1, minWidth: 0, paddingLeft: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 14, marginBottom: 4 }}>
                        {notif.title}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                        {!notif.isRead && <Badge variant="primary">New</Badge>}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                  </div>

                  <div className="notif-actions">
                    {!notif.isRead && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markAsRead(notif.notificationId)} title="Mark as read">Read</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteNotif(notif.notificationId)} title="Delete"
                      style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
