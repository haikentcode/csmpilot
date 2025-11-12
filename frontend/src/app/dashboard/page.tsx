"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { useCustomers } from "@/hooks/useApi";
import { Customer } from "@/services/apiService";

export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  // Fetch customers from API
  const { data, loading, error } = useCustomers(page, perPage);
  
  // Extract customers from paginated response
  const accounts: Customer[] = useMemo(() => {
    return data?.customers || data?.results || [];
  }, [data]);

  // Format ARR as currency
  const formatArr = (arr: number): string => {
    const thousands = Math.round(arr / 1000);
    return `$${thousands}k / yr`;
  };

  // Format date
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get health score badge styles
  const getHealthStyles = (
    health: string
  ): { bg: string; text: string; border: string } => {
    switch (health) {
      case "Healthy":
        return {
          bg: "bg-light-mint",
          text: "text-dark-forest",
          border: "border-primary-green",
        };
      case "At Risk":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-300",
        };
      case "Critical":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-300",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-300",
        };
    }
  };

  // Filter accounts by search query
  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle card click
  const handleCardClick = (id: number) => {
    router.push(`/account/${id}`);
  };

  return (
    <div className="min-h-screen bg-off-white font-poppins">
      <div className="container mx-auto px-4 py-8">
        {/* Top Navigation Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Greeting */}
            <h1 className="text-3xl font-bold text-dark-forest">
              Good morning, User 👋
            </h1>

            {/* AI Summary Widget */}
            <div className="bg-gradient-to-r from-[#00B365] to-[#004F38] text-white px-6 py-3 rounded-full shadow-md">
              <p className="text-sm font-medium">
                3 accounts need attention today
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-gray w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-primary-green focus:ring-primary-green"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">Error loading accounts: {error}</p>
            <p className="text-neutral-gray">Please check that the backend server is running on http://localhost:8000</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-green"></div>
            <p className="mt-4 text-neutral-gray">Loading accounts...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-gray text-lg">
              {searchQuery ? "No accounts found matching your search." : "No accounts found."}
            </p>
          </div>
        )}

        {/* Account Cards Grid */}
        {!loading && filteredAccounts.length > 0 && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => {
              const healthStyles = getHealthStyles(account.health_score);
              return (
                <Card
                  key={account.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                  onClick={() => handleCardClick(account.id)}
                >
                  <CardContent className="p-5">
                    {/* Account Name */}
                    <h3 className="text-xl font-bold text-dark-forest mb-2">
                      {account.name}
                    </h3>

                    {/* Industry */}
                    <p className="text-sm text-neutral-gray mb-4">
                      {account.industry}
                    </p>

                    {/* Health Score Badge */}
                    <div className="mb-4">
                      <Badge
                        className={`${healthStyles.bg} ${healthStyles.text} border-2 ${healthStyles.border} font-medium`}
                      >
                        {account.health_score}
                      </Badge>
                    </div>

                    {/* Renewal Date */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-gray">
                        Renewal:
                      </span>
                      <span className="text-sm font-medium text-dark-forest">
                        {formatDate(account.renewal_date)}
                      </span>
                    </div>

                    {/* ARR */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-neutral-gray">ARR:</span>
                      <span className="text-sm font-medium text-dark-forest">
                        {formatArr(account.arr)}
                      </span>
                    </div>

                    {/* Sentiment Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-neutral-gray">
                        Sentiment:
                      </span>
                      <div className="flex items-center">
                        {account.sentiment === "up" ? (
                          <ArrowUpRight className="w-5 h-5 text-primary-green" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-500" />
                        )}
                        <span
                          className={`text-sm font-medium ml-1 ${
                            account.sentiment === "up"
                              ? "text-primary-green"
                              : "text-red-500"
                          }`}
                        >
                          {account.sentiment === "up" ? "Positive" : "Negative"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
