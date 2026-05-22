// src/pages/admin/AdminUsersPage.js
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Badge, Loader, EmptyState } from '../../components/common/index';

import { authAPI } from '../../services/api';

const AdminUsersPage = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await authAPI.getAllUsers();
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSuspend = async (userId, enabled) => {
    if (!window.confirm(`${enabled ? 'Suspend' : 'Activate'} this user?`)) return;
    try {
      await authAPI.suspendUser(userId);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, enabled: !u.enabled } : u));
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await authAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <DashboardLayout>
      <PageHeader title="Manage Users" subtitle={`${users.length} total users on the platform`} />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" style={{ maxWidth: 280 }} placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="INSTRUCTOR">Instructors</option>
            <option value="ADMIN">Admins</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing <strong>{filtered.length}</strong> users
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div style={{ padding: 40 }}><Loader /></div>
         : filtered.length === 0 ? (
          <div style={{ padding: 40 }}>
            <EmptyState icon="👥" title="No users found" description="Try adjusting your search." />
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.role === 'INSTRUCTOR' ? '#7c3aed' : u.role === 'ADMIN' ? '#dc2626' : 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{u.fullName}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.role === 'INSTRUCTOR' ? 'info' : u.role === 'ADMIN' ? 'danger' : 'primary'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={u.enabled ? 'success' : 'danger'}>
                        {u.enabled ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.createdAt}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              className={`btn btn-sm ${u.enabled ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleSuspend(u.userId, u.enabled)}>
                              {u.enabled ? 'Suspend' : 'Activate'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.userId)}>
                              Delete
                            </button>
                          </>
                        )}
                        {u.role === 'ADMIN' && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
