import { useState, useCallback, useMemo } from "react";
import { CloudRain, Droplets, Thermometer, Wind, AlertTriangle, RefreshCw, Lightbulb } from "lucide-react";
import Card from "./Shared/Card";
import SectionTitle from "./Shared/SectionTitle";
import WeatherMetric from "./WeatherMetric";

function generateMockData(seed: number) {
  const baseTemp = 28 + (seed % 6);
  const baseHum = 68 + (seed % 30);
  const baseRain = 1 + (seed % 20);
  const baseWind = 5 + (seed % 10);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    temp: `${baseTemp}°C`,
    humidity: `${baseHum}%`,
    wind: `${baseWind} km/h`,
    rain: `${baseRain} mm`,
    chartData: days.map((day, i) => ({
      day,
      rain: Math.max(0, baseRain + ((seed * (i + 1)) % 8) - 2),
      humidity: Math.min(100, Math.max(40, baseHum + ((seed * (i + 1)) % 12) - 4)),
      wind: Math.max(0, baseWind + ((seed * (i + 1)) % 6) - 2),
    })),
  };
}

function parseNumeric(value: string): number {
  return parseFloat(value.replace(/[^0-9.\-]/g, "")) || 0;
}

function calculateDiseaseRisk(mock: ReturnType<typeof generateMockData>): "LOW" | "MODERATE" | "HIGH" {
  const humidity = parseNumeric(mock.humidity);
  const rainfall = parseNumeric(mock.rain);

  if (humidity >= 90 && rainfall >= 20) return "HIGH";
  if (humidity >= 95) return "HIGH";
  if (humidity >= 80 || rainfall >= 10) return "MODERATE";
  return "LOW";
}

const RISK_RECOMMENDATIONS: Record<"LOW" | "MODERATE" | "HIGH", readonly string[]> = {
  HIGH: [
    "Kiểm tra cây ngay lập tức",
    "Giảm tưới tiêu",
    "Phun thuốc trừ nấm phòng ngừa",
  ],
  MODERATE: [
    "Theo dõi độ ẩm",
    "Kiểm tra mỗi 3 ngày",
    "Kiểm tra triệu chứng lá",
  ],
  LOW: [
    "Không cần hành động ngay",
    "Kiểm tra hàng tuần",
    "Tiếp tục tưới tiêu bình thường",
  ],
} as const;

const RISK_BANNER = {
  HIGH: { bg: "bg-red-50 border-red-200", text: "text-red-800", label: "NGUY CƠ BỆNH CAO" },
  MODERATE: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", label: "NGUY CƠ BỆNH TRUNG BÌNH" },
  LOW: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "NGUY CƠ BỆNH THẤP" },
};

function getRiskReason(mock: ReturnType<typeof generateMockData>, risk: "LOW" | "MODERATE" | "HIGH"): string {
  const humidity = parseNumeric(mock.humidity);
  const rainfall = parseNumeric(mock.rain);
  if (risk === "HIGH") {
    return `Độ ẩm ${humidity}% và lượng mưa ${rainfall} mm vượt ngưỡng bệnh.`;
  }
  if (risk === "MODERATE") {
    return `Độ ẩm cao hoặc lượng mưa ở mức trung bình.`;
  }
  return `Điều kiện thời tiết hiện tại không thuận lợi cho sự lây lan của bệnh.`;
}

export default function WeatherForecastCard() {
  const [seed, setSeed] = useState(42);

  const mockData = useMemo(() => generateMockData(seed), [seed]);
  const diseaseRisk = useMemo(() => calculateDiseaseRisk(mockData), [mockData]);
  const recommendations = RISK_RECOMMENDATIONS[diseaseRisk];
  const riskReason = getRiskReason(mockData, diseaseRisk);
  const banner = RISK_BANNER[diseaseRisk];

  const handleRefresh = useCallback(() => {
    setSeed((s) => s + 7);
  }, []);

  return (
    <Card className="flex flex-col" padding={false} style={{ height: "100%" }}>
      <div className="flex flex-col gap-4 p-5 pb-6">
        <SectionTitle
          icon={<CloudRain className="w-5 h-5 text-blue-500" />}
          title="Dự báo nguy cơ bệnh"
          size="section"
          subtitle="Đánh giá từ điều kiện thời tiết"
          actions={
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Làm mới dữ liệu thời tiết"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-2">
          <WeatherMetric icon={<Thermometer className="w-5 h-5 text-orange-600" />} value={mockData.temp} label="Nhiệt độ" color="text-orange-700" bg="bg-orange-100" />
          <WeatherMetric icon={<Droplets className="w-5 h-5 text-blue-600" />} value={mockData.humidity} label="Độ ẩm" color="text-blue-700" bg="bg-blue-100" />
          <WeatherMetric icon={<Wind className="w-5 h-5 text-indigo-600" />} value={mockData.wind} label="Tốc độ gió" color="text-indigo-700" bg="bg-indigo-100" />
          <WeatherMetric icon={<CloudRain className="w-5 h-5 text-cyan-600" />} value={mockData.rain} label="Lượng mưa" color="text-cyan-700" bg="bg-cyan-100" />
        </div>

        <div className={`border rounded-[12px] px-4 py-3 ${banner.bg} ${banner.text}`} role="alert" aria-live="polite">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-black tracking-tight">{banner.label}</span>
          </div>
          <p className="text-[12px] leading-relaxed opacity-90">
            {riskReason}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-[12px] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.5px]">Khuyến nghị AI</span>
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" aria-hidden="true" />
                <span className="leading-snug">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
