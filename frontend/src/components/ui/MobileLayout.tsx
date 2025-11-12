import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  sidebar,
  header,
  className = '',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {header && <div className="flex-1 ml-4">{header}</div>}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar Content */}
            <div
              className={`
                ${isMobile ? 'fixed' : 'relative'}
                ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                ${isMobile ? 'z-50' : 'z-10'}
                w-80 bg-white shadow-lg transition-transform duration-300 ease-in-out
                ${isMobile ? 'h-full' : 'min-h-screen'}
              `}
            >
              {/* Mobile Sidebar Header */}
              {isMobile && (
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              <div className="overflow-y-auto h-full">
                {sidebar}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${sidebar ? (isMobile ? '' : 'ml-0') : ''}`}>
          {/* Desktop Header */}
          {!isMobile && header && (
            <div className="bg-white shadow-sm border-b px-6 py-4 hidden md:block">
              {header}
            </div>
          )}

          {/* Content Area */}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  className = '',
}) => {
  const gridClasses = `
    grid
    grid-cols-${columns.mobile || 1}
    md:grid-cols-${columns.tablet || 2}
    lg:grid-cols-${columns.desktop || 3}
    ${gap}
    ${className}
  `;

  return <div className={gridClasses}>{children}</div>;
};

interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border p-4
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="ml-3 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

interface MobileStackProps {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const MobileStack: React.FC<MobileStackProps> = ({
  children,
  spacing = 'normal',
  className = '',
}) => {
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6',
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className = '',
}) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`mb-4 p-2 ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      <span className="text-sm">{label}</span>
    </Button>
  );
};

// Accessibility helpers
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};

export const FocusRing: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded ${className}`}>
      {children}
    </div>
  );
};