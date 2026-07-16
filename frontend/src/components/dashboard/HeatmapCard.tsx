import { Map, RefreshCw } from "lucide-react";
import Card from "./Shared/Card";
import HeatmapGrid from "./HeatmapGrid";
import type { ZoneSection } from "./HeatmapGrid";

interface HeatmapCardProps {
  sections: ZoneSection[];
  lastUpdated: string;
  summaryCounts: { healthy: number; monitor: number; diseased: number };
  onRefresh?: () => void;
  farmOptions?: { value: string; label: string }[];
  zoneOptions?: { value: string; label: string }[];
  selectedFarm?: string;
  selectedZone?: string;
  onFarmChange?: (value: string) => void;
  onZoneChange?: (value: string) => void;
}

const LEGEND_ITEMS = [
  { label: "An toàn", color: "bg-[#6EE7B7]" },
  { label: "Cần theo dõi", color: "bg-[#FDE68A]" },
  { label: "Nguy cơ cao", color: "bg-[#F87171]" },
];

export default function HeatmapCard({ sections, lastUpdated, summaryCounts, onRefresh, farmOptions, zoneOptions, selectedFarm, selectedZone, onFarmChange, onZoneChange }: HeatmapCardProps) {
  return (
    <Card className="flex flex-col" padding={false} style={{ height: "100%", overflow: "hidden" }}>
      <div className="flex flex-col flex-1 min-h-0" style={{ padding: "10px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "4px" }}>
          <div className="flex items-center gap-2.5">
            <Map className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Bản đồ giám sát cây trồng</h3>
              <span className="text-[12px] text-gray-500 font-medium">Theo dõi Risk Index theo từng khu vực và Tree Digital ID.</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              className="text-[11px] font-semibold text-gray-600 bg-gray-100 border-0 rounded-[8px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Lọc theo trang trại"
              value={selectedFarm || "all"}
              onChange={(e) => onFarmChange?.(e.target.value)}
            >
              {(farmOptions || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="text-[11px] font-semibold text-gray-600 bg-gray-100 border-0 rounded-[8px] px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Lọc theo khu vực"
              value={selectedZone || "all"}
              onChange={(e) => onZoneChange?.(e.target.value)}
            >
              {(zoneOptions || []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[8px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label="Làm mới bản đồ nhiệt"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-2 overflow-x-auto" style={{ padding: "0 2px" }}>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] whitespace-nowrap">An toàn {summaryCounts.healthy}</span>
          <span className="text-[11px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-[4px] whitespace-nowrap">Cần theo dõi {summaryCounts.monitor}</span>
          <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-[4px] whitespace-nowrap">Nguy cơ cao {summaryCounts.diseased}</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <HeatmapGrid sections={sections} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2" style={{ paddingTop: "6px", borderTop: "1px solid #EEF2F7", marginTop: "4px" }}>
          <div className="flex items-center flex-wrap" style={{ gap: "12px" }}>
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center" style={{ gap: "4px" }}>
                <div className={`w-2.5 h-2.5 rounded-[3px] ${item.color}`} aria-hidden="true" />
                <span className="text-[12px] font-bold text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="text-[12px] text-gray-400 font-semibold whitespace-nowrap">
            Cập nhật {lastUpdated} · Thời gian thực
          </div>
        </div>
      </div>
    </Card>
  );
}
