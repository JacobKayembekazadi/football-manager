/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-red-500/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-red-500/20 border border-red-500/50">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">
                  System Error
                </h2>
                <p className="text-sm text-slate-400 font-mono">
                  Unexpected error occurred
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Something went wrong. The application encountered an unexpected error.
              </p>
              
              {this.state.error && (
                <details className="bg-black/40 p-4 rounded-lg border border-white/10">
                  <summary className="text-xs text-slate-500 font-mono cursor-pointer mb-2">
                    Error Details
                  </summary>
                  <pre className="text-xs text-red-400 font-mono overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-neon-blue text-black font-bold uppercase rounded hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 border border-white/10 text-white font-bold uppercase rounded hover:bg-white/10 transition-colors"
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





