import { Calendar, RefreshCw } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Durian Guardian AI Overview</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Static Date Range selector */}
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-100 bg-white rounded-[12px] text-sm font-semibold text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 focus:outline-none"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Last 30 Days</span>
        </button>

        {/* Static Refresh action */}
        <button
          type="button"
          className="inline-flex items-center justify-center p-2.5 border border-gray-100 bg-white rounded-[12px] text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 focus:outline-none"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
