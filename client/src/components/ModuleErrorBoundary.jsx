import React, { Component } from 'react';
import { Icon } from '@iconify/react';
import { generateReferenceId } from '../utils/errorHandler';
import { logger } from '../utils/logger';

class ModuleErrorBoundary extends Component {
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
    logger.error(`Module Error Boundary caught crash in [${this.props.moduleName || 'Module'}]`, {
      error: error?.message,
      componentStack: errorInfo?.componentStack?.slice(0, 300),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, referenceId: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 m-4 sm:m-6 saas-card text-center border border-[#E4E7EC] space-y-4 max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Icon icon="heroicons:exclamation-circle" className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              Unable to load {this.props.moduleName || 'this section'}
            </h2>
            <p className="text-xs text-[#667085] mt-1 leading-relaxed">
              Something unexpected happened while loading this page. The rest of Eron-CRM remains fully operational.
            </p>
          </div>

          {this.state.referenceId && (
            <div className="inline-block px-3 py-1 bg-[#F9FAFB] border border-[#EAECF0] rounded-[6px] text-xs font-mono text-[#475467]">
              Ref: {this.state.referenceId}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="saas-button-primary h-9 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 text-white" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
