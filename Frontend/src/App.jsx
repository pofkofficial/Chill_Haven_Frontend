import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import AdminLogin from './pages/AdminLogin';

import AdminDashboard from './pages/AdminDashboard';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAdminAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventDetail />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Dashboard with Nested Routes */}
          <Route
            path="/admin/dashboard/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;