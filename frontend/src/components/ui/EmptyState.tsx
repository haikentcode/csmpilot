import React from 'react';
import { Search, Users, FileText, AlertCircle, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4 text-neutral-gray">
        {icon || <FileText className="h-12 w-12" />}
      </div>
      
      <h3 className="text-lg font-medium text-dark-forest mb-2">{title}</h3>
      
      <p className="text-neutral-gray mb-6 max-w-sm">{description}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              action.variant === 'secondary'
                ? 'bg-light-mint text-dark-forest hover:bg-primary-green hover:text-white focus:ring-primary-green'
                : 'bg-primary-green text-white hover:bg-dark-forest focus:ring-primary-green'
            }`}
          >
            {action.label}
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-4 py-2 bg-light-mint text-dark-forest rounded-md hover:bg-primary-green hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

// Predefined empty states for common scenarios
export const NoCustomersFound: React.FC<{ onRefresh?: () => void; onClearFilters?: () => void }> = ({
  onRefresh,
  onClearFilters,
}) => (
  <EmptyState
    icon={<Users className="h-12 w-12" />}
    title="No customers found"
    description="We couldn&apos;t find any customers matching your criteria. Try adjusting your filters or refreshing the data."
    action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
    secondaryAction={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
  />
);

export const NoSearchResults: React.FC<{ searchTerm: string; onClearSearch: () => void }> = ({
  searchTerm,
  onClearSearch,
}) => (
  <EmptyState
    icon={<Search className="h-12 w-12" />}
    title="No results found"
    description={`We couldn't find any results for "${searchTerm}". Try searching with different keywords.`}
    action={{ label: 'Clear Search', onClick: onClearSearch }}
  />
);

export const NoSimilarCustomers: React.FC<{ customerName: string; onRefresh?: () => void }> = ({
  customerName,
  onRefresh,
}) => (
  <EmptyState
    icon={<Users className="h-12 w-12" />}
    title="No similar customers found"
    description={`We couldn't find any customers similar to ${customerName}. This could be due to unique characteristics or limited data.`}
    action={onRefresh ? { label: 'Refresh Analysis', onClick: onRefresh } : undefined}
  />
);

export const ServiceUnavailable: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={<AlertCircle className="h-12 w-12" />}
    title="Service temporarily unavailable"
    description="We're experiencing technical difficulties. Please try again in a few moments."
    action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
  />
);

export const LoadingFailed: React.FC<{ onRetry: () => void; error?: string }> = ({ 
  onRetry, 
  error 
}) => (
  <EmptyState
    icon={<AlertCircle className="h-12 w-12" />}
    title="Failed to load data"
    description={error || "Something went wrong while loading the data. Please try again."}
    action={{ label: 'Retry', onClick: onRetry }}
  />
);

export const NoDataAvailable: React.FC<{ 
  title?: string; 
  description?: string; 
  onRefresh?: () => void 
}> = ({ 
  title = "No data available", 
  description = "There's no data to display at the moment. Check back later or refresh to see if new data is available.",
  onRefresh 
}) => (
  <EmptyState
    icon={<FileText className="h-12 w-12" />}
    title={title}
    description={description}
    action={onRefresh ? { 
      label: 'Refresh', 
      onClick: onRefresh,
      variant: 'secondary' as const
    } : undefined}
  />
);

export const FirstTimeSetup: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <EmptyState
    icon={<Plus className="h-12 w-12" />}
    title="Welcome to CSMPilot"
    description="Get started by exploring your customer data and insights. We'll help you understand your customers better."
    action={{ label: 'Get Started', onClick: onGetStarted }}
  />
);

// Compact empty state for smaller spaces
export const CompactEmptyState: React.FC<{
  message: string;
  action?: { label: string; onClick: () => void };
}> = ({ message, action }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <FileText className="h-8 w-8 text-neutral-gray mb-2" />
    <p className="text-sm text-neutral-gray mb-3">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="text-sm text-primary-green hover:text-dark-forest font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);