import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminLayout } from './components/layout/AdminLayout';
import { ClientList } from './pages/clients/ClientList';
import { ClientDetail } from './pages/clients/ClientDetail';
import { ClientCreate } from './pages/clients/ClientCreate';
import { ClientTheme } from './pages/clients/ClientTheme';
import { KnowledgeList } from './pages/knowledge/KnowledgeList';
import { KnowledgeForm } from './pages/knowledge/KnowledgeForm';
import { FAQList } from './pages/faqs/FAQList';
import { FAQForm } from './pages/faqs/FAQForm';
import { ChatList } from './pages/chats/ChatList';
import { ChatDetail } from './pages/chats/ChatDetail';
import { InquiryList } from './pages/inquiries/InquiryList';
import { InquiryDetail } from './pages/inquiries/InquiryDetail';
import { UnansweredList } from './pages/unanswered/UnansweredList';
import { UserList } from './pages/users/UserList';
import { UserForm } from './pages/users/UserForm';
import { RoleList } from './pages/roles/RoleList';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuditLogList } from './pages/auditLogs/AuditLogList';
import { NotificationList } from './pages/notifications/NotificationList';
import { WidgetGenerator } from './pages/widget/WidgetGenerator';
import { WidgetPreview } from './pages/widget/WidgetPreview';
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SystemLogsPage } from './pages/logs/SystemLogsPage';
import { ClientConfiguration } from './pages/clients/ClientConfiguration';
import { TranslationsPage } from './pages/translations/TranslationsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore();
  const role = user?.role || 'client';

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Super Admin Only Routes */}
                    <Route path="/clients" element={<RoleRoute allowedRoles={['admin']}><ClientList /></RoleRoute>} />
                    <Route path="/clients/new" element={<RoleRoute allowedRoles={['admin']}><ClientCreate /></RoleRoute>} />
                    <Route path="/clients/:id" element={<RoleRoute allowedRoles={['admin']}><ClientDetail /></RoleRoute>} />
                    <Route path="/clients/:id/edit" element={<RoleRoute allowedRoles={['admin']}><ClientCreate /></RoleRoute>} />
                    <Route path="/clients/:id/theme" element={<RoleRoute allowedRoles={['admin']}><ClientTheme /></RoleRoute>} />
                    <Route path="/clients/:id/config" element={<RoleRoute allowedRoles={['admin']}><ClientConfiguration /></RoleRoute>} />
                    <Route path="/users" element={<RoleRoute allowedRoles={['admin']}><UserList /></RoleRoute>} />
                    <Route path="/users/new" element={<RoleRoute allowedRoles={['admin']}><UserForm /></RoleRoute>} />
                    <Route path="/users/:id/edit" element={<RoleRoute allowedRoles={['admin']}><UserForm /></RoleRoute>} />
                    <Route path="/roles" element={<RoleRoute allowedRoles={['admin']}><RoleList /></RoleRoute>} />
                    <Route path="/translations" element={<RoleRoute allowedRoles={['admin']}><TranslationsPage /></RoleRoute>} />
                    <Route path="/settings" element={<RoleRoute allowedRoles={['admin']}><SettingsPage /></RoleRoute>} />
                    <Route path="/audit-logs" element={<RoleRoute allowedRoles={['admin']}><AuditLogList /></RoleRoute>} />
                    <Route path="/system-logs" element={<RoleRoute allowedRoles={['admin']}><SystemLogsPage /></RoleRoute>} />
                    <Route path="/reports" element={<RoleRoute allowedRoles={['admin']}><ReportsPage /></RoleRoute>} />

                    {/* Client Admin & Super Admin Routes */}
                    <Route path="/knowledge" element={<RoleRoute allowedRoles={['admin', 'client']}><KnowledgeList /></RoleRoute>} />
                    <Route path="/knowledge/new" element={<RoleRoute allowedRoles={['admin', 'client']}><KnowledgeForm /></RoleRoute>} />
                    <Route path="/knowledge/:id/edit" element={<RoleRoute allowedRoles={['admin', 'client']}><KnowledgeForm /></RoleRoute>} />
                    <Route path="/faqs" element={<RoleRoute allowedRoles={['admin', 'client']}><FAQList /></RoleRoute>} />
                    <Route path="/faqs/new" element={<RoleRoute allowedRoles={['admin', 'client']}><FAQForm /></RoleRoute>} />
                    <Route path="/faqs/:id/edit" element={<RoleRoute allowedRoles={['admin', 'client']}><FAQForm /></RoleRoute>} />
                    <Route path="/unanswered" element={<RoleRoute allowedRoles={['admin', 'client']}><UnansweredList /></RoleRoute>} />
                    <Route path="/analytics" element={<RoleRoute allowedRoles={['admin', 'client']}><AnalyticsDashboard /></RoleRoute>} />

                    {/* All Roles (Super Admin, Client Admin, Agent) */}
                    <Route path="/chats" element={<ChatList />} />
                    <Route path="/chats/:id" element={<ChatDetail />} />
                    <Route path="/inquiries" element={<InquiryList />} />
                    <Route path="/inquiries/:id" element={<InquiryDetail />} />
                    <Route path="/notifications" element={<NotificationList />} />
                    <Route path="/clients/:clientId/widget" element={<WidgetGenerator />} />
                    <Route path="/clients/:clientId/widget/preview" element={<WidgetPreview />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
