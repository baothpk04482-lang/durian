import { ClipboardCheck, BrainCircuit, Bell, Clock, AlertCircle } from "lucide-react";
import Card from "./Shared/Card";
import SectionTitle from "./Shared/SectionTitle";

export interface SystemOverviewData {
  inspection_today: number;
  ai_detection_today: number;
  new_alerts_today: number;
  pending_review: number;
  updated_at: string;
}

interface SystemOverviewCardProps {
  data: SystemOverviewData;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

const METRICS = [
  { key: "inspection_today" as const, icon: ClipboardCheck, label: "Khám hôm nay", color: "text-blue-600", bg: "bg-blue-100" },
  { key: "ai_detection_today" as const, icon: BrainCircuit, label: "AI phát hiện", color: "text-violet-600", bg: "bg-violet-100" },
  { key: "new_alerts_today" as const, icon: Bell, label: "Cảnh báo mới", color: "text-amber-600", bg: "bg-amber-100" },
  { key: "pending_review" as const, icon: AlertCircle, label: "Chờ xử lý", color: "text-red-600", bg: "bg-red-100" },
] as const;

export default function SystemOverviewCard({ data }: SystemOverviewCardProps) {
  return (
    <Card className="flex flex-col" padding={false} style={{ height: "100%" }}>
      <div className="flex flex-col gap-4 p-5 pb-6">
        <SectionTitle
          icon={<ClipboardCheck className="w-5 h-5 text-blue-500" />}
          title="Tổng quan hệ thống"
          size="section"
          subtitle="Thống kê hoạt động hôm nay"
        />

        <div className="grid grid-cols-2 gap-2">
          {METRICS.map(({ key, icon: Icon, label, color, bg }) => (
            <div key={key} className="flex items-center gap-3 rounded-[12px] bg-gray-50 border border-gray-100 px-3 py-3">
              <div className={`w-9 h-9 rounded-[10px] ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[20px] font-bold text-gray-900 leading-tight">{data[key].toLocaleString()}</p>
                <p className="text-[11px] text-gray-500 font-medium truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Cập nhật lúc {formatTime(data.updated_at)}</span>
        </div>
      </div>
    </Card>
  );
}
