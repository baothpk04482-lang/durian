import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ loading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight">Bảng điều khiển</h1>
        <p className="text-[18px] text-gray-500 font-medium mt-0.5">Durian Guardian AI — Hệ thống hoạt động</p>
      </div>
      <div className="flex items-center">
        <button
          onClick={onRefresh}
          type="button"
          disabled={loading}
          className="inline-flex items-center justify-center p-2.5 border border-[#EEF2F7] bg-white rounded-[12px] text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Làm mới tổng quan"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
