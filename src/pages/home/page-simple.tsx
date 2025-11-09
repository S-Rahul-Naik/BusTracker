import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">BusTracker Test</h1>
      <p className="text-lg text-gray-700 mb-8">
        If you can see this, the basic React routing is working!
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
        >
          Go to Dashboard
        </button>
        
        <button 
          onClick={() => navigate('/phase4')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Go to Phase 4 AI
        </button>
      </div>
    </div>
  );
}