import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import React, { Suspense, useEffect } from 'react';

const Dashboard = React.lazy(() => import('./components/Dashboard'));

// Global Loading Screen Component
function GlobalLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="relative text-center">
        <div className="w-16 h-16 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading The Billman...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen />;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoadingScreen />;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppContent(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<GlobalLoadingScreen />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppBootstrap(): JSX.Element {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (isLoading) {
    return <GlobalLoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppBootstrap />
      </AuthProvider>
    </BrowserRouter>
  );
}