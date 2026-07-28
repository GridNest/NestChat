import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

export function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'undefined');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    clientId: 'none',
  });

  useEffect(() => {
    fetchClients();
    if (isEdit) {
      fetchUser();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response: any = await adminApi.getClients({ limit: '100' });
      const resData = response?.data || response;
      setClients(resData?.clients || resData?.data?.clients || []);
    } catch {
      console.error('Failed to fetch clients');
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUserById(id!);
      const userData = response?.data || response;
      if (userData) {
        const clientVal = typeof userData.clientId === 'object' ? userData.clientId?._id : userData.clientId;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          role: userData.role || 'client',
          clientId: clientVal || 'none',
        });
      }
    } catch (error) {
      addToast('error', 'Failed to fetch user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: Record<string, any> = { ...formData };
      if (!data.password && isEdit) {
        delete data.password;
      }
      if (data.clientId === 'none') {
        delete data.clientId;
      }

      if (isEdit) {
        await adminApi.updateUser(id!, data);
        addToast('success', 'User updated successfully');
      } else {
        await adminApi.createUser(data);
        addToast('success', 'User created successfully');
      }
      navigate('/users');
    } catch (error: any) {
      addToast('error', error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 text-sm">Loading user data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {isEdit ? 'Edit User' : 'New User'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {isEdit ? 'Update user profile, assigned role and client permissions' : 'Create a new user account and assign to a client'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Password {isEdit ? '(leave blank to keep current)' : '*'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEdit}
              className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
              placeholder={isEdit ? '••••••••' : 'Enter password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 text-sm"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
          >
            <option value="admin">Super Admin (Full System Access)</option>
            <option value="client">Client Admin (Manages Client Data & Config)</option>
            <option value="agent">Agent (Access to Chats & Inquiries Only)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Assigned Client *</label>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
          >
            <option value="none">System / All Clients (Super Admin)</option>
            {clients.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.companyName || c.name} (ID: {c.clientId})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] shadow-sm"
          >
            {saving ? 'Saving...' : (isEdit ? 'Save User' : 'Create User')}
          </button>
        </div>
      </form>
    </div>
  );
}
