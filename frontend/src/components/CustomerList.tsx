"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomerCardSkeleton } from "@/components/ui/LoadingSpinner";
import {
  LoadingFailed,
  NoSearchResults,
  NoCustomersFound,
} from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useCustomers } from "@/hooks/useApi";
import type { Customer } from "@/services/apiService";

interface CustomerListProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomerId?: number;
}

export default function CustomerList({
  onCustomerSelect,
  selectedCustomerId,
}: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data, loading, error, retry } = useCustomers(currentPage, itemsPerPage);

  const customers = data?.customers || [];
  const totalCustomers = data?.total || 0;

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Reset search when changing pages to avoid confusion
    if (searchTerm) {
      setSearchTerm("");
    }
  };

  // Filter customers based on search term (only for current page)
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.health_score.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Loading Customers...</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <CustomerCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <LoadingFailed
        onRetry={retry}
        error={error || "Unable to fetch customer data"}
      />
    );
  }

  if (filteredCustomers.length === 0) {
    return searchTerm ? (
      <NoSearchResults
        searchTerm={searchTerm}
        onClearSearch={() => setSearchTerm("")}
      />
    ) : (
      <NoCustomersFound onRefresh={retry} />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Pagination - Top */}
        <Pagination
          totalItems={totalCustomers}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
          className="justify-center"
        />
        
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customers</span>
              <Badge variant="secondary" className="animate-pulse-subtle">
                {searchTerm ? `${filteredCustomers.length} filtered` : `Page ${currentPage} of ${Math.ceil(totalCustomers / itemsPerPage)}`}
              </Badge>
            </CardTitle>
            {/* Search Input */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search customers on this page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>
          </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2 p-4">
              {filteredCustomers.map((customer, index) => (
                <Card
                  key={customer.id}
                  className={`
                    cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02]
                    animate-fade-in-up border-l-4
                    ${
                      selectedCustomerId === customer.id
                        ? "border-l-primary-green bg-light-mint shadow-md"
                        : customer.health_score === "Critical"
                        ? "border-l-red-400 hover:border-l-red-500"
                        : customer.health_score === "At Risk"
                        ? "border-l-yellow-400 hover:border-l-yellow-500"
                        : "border-l-primary-green hover:border-l-dark-forest"
                    }
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-dark-forest truncate mb-2">
                          {customer.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={`text-responsive-xs hover:scale-105 transition-transform duration-200 ${
                                    customer.health_score === "Critical"
                                      ? "bg-red-500 text-white"
                                      : customer.health_score === "At Risk"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-primary-green text-white"
                                  }`}
                                >
                                  {customer.industry}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Industry: {customer.industry}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={`text-responsive-xs hover:scale-105 transition-transform duration-200 ${
                                    customer.health_score === "Critical"
                                      ? "bg-red-500 text-white"
                                      : customer.health_score === "At Risk"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-primary-green text-white"
                                  }`}
                                >
                                  {customer.health_score}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Health Score: {customer.health_score}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-responsive-sm text-neutral-gray space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium">ARR:</span>
                            <span className="ml-2">
                              ${customer.arr >= 1000 
                                ? `${(customer.arr / 1000).toFixed(1)}k` 
                                : customer.arr.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Renewal:</span>
                            <span className="ml-2">
                              {new Date(customer.renewal_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                className={`
                                w-3 h-3 rounded-full transition-all duration-200 hover:scale-125
                                ${
                                  customer.health_score === "Critical"
                                    ? "bg-red-500"
                                    : customer.health_score === "At Risk"
                                    ? "bg-yellow-500"
                                    : "bg-primary-green"
                                }
                              `}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Health Score: {customer.health_score}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {selectedCustomerId === customer.id && (
                          <div className="mt-2 text-responsive-xs text-primary-green font-medium animate-pulse-subtle">
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </TooltipProvider>
);
}
