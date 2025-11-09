import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { Bus, User, Shield, Key, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  role: UserRole;
}

export default function LoginPage({ role }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Redirect based on role after login success
        // The login function will set the user in context
        // We'll let the UnifiedLoginPage handle redirection
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${isAdmin ? 'bg-red-100' : 'bg-blue-100'}`}>
              {isAdmin ? (
                <Shield className={`h-8 w-8 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
              ) : (
                <User className={`h-8 w-8 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
              )}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Admin Login' : 'User Login'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isAdmin 
              ? 'Access administrative dashboard to manage routes and schedules'
              : 'Sign in to track buses and view route information'
            }
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm 
                    placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent 
              text-sm font-medium rounded-md text-white transition-colors
              ${isAdmin 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <Key className="h-5 w-5 text-white opacity-75" />
            </span>
            {loading ? 'Signing in...' : `Sign in as ${isAdmin ? 'Admin' : 'User'}`}
          </button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className={`font-medium ${isAdmin ? 'text-red-600 hover:text-red-500' : 'text-blue-600 hover:text-blue-500'}`}
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>

        {/* Bus Track Branding */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Bus className="h-4 w-4" />
            <span className="text-sm">BusTrack Transit System</span>
          </div>
        </div>
      </div>
    </div>
  );
}