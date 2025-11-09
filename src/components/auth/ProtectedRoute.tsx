import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to={requiredRole === 'admin' ? '/login/admin' : '/login/user'} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. 
              {requiredRole === 'admin' 
                ? ' This page requires administrator privileges.'
                : ' This page is restricted to regular users.'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <Navigate 
                to={user?.role === 'admin' ? '/admin' : '/dashboard'} 
                replace 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user">
      {children}
    </ProtectedRoute>
  );
}

// Component for pages that need any authenticated user
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      {children}
    </ProtectedRoute>
  );
}