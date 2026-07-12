import React from "react";

interface FilterBarProps {
  children: React.ReactNode;
}

export default function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 py-4 px-5 bg-white border border-gray-100 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 hover:shadow-md transition-all duration-200">
      {children}
    </div>
  );
}
