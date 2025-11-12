"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import IntegrationCard from "@/components/IntegrationCard";
import {
  INTEGRATIONS,
  Integration,
} from "@/constants/INTEGRATIONS_CONSTANTS";
import { Search } from "lucide-react";

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? { ...integration, status: "connected" as const }
            : integration
        )
      );
      setConnectingId(null);
    }, 3000);
  };

  const handleDisconnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? { ...integration, status: "available" as const }
            : integration
        )
      );
      setConnectingId(null);
    }, 3000);
  };

  // Filter integrations based on search term
  const filteredIntegrations = useMemo(() => {
    if (!searchTerm) return integrations;
    return integrations.filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, integrations]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark-forest mb-3">
            Integrations
          </h1>
          <p className="text-lg text-neutral-gray">
            Use DataPiper with your existing favorite tools with our seamless
            integrations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-gray" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        {filteredIntegrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-gray">
              No integrations found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isProcessing={connectingId === integration.id}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

