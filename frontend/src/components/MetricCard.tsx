import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor: string;
  iconBgColor: string;
}

export default function MetricCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBgColor,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-dark-forest">{value}</p>
      </div>
    </div>
  );
}

