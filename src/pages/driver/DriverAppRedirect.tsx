export default function DriverAppRedirect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Download the Driver App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The web version for drivers has been discontinued. Please download the native mobile app for background GPS tracking.
          </p>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              🚀 Why Native App?
            </h2>
            <ul className="text-left text-blue-800 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Background GPS Tracking</strong> - Works even when app is closed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Better Battery Life</strong> - Optimized for mobile devices</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>More Reliable</strong> - Dedicated foreground service</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Real GPS</strong> - Uses phone's GPS chip, not WiFi location</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📥 How to Get the App</h3>
              <ol className="text-left text-gray-700 space-y-2 list-decimal list-inside">
                <li>Download the APK file from your admin</li>
                <li>Install on your Android phone</li>
                <li>Login with your driver credentials</li>
                <li>Grant location permissions (Allow all the time)</li>
                <li>Start tracking your trips!</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> The native app is required for proper GPS tracking. 
                Web browsers cannot track location in the background.
              </p>
            </div>

            <a
              href="/"
              className="inline-block mt-6 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
