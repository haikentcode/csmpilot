"use client";

import { LucideIcon } from "lucide-react";
import { FileText, Calendar, Users } from "lucide-react";
import type { FeatureCard } from "@/constants/HOME_CONSTANTS";

interface FeatureCardProps {
  feature: FeatureCard;
}

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Calendar,
  Users,
};

export default function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = iconMap[feature.icon] || FileText;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group h-full flex flex-col">
      <div className="mb-4">
        <div className="w-14 h-14 bg-primary-green/10 rounded-xl flex items-center justify-center group-hover:bg-primary-green/20 transition-colors duration-300">
          <Icon className="w-7 h-7 text-primary-green" strokeWidth={2} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-dark-forest mb-3">
        {feature.title}
      </h3>
      <p className="text-base text-neutral-gray leading-relaxed">
        {feature.subtitle}
      </p>
    </div>
  );
}
