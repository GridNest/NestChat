import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  clientId?: any;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response: any = await adminApi.getUsers({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter,
      });
      const resData = response?.data || response;
      const rawList = resData?.users || resData?.data?.users || (Array.isArray(resData) ? resData : []);
      const mapped = (Array.isArray(rawList) ? rawList : []).map((u: any) => ({
        ...u,
        id: u.id || u._id,
      }));
      setUsers(mapped);
      setTotal(resData?.total || resData?.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteUser(deleteId);
      addToast('success', 'User deleted successfully');
      fetchUsers();
    } catch (error) {
      addToast('error', 'Failed to delete user');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (item: User) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
          item.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          item.role === 'client' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {item.role === 'admin' ? 'Super Admin' : item.role === 'client' ? 'Client Admin' : item.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: User) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: User) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: User) => {
        const targetId = item.id || item._id;
        return (
          <div className="flex items-center gap-3 min-h-[36px]">
            <button
              onClick={() => setViewUser(item)}
              className="text-gray-600 hover:text-gray-900 font-medium text-xs sm:text-sm p-1"
            >
              View
            </button>
            <button
              onClick={() => navigate(`/users/${targetId}/edit`)}
              className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm p-1"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteId(targetId || null)}
              className="text-red-600 hover:text-red-800 font-medium text-xs sm:text-sm p-1"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage user access and assigned clients</p>
        </div>
        <Link
          to="/users/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
        >
          <option value="">All Roles</option>
          <option value="admin">Super Admin</option>
          <option value="client">Client Admin</option>
          <option value="agent">Agent</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />

      {total > limit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs sm:text-sm text-gray-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Name</span>
                <span className="font-semibold text-gray-900">{viewUser.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Email</span>
                <span className="font-semibold text-gray-900">{viewUser.email}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Role</span>
                <span className="font-semibold text-gray-900 capitalize">{viewUser.role}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Assigned Client</span>
                <span className="font-semibold text-blue-700">
                  {typeof viewUser.clientId === 'object' ? (viewUser.clientId?.companyName || viewUser.clientId?.name) : (viewUser.clientId || 'System / All Clients')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Created Date</span>
                <span className="font-semibold text-gray-900">{new Date(viewUser.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

