import { Calendar, RefreshCw, Bell, User } from "lucide-react";

interface DashboardHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ loading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight">Dashboard</h1>
        <p className="text-[18px] text-gray-500 font-medium mt-0.5">Durian Guardian AI — Systems Operational</p>
      </div>
      <div className="flex items-center flex-wrap" style={{ gap: "12px" }}>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#EEF2F7] bg-white rounded-[12px] text-[13px] font-semibold text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Filter by last 30 days"
        >
          <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span>Last 30 Days</span>
        </button>
        <button
          onClick={onRefresh}
          type="button"
          disabled={loading}
          className="inline-flex items-center justify-center p-2.5 border border-[#EEF2F7] bg-white rounded-[12px] text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center p-2.5 border border-[#EEF2F7] bg-white rounded-[12px] text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" aria-label="Unread notifications" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center p-2.5 border border-[#EEF2F7] bg-white rounded-[12px] text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="User profile"
        >
          <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
