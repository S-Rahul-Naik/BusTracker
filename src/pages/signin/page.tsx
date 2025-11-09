
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setForgotPasswordSent(true);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // Simulate social login
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex items-center justify-center p-4 py-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <i className="ri-bus-line text-white text-xl sm:text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: '"Pacifico", serif' }}>
              Welcome Back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Sign in to your BusTracker account
            </p>
          </div>

          {/* Sign In Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            {!showForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium text-left sm:text-right"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            ) : (
              /* Forgot Password Form */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Reset Password</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {!forgotPasswordSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Email Address
                      </label>
                      <input
                        id="forgot-email"
                        name="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          'Send Reset Link'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotEmail('');
                          setForgotPasswordSent(false);
                        }}
                        className="flex-1 sm:flex-none bg-gray-100 text-gray-700 py-2 sm:py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <i className="ri-check-line text-green-600 text-xl sm:text-2xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h4>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        We've sent a password reset link to <strong>{forgotEmail}</strong>
                      </p>
                      <button
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotEmail('');
                          setForgotPasswordSent(false);
                        }}
                        className="text-blue-600 hover:text-blue-500 font-medium text-sm sm:text-base"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showForgotPassword && (
              <>
                {/* Divider */}
                <div className="mt-6 sm:mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                </div>

                {/* Social Login */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSocialLogin('Google')}
                    className="w-full inline-flex justify-center py-2 sm:py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-google-fill text-red-500 text-lg sm:text-xl mr-2"></i>
                    <span className="text-sm sm:text-base">Google</span>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('Microsoft')}
                    className="w-full inline-flex justify-center py-2 sm:py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-microsoft-fill text-blue-600 text-lg sm:text-xl mr-2"></i>
                    <span className="text-sm sm:text-base">Microsoft</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sign Up Link */}
          {!showForgotPassword && (
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={() => navigate('/signup')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
