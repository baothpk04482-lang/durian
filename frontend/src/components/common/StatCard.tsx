import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  compact?: boolean;
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = "text-[#1E8449]", compact = false }: StatCardProps) {
  if (compact) {
    return (
      <div className="bg-white border border-gray-100 rounded-[18px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex items-center gap-3"
        style={{ height: "80px" }}
      >
        <div className={`w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center ${color} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{title}</span>
            <span className="text-[18px] font-bold text-gray-900 tracking-tight whitespace-nowrap">{value}</span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-gray-500 font-normal block truncate">{subtitle}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-gray-100 rounded-[18px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      style={{ height: "130px" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>

      <div className="leading-none mt-1">
        <span className="text-[22px] font-bold text-gray-900 tracking-tight">{value}</span>
      </div>

      <div className="mt-1">
        {subtitle && (
          <span className="text-[12px] text-gray-500 font-normal block truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
