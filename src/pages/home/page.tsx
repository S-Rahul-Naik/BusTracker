import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/feature/Header';
import ChatbotEnhanced from '../../components/feature/ChatbotEnhanced';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Redirect based on user role
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Show login options
      navigate('/login/user');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20college%20campus%20with%20smart%20buses%20and%20digital%20infrastructure%2C%20clean%20university%20environment%20with%20connected%20technology%2C%20futuristic%20campus%20transit%20with%20real-time%20information%20displays%2C%20professional%20blue%20and%20white%20color%20scheme%2C%20minimalist%20design%2C%20students%20walking%20around%20campus&width=1920&height=1080&seq=hero-bg&orientation=landscape')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/70"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6" style={{ fontFamily: '"Pacifico", serif' }}>
              BusTracker
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8">
              Smart College Bus Tracking System
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              AI-powered real-time campus bus tracking and delay prediction. Get accurate arrival times, 
              receive instant notifications, and never miss your campus bus again.
            </p>
            
            {/* Authentication-aware CTAs */}
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <button 
                  onClick={handleGetStarted}
                  className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap text-sm sm:text-base"
                >
                  <i className="ri-dashboard-line mr-2"></i>
                  {user?.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
                </button>
                <button 
                  onClick={() => navigate('/routes')}
                  className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors border-2 border-white whitespace-nowrap text-sm sm:text-base"
                >
                  <i className="ri-route-line mr-2"></i>
                  Browse Routes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                  <button 
                    onClick={() => navigate('/login')}
                    className="bg-white text-blue-600 px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base"
                  >
                    <i className="ri-login-box-line mr-2"></i>
                    Sign In
                  </button>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Sign Up
                  </button>
                </div>
                <p className="text-blue-100 text-sm px-4">
                  Sign up now to start tracking your campus buses in real-time
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-based Info Section */}
      {!isAuthenticated && (
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">Choose Your Account Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Account */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-blue-600 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">Student Account</h3>
                </div>
                <p className="text-gray-600 mb-4">Perfect for students who want to track campus buses and plan their commute</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Track bus locations in real-time</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Get delay notifications</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>View route information</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Plan optimal campus routes</li>
                </ul>
                <button 
                  onClick={() => navigate('/login/user')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Student Login
                </button>
              </div>

              {/* Admin Account */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="ri-shield-line text-red-600 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">Administrator Account</h3>
                </div>
                <p className="text-gray-600 mb-4">For campus transit administrators to manage routes, schedules, and system operations</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Manage bus routes and schedules</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Monitor system performance</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>View analytics and reports</li>
                  <li className="flex items-center"><i className="ri-check-line text-green-500 mr-2"></i>Configure system settings</li>
                </ul>
                <button 
                  onClick={() => navigate('/login/admin')}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Smart Campus Transit Solutions</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our software-only system uses machine learning to predict delays and provide real-time updates for college campus transportation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-brain-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">AI Delay Prediction</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Machine learning algorithms analyze campus traffic patterns, weather, and historical data to predict bus delays with high accuracy
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 bg-green-50 rounded-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-notification-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Student Notifications</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Get instant alerts via push notifications or email when your campus bus is delayed or approaching your stop
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 bg-purple-50 rounded-xl md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-map-line text-white text-xl sm:text-2xl"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Live Campus Tracking</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track campus buses in real-time on interactive maps with simulated movement based on schedule data and current conditions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Routes Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Campus Bus Routes</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">Connecting all major campus locations for student convenience</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Route 42</h3>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Main Campus ↔ Engineering Building</p>
              <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                <div>8 buses • 15 min frequency</div>
                <div>12 stops • 7:00 AM - 10:00 PM</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-2 sm:mr-3"></div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Route 15</h3>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Dormitories ↔ Library Complex</p>
              <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                <div>6 buses • 20 min frequency</div>
                <div>8 stops • 6:30 AM - 11:30 PM</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full mr-2 sm:mr-3"></div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Route 88</h3>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Medical Center ↔ Sports Complex</p>
              <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                <div>4 buses • 25 min frequency</div>
                <div>10 stops • 8:00 AM - 9:00 PM</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full mr-2 sm:mr-3"></div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Route 23</h3>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Student Housing ↔ Academic Center</p>
              <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                <div>6 buses • 12 min frequency</div>
                <div>15 stops • 7:30 AM - 10:30 PM</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <button 
              onClick={() => isAuthenticated ? navigate('/routes') : navigate('/login/user')}
              className="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {isAuthenticated ? 'View All Routes' : 'Login to View Routes'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Campus Transit Performance</h2>
            <p className="text-lg sm:text-xl text-blue-100 px-4">Real-time metrics from our intelligent campus transit system</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">87.3%</div>
              <div className="text-blue-100 text-sm sm:text-base">Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">24</div>
              <div className="text-blue-100 text-sm sm:text-base">Active Campus Buses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">3,247</div>
              <div className="text-blue-100 text-sm sm:text-base">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">99.8%</div>
              <div className="text-blue-100 text-sm sm:text-base">System Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Ready to Transform Your Campus Commute?</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
            Join thousands of students who rely on our AI-powered predictions for their daily campus travel
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            </button>
            <button 
              onClick={() => isAuthenticated ? navigate('/phase4') : navigate('/login/user')}
              className="bg-gray-100 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {isAuthenticated ? 'Try AI Assistant' : 'Learn More'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ fontFamily: '"Pacifico", serif' }}>BusTracker</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Intelligent campus bus tracking and student notification system powered by machine learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Features</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
                <li>Real-time Tracking</li>
                <li>AI Predictions</li>
                <li>Smart Notifications</li>
                <li>Route Management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Students</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
                <li>Live Bus Locations</li>
                <li>Schedule Information</li>
                <li>Delay Notifications</li>
                <li>Route Planning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
                <li>support@campusbustrack.edu</li>
                <li>+1 (555) 123-4567</li>
                <li>24/7 Student Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 BusTracker. All rights reserved. | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">Powered by Readdy</a></p>
          </div>
        </div>
      </footer>

      {/* Readdy Agent Chatbot */}
      <ChatbotEnhanced />
    </div>
  );
}
