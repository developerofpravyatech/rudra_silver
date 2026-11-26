import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  UserPlus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Power,
  RotateCw,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  User as UserIcon,
  Phone,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserListItem, AuthUser } from '../types';
import { fetchUserList, createUserApi, updateUserApi, toggleUserStatusApi, deleteUserApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserManagementPageProps {
  onBackToDashboard: () => void;
  currentUser?: AuthUser | null;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onBackToDashboard,
  currentUser: propUser,
}) => {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const isAdmin = currentUser?.role === 'ADMIN';

  // Data state
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Target user for actions
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [targetAction, setTargetAction] = useState<'activate' | 'deactivate' | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
  });
  const [addShowPw, setAddShowPw] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    email: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
    is_active: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load users from backend
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roleParam = roleFilter === 'ALL' ? undefined : roleFilter;
      const statusParam =
        statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE' ? true : false;

      const data = await fetchUserList({
        search: debouncedSearch.trim() || undefined,
        role: roleParam,
        is_active: statusParam,
        page,
        per_page: perPage,
      });

      setUsers(data.items);
      setTotalUsers(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page, perPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Handle Add User Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addForm.name.trim()) {
      setAddError('Full name is required.');
      return;
    }
    const cleanMobile = addForm.mobile.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setAddError('Valid 10-digit mobile number is required.');
      return;
    }
    if (!addForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      setAddError('Valid email address is required.');
      return;
    }
    if (!addForm.password || addForm.password.length < 6) {
      setAddError('Password must be at least 6 characters.');
      return;
    }

    setAddLoading(true);
    try {
      await createUserApi({
        name: addForm.name.trim(),
        mobile: cleanMobile,
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
      });

      setShowAddModal(false);
      setAddForm({ name: '', mobile: '', email: '', password: '', role: 'STAFF' });
      showNotification('New user created successfully.');
      loadUsers();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create user.');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: UserListItem) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      mobile: u.mobile || '',
      email: u.email || '',
      role: u.role,
      is_active: u.is_active,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);

    if (!editForm.name.trim()) {
      setEditError('Full name is required.');
      return;
    }

    const cleanMobile = editForm.mobile.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setEditError('Valid 10-digit mobile number is required.');
      return;
    }
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      setEditError('Valid email address is required.');
      return;
    }

    setEditLoading(true);
    try {
      await updateUserApi(selectedUser.id, {
        name: editForm.name.trim(),
        mobile: cleanMobile,
        email: editForm.email.trim(),
        role: selectedUser.id === currentUser?.id ? undefined : editForm.role,
        is_active: selectedUser.id === currentUser?.id ? undefined : editForm.is_active,
      });

      setShowEditModal(false);
      showNotification(`User '${editForm.name}' updated successfully.`);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Confirm Status Modal
  const openConfirmStatus = (u: UserListItem, action: 'activate' | 'deactivate') => {
    if (u.id === currentUser?.id && action === 'deactivate') {
      alert('Security Protection: You cannot deactivate your own administrative account.');
      return;
    }
    setSelectedUser(u);
    setTargetAction(action);
    setShowConfirmModal(true);
  };

  // Execute Status Toggle
  const handleConfirmStatusToggle = async () => {
    if (!selectedUser || !targetAction) return;
    setActionLoading(true);
    try {
      const newStatus = targetAction === 'activate';
      await toggleUserStatusApi(selectedUser.id, newStatus);
      setShowConfirmModal(false);
      showNotification(
        `User '${selectedUser.name}' has been ${newStatus ? 'activated' : 'deactivated'}.`
      );
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to change status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Guard removed: all authenticated users can access User Management

  const totalPages = Math.ceil(totalUsers / perPage) || 1;

  // Format mobile display: +91 98765 43210
  const formatMobile = (m: string) => {
    const raw = (m || '').replace(/\D/g, '');
    const clean = raw.length > 10 && raw.startsWith('91') ? raw.slice(2) : raw;
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return m || '—';
  };

  return (
    <div className="flex-1 p-5 max-w-[1700px] mx-auto w-full space-y-4 overflow-y-auto select-none">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="luxury-card rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Top Header - Matching Image Reference */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-[#171b26] dark:to-[#121620] px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                <span>User Management</span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Manage system users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] hover:brightness-105 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New User</span>
            </button>
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition flex items-center gap-1.5 cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Controls - Matching Image */}
        <div className="p-4 bg-slate-50/50 dark:bg-[#0c0f16]/60 border-b border-slate-200 dark:border-white/[0.06] flex flex-wrap gap-3 items-center justify-between text-xs">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile or email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141822] text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141822] text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141822] text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Per Page */}
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141822] text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadUsers}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141822] text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
              title="Refresh User List"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={loadUsers} className="underline text-xs ml-2 cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* Table Container - Exact Match with Reference Screenshot */}
          <div className="overflow-x-auto bg-white dark:bg-[#141822] rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0b0e14] text-slate-700 dark:text-slate-400 font-semibold text-[11px] border-b border-slate-200 dark:border-white/[0.08]">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-center">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">Loading user directory from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <UserIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No users found
                        </span>
                        <span className="text-xs text-slate-400">
                          {debouncedSearch
                            ? `No user found matching "${debouncedSearch}"`
                            : 'No records registered with current filters.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => {
                    const isSelf = u.id === currentUser?.id;
                    const createdFormatted = u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition ${
                          isSelf ? 'bg-amber-50/20 dark:bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        {/* # (User ID) */}
                        <td className="p-3 font-mono text-[11px] text-center text-slate-500 dark:text-slate-400">
                          {u.id}
                        </td>

                        {/* Name */}
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <span className="truncate max-w-[180px]">{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {formatMobile(u.mobile)}
                        </td>

                        {/* Email */}
                        <td className="p-3 text-slate-700 dark:text-slate-300 text-[11px]">
                          {u.email || '�'}
                        </td>

                        {/* Role */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-900 dark:bg-[#241e12] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                                : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border border-slate-200 dark:border-white/[0.1]'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Admin' : 'Staff'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.is_active
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {createdFormatted}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                            {/* View */}
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowViewModal(true);
                              }}
                              className="hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                              title="View User"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Toggle Active / Deactivate */}
                            <button
                              onClick={() =>
                                openConfirmStatus(u, u.is_active ? 'deactivate' : 'activate')
                              }
                              disabled={isSelf}
                              className={`transition cursor-pointer ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed'
                                  : u.is_active
                                  ? 'hover:text-rose-500'
                                  : 'hover:text-emerald-500'
                              }`}
                              title={
                                isSelf
                                  ? 'Cannot toggle self'
                                  : u.is_active
                                  ? 'Deactivate User'
                                  : 'Activate User'
                              }
                            >
                              {u.is_active ? (
                                <Power className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={async () => {
                                if (isSelf) return;
                                if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
                                try {
                                  await deleteUserApi(u.id);
                                  loadUsers();
                                } catch (err: any) {
                                  alert(err.message || 'Failed to delete user.');
                                }
                              }}
                              disabled={isSelf}
                              className={`transition cursor-pointer ${isSelf ? 'opacity-30 cursor-not-allowed' : 'hover:text-rose-600'}`}
                              title={isSelf ? 'Cannot delete self' : 'Delete User'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Matching Image */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing {users.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
              {Math.min(page * perPage, totalUsers)} of {totalUsers} users
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono text-xs rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: Add New User ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="luxury-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0d1017]">
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#131720] border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add New User Account
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3.5 text-xs">
              {addError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
                  {addError}
                </div>
              )}

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={addForm.mobile}
                  onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                  placeholder="98250 12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={addShowPw ? 'text' : 'password'}
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setAddShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 cursor-pointer"
                  >
                    {addShowPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  System Role *
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="STAFF">Staff (POS &amp; Inventory Access)</option>
                  <option value="ADMIN">Admin (Full Administrative Privileges)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] text-slate-950 font-bold hover:brightness-105 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit User ───────────────────────────────────────────── */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="luxury-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0d1017]">
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#131720] border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit User #{selectedUser.id}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
                  {editError}
                </div>
              )}

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  placeholder="98250 12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  System Role
                </label>
                <select
                  disabled={selectedUser.id === currentUser?.id}
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {selectedUser.id === currentUser?.id && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                    Security protection: You cannot alter your own administrative role.
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Account Status
                </label>
                <select
                  disabled={selectedUser.id === currentUser?.id}
                  value={editForm.is_active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.target.value === 'ACTIVE' })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#141822] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive (Suspended)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3c959] to-[#b38a1f] text-slate-950 font-bold hover:brightness-105 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View User Profile ───────────────────────────────────── */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="luxury-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0d1017]">
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#131720] border-b border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                User Details &bull; #{selectedUser.id}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 text-slate-950 font-bold text-lg flex items-center justify-center">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h4>
                  <p className="font-mono text-[11px] text-slate-500">{formatMobile(selectedUser.mobile)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Role</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedUser.role === 'ADMIN' ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  <span
                    className={`font-semibold mt-0.5 block ${
                      selectedUser.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Mobile</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {formatMobile(selectedUser.mobile)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Email</span>
                  <span className="text-slate-800 dark:text-slate-200 mt-0.5 block break-all">
                    {selectedUser.email || '�'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Registration Date</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString('en-GB')
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirm Activate / Deactivate ───────────────────────── */}
      {showConfirmModal && selectedUser && targetAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="luxury-card w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0d1017] p-6 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                targetAction === 'deactivate'
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {targetAction === 'deactivate' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {targetAction === 'deactivate' ? 'Deactivate User?' : 'Activate User?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to{' '}
                <strong className={targetAction === 'deactivate' ? 'text-rose-500' : 'text-emerald-500'}>
                  {targetAction}
                </strong>{' '}
                account for <strong>{selectedUser.name}</strong> ({formatMobile(selectedUser.mobile)})?
                {targetAction === 'deactivate' &&
                  ' The user will immediately be barred from signing in to the POS and ERP.'}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusToggle}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                  targetAction === 'deactivate'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>
                  Confirm {targetAction === 'deactivate' ? 'Deactivation' : 'Activation'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
