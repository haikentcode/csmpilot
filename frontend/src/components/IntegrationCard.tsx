"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Integration } from "@/constants/INTEGRATIONS_CONSTANTS";
import { CheckCircle2, Loader2 } from "lucide-react";

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  isProcessing?: boolean;
}

export default function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  isProcessing = false,
}: IntegrationCardProps) {
  const isConnected = integration.status === "connected";
  const isComingSoon = integration.status === "coming_soon";

  const handleClick = () => {
    if (isComingSoon || isProcessing) return;
    if (isConnected) {
      onDisconnect(integration.id);
    } else {
      onConnect(integration.id);
    }
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-white border-2 ${
                isConnected
                  ? "border-primary-green"
                  : "border-gray-200 group-hover:border-light-mint"
              }`}
            >
              <Image
                src={integration.logo}
                alt={`${integration.name} logo`}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-forest flex items-center gap-2">
                {integration.name}
                {isConnected && (
                  <CheckCircle2 className="w-4 h-4 text-primary-green" />
                )}
              </h3>
              {integration.badge && (
                <Badge
                  variant={isComingSoon ? "secondary" : "outline"}
                  className="mt-1 text-xs"
                >
                  {integration.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-neutral-gray leading-relaxed mb-4">
          {integration.description}
        </p>
        <Button
          onClick={handleClick}
          disabled={isComingSoon || isProcessing}
          variant={isConnected ? "outline" : "default"}
          className={`w-full transition-all duration-300 ${
            isConnected
              ? "border-primary-green text-primary-green hover:bg-light-mint"
              : "bg-primary-green hover:bg-dark-forest text-white"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : isComingSoon ? (
            "Coming Soon"
          ) : isConnected ? (
            "Disconnect"
          ) : (
            "Connect"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

