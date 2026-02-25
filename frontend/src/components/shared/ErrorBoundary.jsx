import React from 'react';

/**
 * ErrorBoundary — Catches React render crashes and shows a fallback UI.
 * Prevents the entire app from going blank on component errors.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                    <div className="card text-center max-w-sm">
                        <div className="text-4xl mb-4">😵</div>
                        <h3 className="text-heading-md text-gigpay-text-primary mb-2">
                            Something went wrong
                        </h3>
                        <p className="text-body-md text-gigpay-text-secondary mb-4">
                            {this.props.message || 'An unexpected error occurred. Please try again.'}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-caption text-left bg-red-50 border border-red-200 rounded-lg p-3 mb-4 overflow-auto max-h-24">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="btn-primary w-full"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
