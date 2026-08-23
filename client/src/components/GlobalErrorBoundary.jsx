import React, { Component } from 'react';
import { Icon } from '@iconify/react';
import { generateReferenceId } from '../utils/errorHandler';
import { logger } from '../utils/logger';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      referenceId: null,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
      referenceId: generateReferenceId(),
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Global React Error Boundary caught crash', {
      error: error?.message,
      componentStack: errorInfo?.componentStack?.slice(0, 300),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, referenceId: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, referenceId: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4 sm:p-6 font-sans text-[#111827]">
          <div className="saas-card max-w-md w-full p-6 sm:p-8 text-center space-y-5 border border-[#E4E7EC] shadow-modal">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#111827]">Something went wrong</h1>
              <p className="text-xs sm:text-sm text-[#667085] mt-1.5 leading-relaxed">
                We couldn't load this application section correctly. Please try again or return to the dashboard.
              </p>
            </div>

            {this.state.referenceId && (
              <div className="p-3 bg-[#F9FAFB] border border-[#EAECF0] rounded-[8px] inline-block">
                <span className="text-[11px] font-semibold text-[#667085]">Support Reference: </span>
                <span className="text-xs font-bold font-mono text-[#101828]">{this.state.referenceId}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="saas-button-primary h-10 px-4 text-xs font-semibold flex items-center gap-2"
              >
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 text-white" />
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="saas-button-secondary h-10 px-4 text-xs font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
