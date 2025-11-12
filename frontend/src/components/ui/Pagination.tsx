"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
  loading?: boolean;
}

interface PaginationInfo {
  totalPages: number;
  startItem: number;
  endItem: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function Pagination({
  totalItems,
  currentPage,
  itemsPerPage = 10,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = "",
  loading = false,
}: PaginationProps) {
  // Calculate pagination info
  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return {
      totalPages,
      startItem,
      endItem,
      hasPrevious,
      hasNext,
    };
  }, [totalItems, currentPage, itemsPerPage]);

  // Generate page numbers to display
  const getVisiblePages = React.useMemo(() => {
    const { totalPages } = paginationInfo;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: (number | string)[] = [];

    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("...");
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, paginationInfo.totalPages, maxVisiblePages]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationInfo.totalPages && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (paginationInfo.hasPrevious && !loading) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (paginationInfo.hasNext && !loading) {
      handlePageChange(currentPage + 1);
    }
  };

  // Don't render if there's only one page or no items
  if (paginationInfo.totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Page Info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        {loading ? (
          <div className="animate-pulse">Loading...</div>
        ) : (
          <span>
            {paginationInfo.startItem}-{paginationInfo.endItem} of {totalItems}{" "}
          </span>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!paginationInfo.hasPrevious || loading}
          className="flex items-center gap-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getVisiblePages.map((page, index) => {
              if (page === "...") {
                return (
                  <div
                    key={`ellipsis-${index}`}
                    className="px-2 py-1 text-gray-400"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <Button
                  key={pageNumber}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className={`
                    min-w-[2.5rem] h-9 transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        : "hover:bg-gray-50 border-gray-200"
                    }
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!paginationInfo.hasNext || loading}
          className="flex items-center gap-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Export pagination info hook for external use
export function usePaginationInfo(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number = 10
): PaginationInfo {
  return React.useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return {
      totalPages,
      startItem,
      endItem,
      hasPrevious,
      hasNext,
    };
  }, [totalItems, currentPage, itemsPerPage]);
}

export default Pagination;
