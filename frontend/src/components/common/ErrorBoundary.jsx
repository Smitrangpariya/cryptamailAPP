import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show fallback UI
    return { hasError: true, error, errorInfo: { componentStack: error.toString() } };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any child components
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    
    // Log errors for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Application Error</h1>
            <h2 className="text-lg font-semibold text-red-500 mb-2">Something went wrong</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Error:</strong> {this.state.error?.toString() || 'Unknown error'}</p>
              {this.state.errorInfo && (
                <details className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="whitespace-pre-wrap bg-gray-800 text-green-400 p-2 rounded text-xs">
                    {JSON.stringify(this.state.errorInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Troubleshooting Steps:</h3>
            <ol className="list-decimal text-sm text-gray-600 space-y-1">
              <li>1. Check browser console for detailed error messages</li>
              <li>2. Try refreshing the page</li>
              <li>3. Clear browser cache and cookies</li>
              <li>4. Try disabling browser extensions temporarily</li>
              <li>5. Access the debug page: <code>http://localhost:5173/debug</code></li>
            </ol>
            
            <div className="mt-6 space-x-4">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;