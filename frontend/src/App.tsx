import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import EventListPage from './pages/EventListPage';
import EventDetailPage from './pages/EventDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import AdminEventListPage from './pages/admin/AdminEventListPage';
import AdminEventFormPage from './pages/admin/AdminEventFormPage';
import AdminEventStatsPage from './pages/admin/AdminEventStatsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.role);
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><EventListPage /></RequireAuth>} />
      <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
      <Route path="/my-applications" element={<RequireAuth><MyApplicationsPage /></RequireAuth>} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminEventListPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminEventFormPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/events/:id/edit"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminEventFormPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/events/:id/stats"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminEventStatsPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
