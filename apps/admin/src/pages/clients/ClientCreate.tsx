import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export function ClientCreate() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    website: '',
    websiteType: 'corporate',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    botName: 'Assistant',
    defaultLanguage: 'en',
    timezone: 'Asia/Kolkata',
    status: 'active',
  });

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      setFetching(true);
      const data = await adminApi.getClient(id!);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        companyName: data.companyName || '',
        phone: data.phone || '',
        website: data.website || '',
        websiteType: data.websiteType || 'corporate',
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#1E40AF',
        botName: data.botName || 'Assistant',
        defaultLanguage: data.defaultLanguage || 'en',
        timezone: data.timezone || 'Asia/Kolkata',
        status: data.status || 'active',
      });
    } catch (error) {
      addToast('error', 'Failed to load client details');
      navigate('/clients');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await adminApi.updateClient(id, formData);
        addToast('success', 'Client updated successfully');
      } else {
        await adminApi.createClient(formData);
        addToast('success', 'Client created successfully');
      }
      navigate('/clients');
    } catch (error: any) {
      console.error('Failed to save client:', error);
      addToast('error', error.response?.data?.message || (id ? 'Failed to update client' : 'Failed to create client'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (fetching) {
    return <div className="text-center py-12 text-gray-500 text-sm">Loading client data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {id ? 'Edit Client' : 'Create New Client'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {id ? 'Update client details and widget preferences' : 'Configure client company details and initial widget defaults'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Website Type *</label>
          <select
            name="websiteType"
            value={formData.websiteType}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
          >
            <option value="corporate">Corporate</option>
            <option value="restaurant">Restaurant</option>
            <option value="hotel">Hotel</option>
            <option value="school">School</option>
            <option value="hospital">Hospital</option>
            <option value="real_estate">Real Estate</option>
            <option value="portfolio">Portfolio</option>
            <option value="agency">Agency</option>
            <option value="landing_page">Landing Page</option>
            <option value="ecommerce">E-commerce</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-12 h-[44px] rounded-xl cursor-pointer border border-gray-300 p-1 bg-white"
              />
              <input
                type="text"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="w-12 h-[44px] rounded-xl cursor-pointer border border-gray-300 p-1 bg-white"
              />
              <input
                type="text"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Bot Name</label>
            <input
              type="text"
              name="botName"
              value={formData.botName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Default Language</label>
            <select
              name="defaultLanguage"
              value={formData.defaultLanguage}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors shadow-sm"
          >
            {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Save Changes' : 'Create Client')}
          </button>
        </div>
      </form>
    </div>
  );
}

