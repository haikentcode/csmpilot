"use client";

import { LucideIcon } from "lucide-react";
import { FileText, TrendingUp, Zap } from "lucide-react";
import type { FeatureCard } from "@/constants/HOME_CONSTANTS";

interface FeatureCardProps {
  feature: FeatureCard;
}

const iconMap: Record<string, LucideIcon> = {
  FileText,
  TrendingUp,
  Zap,
};

export default function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = iconMap[feature.icon] || FileText;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-green/30 group text-center">
      <div className="mb-4 flex justify-center">
        <div className="w-12 h-12 bg-primary-green rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <h3 className="text-md font-bold text-dark-forest mb-2">
        {feature.title}
      </h3>
      <p className="text-xs text-neutral-gray mb-3 font-medium">
        {feature.subtitle}
      </p>
      <p className="text-sm text-neutral-gray leading-relaxed mb-3">{feature.body}</p>
      {feature.tagline && (
        <p className="text-xs font-semibold text-primary-green italic">
          &ldquo;{feature.tagline}&rdquo;
        </p>
      )}
    </div>
  );
}

