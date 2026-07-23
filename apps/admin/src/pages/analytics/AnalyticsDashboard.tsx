import React, { useState, useEffect } from 'react';
import { StatsCard } from '../../components/ui/StatsCard';
import { adminApi } from '../../services/api';

interface DashboardStats {
  summary: {
    totalVisitors: number;
    totalChats: number;
    activeConversations: number;
    totalLeads: number;
    conversionRate: number;
    avgResponseTime: number;
    avgConversationDuration: number;
    totalCompletedInquiries: number;
    totalAbandonedInquiries: number;
  };
  dailyStats: Array<{
    date: string;
    metrics: {
      visitors: number;
      chats: number;
      leads: number;
    };
  }>;
  languageDistribution: Array<{
    language: string;
    count: number;
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalyticsDashboard(period);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Visitors"
          value={stats.summary.totalVisitors}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <StatsCard
          title="Total Chats"
          value={stats.summary.totalChats}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
        <StatsCard
          title="Total Leads"
          value={stats.summary.totalLeads}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.summary.conversionRate.toFixed(2)}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Daily Trend</h2>
          <div className="space-y-2">
            {stats.dailyStats.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-600">Visitors: {day.metrics.visitors}</span>
                  <span className="text-green-600">Chats: {day.metrics.chats}</span>
                  <span className="text-purple-600">Leads: {day.metrics.leads}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Language Distribution</h2>
          <div className="space-y-2">
            {stats.languageDistribution.map((lang, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{lang.language}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(lang.count / stats.summary.totalChats) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{lang.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Top Questions</h2>
        <div className="space-y-2">
          {stats.topQuestions.length === 0 ? (
            <p className="text-gray-500">No questions data available</p>
          ) : (
            stats.topQuestions.map((q, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-800">{q.question}</span>
                <span className="text-sm font-medium text-blue-600">{q.count} times</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Conversations</h3>
          <p className="text-2xl font-bold text-green-600">{stats.summary.activeConversations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Completed Inquiries</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.summary.totalCompletedInquiries}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Abandoned Inquiries</h3>
          <p className="text-2xl font-bold text-red-600">{stats.summary.totalAbandonedInquiries}</p>
        </div>
      </div>
    </div>
  );
}
