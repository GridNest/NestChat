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
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuditLogList } from './pages/auditLogs/AuditLogList';
import { NotificationList } from './pages/notifications/NotificationList';

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
                    <Route path="/clients" element={<ClientList />} />
                    <Route path="/clients/new" element={<ClientCreate />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/clients/:id/edit" element={<ClientCreate />} />
                    <Route path="/clients/:id/theme" element={<ClientTheme />} />
                    <Route path="/knowledge" element={<KnowledgeList />} />
                    <Route path="/knowledge/new" element={<KnowledgeForm />} />
                    <Route path="/knowledge/:id/edit" element={<KnowledgeForm />} />
                    <Route path="/faqs" element={<FAQList />} />
                    <Route path="/faqs/new" element={<FAQForm />} />
                    <Route path="/faqs/:id/edit" element={<FAQForm />} />
                    <Route path="/chats" element={<ChatList />} />
                    <Route path="/chats/:id" element={<ChatDetail />} />
                    <Route path="/inquiries" element={<InquiryList />} />
                    <Route path="/inquiries/:id" element={<InquiryDetail />} />
                    <Route path="/unanswered" element={<UnansweredList />} />
                    <Route path="/users" element={<UserList />} />
                    <Route path="/users/new" element={<UserForm />} />
                    <Route path="/users/:id/edit" element={<UserForm />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/audit-logs" element={<AuditLogList />} />
                    <Route path="/notifications" element={<NotificationList />} />
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
