import React, { useState, useEffect } from 'react';
import { discussionAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Loader, EmptyState } from './index';
import './DiscussionBoard.css';

const DiscussionBoard = ({ courseId }) => {
  const { user, isInstructor } = useAuth();
  const [threads, setThreads] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newThread, setNewThread] = useState({ title: '', body: '' });
  const [error, setError] = useState(null);
  const [upvotedReplies, setUpvotedReplies] = useState(new Set());

  useEffect(() => {
    const fetchThreads = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const [threadRes, courseRes] = await Promise.all([
          discussionAPI.getThreadsByCourse(courseId),
          courseAPI.getById(courseId).catch(() => ({ data: { title: 'Course' } }))
        ]);
        setThreads(threadRes.data);
        setCourse(courseRes.data);
      } catch (err) {
        console.error("Error fetching threads:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, [courseId]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    try {
      const res = await discussionAPI.getReplies(thread.threadId);
      setReplies(res.data);
    } catch (err) {
      console.error("Error fetching replies:", err);
      setReplies([]);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim() || !user) return;
    try {
      const res = await discussionAPI.postReply({
        threadId: activeThread.threadId,
        authorId: user.userId,
        body: replyText
      });
      // Ensure authorName is present for immediate rendering
      const newReply = {
        ...res.data,
        authorName: res.data.authorName || user.fullName || 'You'
      };
      setReplies(prev => [...prev, newReply]);
      setReplyText('');
    } catch (err) {
      console.error("Failed to post reply:", err);
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.title.trim() || !newThread.body.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!user) {
      setError("You must be logged in to post.");
      return;
    }

    setError(null);
    try {
      const res = await discussionAPI.createThread({
        courseId: courseId,
        authorId: user.userId,
        title: newThread.title,
        body: newThread.body
      });

      setThreads(prev => [res.data, ...prev]);
      setNewThread({ title: '', body: '' });
      setShowCreate(false);
      openThread(res.data);
    } catch (err) {
      console.error("Failed to create thread:", err);
      setError(err.response?.data?.message || "Failed to create thread. Please try again.");
    }
  };

  const handleUpvote = async (replyId) => {
    if (upvotedReplies.has(replyId)) return;
    try {
      await discussionAPI.upvoteReply(replyId, user.userId);
      setReplies(prev => prev.map(r => r.replyId === replyId ? { ...r, upvotes: r.upvotes + 1 } : r));
      setUpvotedReplies(prev => new Set(prev).add(replyId));
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  // Delete thread (question)
  const handleDeleteThread = async (threadId) => {
    try {
      await discussionAPI.deleteThread(threadId);
      setThreads(prev => prev.filter(t => t.threadId !== threadId));
      if (activeThread?.threadId === threadId) setActiveThread(null);
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId) => {
    try {
      await discussionAPI.deleteReply(replyId);
      setReplies(prev => prev.filter(r => r.replyId !== replyId));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  return (
    <div className="discussion-board">
      <div className="db-header">
        <div>
          <h3 className="db-title">Discussions</h3>
          {course && <p className="text-muted small">Specific to: <strong>{course.title}</strong></p>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ New Question'}
        </button>
      </div>

      {showCreate && (
        <div className="card create-thread-card">
          <div className="card-body">
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-control" placeholder="Briefly describe your question" 
                value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea className="form-control" rows={3} placeholder="Provide more context..." 
                value={newThread.body} onChange={e => setNewThread(p => ({ ...p, body: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={handleCreateThread}>Post Discussion</button>
          </div>
        </div>
      )}

      <div className="db-container">
        <div className="db-sidebar">
          {loading ? <Loader /> : threads.length === 0 ? (
            <EmptyState title="No discussions yet" description="Start the conversation!" />
          ) : (
            threads.map((thread, index) => (
              <div key={thread.threadId || index} 
                className={`db-thread-item ${activeThread?.threadId === thread.threadId ? 'active' : ''}`}
                onClick={() => openThread(thread)}>
                <h4 className="db-thread-title">{thread.title || 'Untitled Discussion'}</h4>
                <div className="db-thread-meta">
                  <span>{thread.authorName || 'Instructor'}</span>
                  <span>{thread.repliesCount || 0} replies</span>
                  {(thread.authorId === user?.userId || isInstructor()) && (
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDeleteThread(thread.threadId); }}>Delete</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="db-content">
          {!activeThread ? (
            <div className="db-empty-state">
              <p>Select a discussion to join the conversation</p>
            </div>
          ) : (
            <div className="db-active-thread">
              <div className="db-thread-main card">
                <div className="card-body">
                  <h3 className="mb-2">{activeThread.title || 'Untitled Discussion'}</h3>
                  <p className="text-muted small mb-3">
                    Posted by <strong>{activeThread.authorName || 'Instructor'}</strong> on {activeThread.createdAt ? new Date(activeThread.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                  <p className="db-thread-body">{activeThread.body}</p>
                </div>
              </div>

               <div className="db-replies mt-4">
                <h4 className="mb-3">{replies.length} Responses</h4>
                {replies.map((reply, index) => (
                  <div key={reply.replyId || index} className={`reply-item card ${reply.isAccepted ? 'accepted' : ''}`}>
                    <div className="card-body">
                      <div className="reply-header">
                        <div className="reply-author-avatar">
                          {(reply.authorName || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="reply-author-name">{reply.authorName || 'Instructor'}</p>
                          {(reply.authorId === user?.userId || isInstructor()) && (
                            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDeleteReply(reply.replyId); }}>Delete</button>
                          )}
                          <p className="reply-date">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : 'Just now'}</p>
                        </div>
                      </div>
                      <p className="reply-body">{reply.body}</p>
                      <button className={`btn btn-sm ${upvotedReplies.has(reply.replyId) ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleUpvote(reply.replyId)}>
                        👍 {reply.upvotes || 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!activeThread.isClosed && (
                <div className="db-post-reply card mt-3">
                  <div className="card-body">
                    <textarea className="form-control" rows={3} placeholder="Write a response..." 
                      value={replyText} onChange={e => setReplyText(e.target.value)} />
                    <button className="btn btn-primary mt-2" onClick={handlePostReply} disabled={!replyText.trim()}>
                      Post Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionBoard;
