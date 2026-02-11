import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-arm-surface flex items-center justify-center p-6">
          <div className="bg-arm-surfaceLight rounded-lg border border-arm-border max-w-2xl w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">⚠️</div>
              <h1 className="text-2xl font-bold text-arm-text">
                Something went wrong
              </h1>
            </div>

            <p className="text-arm-textMuted mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Error Details (collapsed by default) */}
            <details className="mb-6">
              <summary className="cursor-pointer text-sm font-semibold text-arm-accent hover:text-arm-blue mb-2">
                Show error details
              </summary>
              <div className="bg-arm-surface border border-arm-border rounded p-4 overflow-auto">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-arm-textMuted mb-1">
                    Error Message:
                  </h3>
                  <pre className="text-xs text-arm-danger font-mono whitespace-pre-wrap">
                    {this.state.error?.toString()}
                  </pre>
                </div>

                {this.state.errorInfo && (
                  <div>
                    <h3 className="text-xs font-semibold text-arm-textMuted mb-1">
                      Component Stack:
                    </h3>
                    <pre className="text-xs text-arm-textMuted font-mono whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-arm-surface text-arm-text border border-arm-border rounded hover:bg-arm-surfaceLight transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
