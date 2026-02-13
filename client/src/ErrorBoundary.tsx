import { Component } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#111827',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            ⚠️
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', textAlign: 'center' }}>
            The page encountered an error. Please try again.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#f97316',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #374151',
                background: 'transparent',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
