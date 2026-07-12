import { Trees, ShieldCheck, Heart, AlertTriangle, TrendingUp } from "lucide-react";
import KPICard from "./KPICard";

interface KPISectionProps {
  totalTrees: number;
  newTreesThisMonth: number;
  healthyPercent: number;
  farmArea: string;
  farmCount: number;
  zoneCount: number;
  emergencyCount: number;
}

function HealthSparkline() {
  const points = [30, 35, 42, 50, 58, 65, 72];
  const w = 56, h = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M${coords.join(" L")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KPISection({
  totalTrees, newTreesThisMonth, healthyPercent,
  farmArea, farmCount, zoneCount, emergencyCount,
}: KPISectionProps) {
  const healthStatus = healthyPercent >= 80 ? "Healthy" : healthyPercent >= 60 ? "Attention Required" : "Critical";

  return (
    <div className="grid grid-cols-5" style={{ gap: "20px" }}>
      <KPICard
        icon={<Trees className="w-7 h-7 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="TOTAL TREES"
        value={totalTrees.toLocaleString()}
        subtitleLine1={`+${newTreesThisMonth} ${newTreesThisMonth === 1 ? "Tree" : "Trees"} This Month`}
        subtitleLine2="Compared with previous month"
        valueColor="text-[#111827]"
      />
      <KPICard
        icon={<ShieldCheck className="w-7 h-7 text-emerald-600" />}
        iconBg="bg-amber-100"
        title="DIỆN TÍCH CANH TÁC"
        value={farmArea ? farmArea.split(" ")[0] : "0.0"}
        valueSuffix={farmArea ? farmArea.split(" ").slice(1).join(" ") : "ha"}
        subtitle={`${farmCount} Farms • ${zoneCount} Zones`}
      />
      <KPICard
        icon={<Heart className="w-7 h-7 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="CHỈ SỐ SỨC KHỎE HỆ THỐNG"
        value={`${healthyPercent}%`}
        subtitle={healthStatus}
        subtitleColor={healthyPercent >= 80 ? "#15803D" : healthyPercent >= 60 ? "#D97706" : "#DC2626"}
        valueColor="text-emerald-600"
        sparkline={<HealthSparkline />}
      />
      <KPICard
        icon={<AlertTriangle className="w-7 h-7 text-red-600" />}
        iconBg="bg-red-50"
        title="CẢNH BÁO KHẨN CẤP"
        value={String(emergencyCount)}
        subtitle="High Risk Trees (>80%)"
        valueColor="text-red-500"
      />
      <KPICard
        icon={<TrendingUp className="w-7 h-7 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="DỰ BÁO SẢN LƯỢNG"
        value="18.4"
        valueSuffix="t"
        subtitle="AI Forecast Pending"
        valueColor="text-emerald-600"
      />
    </div>
  );
}