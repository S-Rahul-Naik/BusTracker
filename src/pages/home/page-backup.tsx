import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-dashboard-line mr-2"></i>
                View Live Dashboard
              </button>
              <button 
                onClick={() => navigate('/routes')}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors border-2 border-white whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-route-line mr-2"></i>
                Browse Routes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}