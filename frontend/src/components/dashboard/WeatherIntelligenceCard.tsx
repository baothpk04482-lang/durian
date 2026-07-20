import { CloudRain, Droplets, MapPin, Thermometer, Wind, Clock } from "lucide-react";
import Card from "./Shared/Card";

const LOCATION = "Buôn Ma Thuột, Đắk Lắk";

function formatTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
}

const metrics = [
  { icon: Thermometer, value: "-- °C", label: "Nhiệt độ", color: "text-orange-600", bg: "bg-orange-50" },
  { icon: Droplets, value: "-- %", label: "Độ ẩm", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: CloudRain, value: "-- mm", label: "Lượng mưa", color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: Wind, value: "-- km/h", label: "Tốc độ gió", color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function WeatherIntelligenceCard() {
  const lastUpdated = formatTimestamp();

  return (
    <Card className="flex flex-col" padding={false} style={{ height: "100%" }}>
      <div className="flex flex-col p-3" style={{ gap: "6px" }}>
        {/* Title */}
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">🌦 Thời tiết thông minh</h3>
            <span className="text-[11px] text-gray-500 font-medium">Theo dõi điều kiện thời tiết và nguy cơ bệnh.</span>
          </div>
        </div>

        {/* Location & Last Updated */}
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">{LOCATION}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>Cập nhật {lastUpdated}</span>
          </div>
        </div>

        {/* 4 Weather Metrics — compact */}
        <div className="grid grid-cols-2" style={{ gap: "6px" }}>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`rounded-[10px] px-2.5 py-2 flex items-center gap-2 ${m.bg}`}
                style={{ border: "1px solid rgba(0,0,0,0.04)" }}
              >
                <Icon className={`w-4 h-4 ${m.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <span className={`text-[15px] font-bold ${m.color} leading-none block`}>{m.value}</span>
                  <span className="text-[10px] text-gray-500">{m.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col" style={{ gap: "2px" }}>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 w-fit">
              ⏳ Chưa kết nối Weather API
            </span>
            <span className="text-[10px] text-gray-400 leading-snug">
              Dữ liệu thời tiết sẽ hiển thị sau khi tích hợp Weather API.
            </span>
          </div>
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-gray-100 text-gray-400 cursor-not-allowed flex-shrink-0"
          >
            Đang phát triển
          </button>
        </div>
      </div>
    </Card>
  );
}
