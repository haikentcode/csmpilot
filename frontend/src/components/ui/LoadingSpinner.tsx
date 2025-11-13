import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text = 'Loading...',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-green`}
        role="status"
        aria-label={text}
      />
      {text && (
        <p className={`mt-2 text-neutral-gray ${textSizeClasses[size]}`} aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const InlineLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center space-x-2 text-neutral-gray">
    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-green" />
    <span className="text-md text-dark-forest">{text}</span>
  </div>
);

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const CustomerCardSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex justify-between items-start">
      <SkeletonLoader className="h-5 w-32" />
      <SkeletonLoader className="h-4 w-16" />
    </div>
    <SkeletonLoader className="h-4 w-24" />
    <SkeletonLoader className="h-4 w-20" />
    <div className="flex space-x-2">
      <SkeletonLoader className="h-6 w-16" />
      <SkeletonLoader className="h-6 w-20" />
    </div>
  </div>
);

export const ProfileSummarySkeleton: React.FC = () => (
  <div className="space-y-4">
    <SkeletonLoader className="h-6 w-48" />
    <SkeletonLoader className="h-20 w-full" />
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-24" />
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-3/4" />
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-32" />
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-2/3" />
    </div>
  </div>
);