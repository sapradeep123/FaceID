import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminLayout from './components/layout/AdminLayout';
import './App.css';
import { useApplyBranding } from './lib/branding';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const userEmail = localStorage.getItem('user_email');
  const isAdmin = userEmail?.includes('admin') || userEmail?.includes('@admin.');
  return token && isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  // Apply favicon and title globally across all routes (login, admin, dashboard)
  useApplyBranding();
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout 
                  onLogout={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_email');
                    window.location.href = '/login';
                  }}
                  userName={localStorage.getItem('user_name') || 'Admin'}
                  userEmail={localStorage.getItem('user_email') || 'admin@example.com'}
                />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
