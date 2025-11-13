"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Grid3x3,
  List,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from "lucide-react";
import { useCustomers } from "@/hooks/useApi";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export function capitalizeFirstLetter(str: string) {
  if (typeof str !== 'string' || str.length === 0) {
    return ""; // Handle empty or non-string input
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}


export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedRenewal, setSelectedRenewal] = useState("all");
  const [selectedSort, setSelectedSort] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"attention" | "all">("all");
  const [collapsedSections, setCollapsedSections] = useState<{
    critical: boolean;
    at_risk: boolean;
    healthy: boolean;
  }>({
    critical: false,
    at_risk: false,
    healthy: false,
  });

  // Fetch customers from API
  const { data, loading, error } = useCustomers(page);

  // Extract customers from paginated response
  const accounts: Customer[] = useMemo(() => {
    return data?.results || [];
  }, [data]);

  // Calculate stats from API data
  const stats = useMemo(() => {
    if (!accounts.length) {
      return {
        totalCustomers: 0,
        totalARR: 0,
        avgHealthScore: 0,
        avgNPS: 0,
        needsAttention: 0,
      };
    }

    const totalARR = accounts.reduce((sum, acc) => sum + acc.arr, 0);

    // Convert health_score to numeric (assuming healthy=100, at_risk=50, critical=25)
    const healthScoreMap: Record<string, number> = {
      healthy: 100,
      at_risk: 50,
      critical: 25,
    };
    const avgHealthScore =
      accounts.reduce(
        (sum, acc) => sum + (healthScoreMap[acc.health_score] || 0),
        0
      ) / accounts.length;

    // Calculate average NPS (mock for now, as it's not in base Customer type)
    const avgNPS = 53; // Mock value

    const needsAttention = accounts.filter(
      (acc) => acc.health_score === "critical" || acc.health_score === "at_risk"
    ).length;

    return {
      totalCustomers: accounts.length,
      totalARR,
      avgHealthScore: Math.round(avgHealthScore),
      avgNPS,
      needsAttention,
    };
  }, [accounts]);

  // Get unique industries for filter
  const industries = useMemo(() => {
    const uniqueIndustries = Array.from(
      new Set(accounts.map((acc) => acc.industry))
    );
    return uniqueIndustries.sort();
  }, [accounts]);

  // Format ARR as currency
  const formatArr = (arr: number): string => {
    const thousands = Math.round(arr / 1000);
    return `$${thousands}k / yr`;
  };

  const formatArrMillions = (arr: number): string => {
    const millions = (arr / 1000000).toFixed(2);
    return `$${millions}M`;
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

  // Get deterministic active users based on account ID
  const getActiveUsers = (accountId: number): number => {
    // Use account ID to generate a consistent "random" number
    return 20 + (accountId % 80);
  };

  // Get health score badge styles
  const getHealthStyles = (
    health: string
  ): { bg: string; text: string; border: string } => {
    switch (health) {
      case "healthy":
        return {
          bg: "bg-light-mint",
          text: "text-dark-forest",
          border: "border-primary-green",
        };
      case "at_risk":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-300",
        };
      case "critical":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-300",
        };
      default:
        return {
          bg: "bg-gray-[#f3f3f5]",
          text: "text-gray-700",
          border: "border-gray-300",
        };
    }
  };

  // Get health score display text
  const getHealthText = (health: string): string => {
    switch (health) {
      case "healthy":
        return "Healthy";
      case "at_risk":
        return "At Risk";
      case "critical":
        return "Critical";
      default:
        return "Unknown";
    }
  };

  // Filter and group accounts
  const { filteredAccounts, groupedAccounts } = useMemo(() => {
    // Apply filters
    let filtered = accounts.filter((account) => {
      // Search filter
      const matchesSearch =
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.industry.toLowerCase().includes(searchQuery.toLowerCase());

      // Industry filter
      const matchesIndustry =
        selectedIndustry === "all" || account.industry === selectedIndustry;

      // Renewal filter
      let matchesRenewal = true;
      if (selectedRenewal === "upcoming") {
        const renewalDate = new Date(account.renewal_date);
        const today = new Date();
        const daysUntilRenewal = Math.ceil(
          (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        matchesRenewal = daysUntilRenewal > 0 && daysUntilRenewal <= 90;
      } else if (selectedRenewal === "overdue") {
        const renewalDate = new Date(account.renewal_date);
        const today = new Date();
        matchesRenewal = renewalDate < today;
      }

      return matchesSearch && matchesIndustry && matchesRenewal;
    });

    // Apply tab filter
    if (activeTab === "attention") {
      filtered = filtered.filter(
        (acc) =>
          acc.health_score === "critical" || acc.health_score === "at_risk"
      );
    }

    // Sort
    if (selectedSort === "date") {
      filtered.sort(
        (a, b) =>
          new Date(a.renewal_date).getTime() -
          new Date(b.renewal_date).getTime()
      );
    } else if (selectedSort === "arr") {
      filtered.sort((a, b) => b.arr - a.arr);
    }

    // Group by health status
    const grouped = {
      critical: filtered.filter((acc) => acc.health_score === "critical"),
      at_risk: filtered.filter((acc) => acc.health_score === "at_risk"),
      healthy: filtered.filter((acc) => acc.health_score === "healthy"),
    };

    return { filteredAccounts: filtered, groupedAccounts: grouped };
  }, [
    accounts,
    searchQuery,
    selectedIndustry,
    selectedRenewal,
    selectedSort,
    activeTab,
  ]);

  // Handle card click
  const handleCardClick = (id: number) => {
    router.push(`/account/${id}`);
  };

  // Toggle section collapse
  const toggleSection = (section: "critical" | "at_risk" | "healthy") => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("all");
    setSelectedRenewal("all");
    setSelectedSort("date");
  };


  // Check if any filters are active
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedIndustry !== "all" ||
    selectedRenewal !== "all" ||
    selectedSort !== "date";

  // Render customer card
  const renderCustomerCard = (account: Customer, index: number) => {
    const healthStyles = getHealthStyles(account.health_score);
    const activeUsers = getActiveUsers(account.id);
    const healthScore =
      account.health_score === "healthy"
        ? 28
        : account.health_score === "at_risk"
        ? 20
        : 18;
    
    // Check if this is the card at index 2 (third card, 0-indexed)
    const isProspect = index === 2;

    return (
      <Card
        key={account.id}
        className="bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-green-50 transition-shadow cursor-pointer"
        onClick={() => handleCardClick(account.id)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark-forest mb-1">
                {account.name}
              </h3>
              <p className="text-sm text-gray-600">{capitalizeFirstLetter(account.industry)}</p>
            </div>
            {!isProspect && (
              <Badge
                className={`${healthStyles.bg} ${healthStyles.text} border ${healthStyles.border} font-medium px-3 py-1`}
              >
                {getHealthText(account.health_score)}
              </Badge>
            )}
            {isProspect && (
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium px-3 py-1">
                Prospect
              </Badge>
            )}
          </div>

          {/* Metrics Row */}
          {isProspect ? (
            // Prospect metrics - only show Opportunity Value and Status
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Opportunity Value</p>
                <p className="text-sm font-semibold text-dark-forest">
                  {formatArr(account.arr)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Renewal</p>
                <p className="text-sm font-semibold text-dark-forest">
                  NA / Prospect
                </p>
              </div>
            </div>
          ) : (
            // Regular customer metrics
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">ARR</p>
                <p className="text-sm font-semibold text-dark-forest">
                  {formatArr(account.arr)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Active Users</p>
                <p className="text-sm font-semibold text-dark-forest">
                  {activeUsers}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Renewal</p>
                <p className="text-sm font-semibold text-dark-forest">
                  {formatDate(account.renewal_date)}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Row - Only show for non-prospects */}
          {!isProspect && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Health</p>
                <p className="text-sm font-semibold text-dark-forest">
                  {healthScore}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">Sentiment</p>
                {account.sentiment === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-primary-green" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render customer row (list view)
  const renderCustomerRow = (account: Customer) => {
    const healthStyles = getHealthStyles(account.health_score);
    const activeUsers = getActiveUsers(account?.active_users || 0);
    const healthScore =
      account.health_score === "healthy"
        ? 28
        : account.health_score === "at_risk"
        ? 20
        : 18;

    return (
      <tr
        key={account.id}
        className="border-b border-gray-100 hover:bg-green-50 cursor-pointer"
        onClick={() => handleCardClick(account.id)}
      >
        <td className="py-4 px-4">
          <div>
            <p className="font-semibold text-dark-forest">{account.name}</p>
            <p className="text-sm text-gray-600">{capitalizeFirstLetter(account.industry)}</p>
          </div>
        </td>
        <td className="py-4 px-4">
          <Badge
            className={`${healthStyles.bg} ${healthStyles.text} border ${healthStyles.border} font-medium`}
          >
            {getHealthText(account.health_score)}
          </Badge>
        </td>
        <td className="py-4 px-4 text-sm font-medium text-dark-forest">
          {formatArr(account.arr)}
        </td>
        <td className="py-4 px-4 text-sm font-medium text-dark-forest">
          {activeUsers}
        </td>
        <td className="py-4 px-4 text-sm font-medium text-dark-forest">
          {account?.nps ?? healthScore}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-1">
            {account.sentiment === "up" ? (
              <ArrowUpRight className="w-4 h-4 text-primary-green" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Greeting Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark-forest mb-2">
            Good morning, Jishan
          </h1>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {stats.needsAttention} accounts need attention today
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-dark-forest mb-2">
                {stats.totalCustomers}
              </p>
              <div className="flex items-center gap-1 text-primary-green text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+25% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Total ARR</p>
              <p className="text-3xl font-bold text-dark-forest mb-2">
                {formatArrMillions(stats.totalARR)}
              </p>
              <div className="flex items-center gap-1 text-primary-green text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>+8% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Avg Health Score</p>
              <p className="text-3xl font-bold text-dark-forest mb-2">
                {stats.avgHealthScore}
              </p>
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <ArrowDownRight className="w-4 h-4" />
                <span>-5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Avg NPS</p>
              <p className="text-3xl font-bold text-dark-forest mb-2">
                {stats.avgNPS}
              </p>
              <p className="text-sm text-gray-600">No change</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search customers by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-[#f3f3f5] w-full"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary-green text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-primary-green text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-4">
            <Select
              value={selectedIndustry}
              onValueChange={setSelectedIndustry}
            >
              <SelectTrigger className="w-48 bg-gray-[#f3f3f5]">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRenewal} onValueChange={setSelectedRenewal}>
              <SelectTrigger className="w-48 bg-gray-[#f3f3f5]">
                <SelectValue placeholder="All Renewals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Renewals</SelectItem>
                <SelectItem value="upcoming">Upcoming (90 days)</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-48 bg-gray-[#f3f3f5]">
                <SelectValue placeholder="Renewal Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Renewal Date</SelectItem>
                <SelectItem value="arr">ARR (High to Low)</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-[#f3f3f5] transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("attention")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "attention"
                ? "bg-orange-100 text-orange-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Needs Attention ({stats.needsAttention})</span>
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "all"
                ? "bg-gray-100 text-dark-forest"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Customers ({stats.totalCustomers})
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">
              Error loading accounts: {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-green"></div>
            <p className="mt-4 text-neutral-gray">Loading accounts...</p>
          </div>
        )}

        {/* Customer Sections */}
        {!loading && !error && (
          <>
            {/* Critical Section */}
            {groupedAccounts.critical.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("critical")}
                  className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg mb-4 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700">
                      Critical - Immediate Attention Required
                    </span>
                    <Badge className="bg-red-600 text-white">
                      {groupedAccounts.critical.length}
                    </Badge>
                  </div>
                  {collapsedSections.critical ? (
                    <ChevronDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-red-600" />
                  )}
                </button>

                {!collapsedSections.critical && (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedAccounts.critical.map((account, index) => renderCustomerCard(account, index))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-[#f3f3f5] border-b border-gray-200">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Customer
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Status
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                ARR
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Active Users
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Health
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Sentiment
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedAccounts.critical.map(renderCustomerRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* At Risk Section */}
            {groupedAccounts.at_risk.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("at_risk")}
                  className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">
                      At Risk - Monitor Closely
                    </span>
                    <Badge className="bg-yellow-600 text-white">
                      {groupedAccounts.at_risk.length}
                    </Badge>
                  </div>
                  {collapsedSections.at_risk ? (
                    <ChevronDown className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-yellow-600" />
                  )}
                </button>

                {!collapsedSections.at_risk && (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedAccounts.at_risk.map((account, index) => renderCustomerCard(account, index))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-[#f3f3f5] border-b border-gray-200">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Customer
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Status
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                ARR
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Active Users
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Health
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Sentiment
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedAccounts.at_risk.map(renderCustomerRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Healthy Section */}
            {groupedAccounts.healthy.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("healthy")}
                  className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-700">
                      Healthy - On Track
                    </span>
                    <Badge className="bg-green-600 text-white">
                      {groupedAccounts.healthy.length}
                    </Badge>
                  </div>
                  {collapsedSections.healthy ? (
                    <ChevronDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-green-600" />
                  )}
                </button>

                {!collapsedSections.healthy && (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedAccounts.healthy.map((account, index) => renderCustomerCard(account, index))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-[#f3f3f5] border-b border-gray-200">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Customer
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Status
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                ARR
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Active Users
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Health
                              </th>
                              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                                Sentiment
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedAccounts.healthy.map(renderCustomerRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* No Results */}
            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-gray text-lg">
                  No customers found matching your filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
