import React from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  footer?: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, subtitle, footer, children }: ChartCardProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      style={{ height: "320px" }}
    >
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-[16px] font-semibold text-gray-800 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[12px] text-gray-400 mt-0.5 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Divider */}
      <hr className="border-gray-100/60 my-2" />

      {/* Chart Canvas Area */}
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-100/60 pt-2 mt-2">
          <span className="text-[12px] text-gray-400 font-normal block truncate">
            {footer}
          </span>
        </div>
      )}
    </div>
  );
}
