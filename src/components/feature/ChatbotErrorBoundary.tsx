import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ChatbotErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to trigger the error UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Readdy Agent Error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to error monitoring service if available
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col h-96 max-w-md mx-auto bg-white rounded-lg shadow-lg border">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Readdy Agent Error
            </h3>
          </div>

          {/* Error Content */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-4">
              <MessageCircle className="w-16 h-16 mx-auto opacity-50" />
            </div>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Oops! Something went wrong
            </h4>
            
            <p className="text-gray-600 mb-4 text-sm">
              Readdy encountered an unexpected error. This might be due to:
            </p>
            
            <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
              <li>• Network connectivity issues</li>
              <li>• n8n service not running</li>
              <li>• Backend API not available</li>
              <li>• Browser compatibility issues</li>
            </ul>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Show Error Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-gray-50 rounded-b-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Need help? Check that all services are running:
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Backend (8000)
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  n8n (5678)
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Frontend (5173)
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ChatbotErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ChatbotErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error reporting
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Readdy Agent Error${context ? ` (${context})` : ''}:`, error);
    
    // Report to monitoring service
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${context || 'Unknown'}: ${error.toString()}`,
        fatal: false
      });
    }
  };

  return { handleError };
};

export default ChatbotErrorBoundary;
