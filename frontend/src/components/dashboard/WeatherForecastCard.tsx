import { useState, useCallback, useMemo } from "react";
import { CloudRain, Droplets, Thermometer, Wind, AlertTriangle, RefreshCw, Lightbulb } from "lucide-react";
import Card from "./Shared/Card";
import SectionTitle from "./Shared/SectionTitle";
import WeatherMetric from "./WeatherMetric";
import WeatherChart from "./WeatherChart";

const HOUR_OPTIONS = [
  { value: 24, label: "24 Hours" },
  { value: 48, label: "48 Hours" },
  { value: 72, label: "72 Hours" },
] as const;

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

function deriveDiseaseRisk(mock: ReturnType<typeof generateMockData>): "LOW" | "MEDIUM" | "HIGH" {
  const avgRain = mock.chartData.reduce((s, d) => s + d.rain, 0) / mock.chartData.length;
  const avgHum = mock.chartData.reduce((s, d) => s + d.humidity, 0) / mock.chartData.length;
  if (avgHum > 90 && avgRain > 10) return "HIGH";
  if (avgHum > 80) return "MEDIUM";
  return "LOW";
}

function generateRecommendations(mock: ReturnType<typeof generateMockData>, risk: "LOW" | "MEDIUM" | "HIGH"): string[] {
  const avgHum = mock.chartData.reduce((s, d) => s + d.humidity, 0) / mock.chartData.length;
  const avgRain = mock.chartData.reduce((s, d) => s + d.rain, 0) / mock.chartData.length;
  const recs: string[] = [];
  if (avgHum > 90) recs.push("High humidity detected.");
  if (avgRain > 10) recs.push("Continuous rainfall.");
  if (risk === "HIGH") recs.push("Inspect Zone B today.");
  else if (risk === "MEDIUM") recs.push("Monitor humidity levels closely.");
  else recs.push("No action required.");
  return recs.slice(0, 3);
}

const RISK_BANNER = {
  HIGH: { bg: "bg-red-50 border-red-200", text: "text-red-800", label: "HIGH DISEASE RISK" },
  MEDIUM: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", label: "MODERATE DISEASE RISK" },
  LOW: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "LOW DISEASE RISK" },
};

export default function WeatherForecastCard() {
  const [seed, setSeed] = useState(42);
  const [hours, setHours] = useState(72);

  const mockData = useMemo(() => generateMockData(seed), [seed]);
  const diseaseRisk = useMemo(() => deriveDiseaseRisk(mockData), [mockData]);
  const recommendations = useMemo(() => generateRecommendations(mockData, diseaseRisk), [mockData, diseaseRisk]);
  const banner = RISK_BANNER[diseaseRisk];

  const filteredChart = hours === 24 ? mockData.chartData.slice(0, 3) : hours === 48 ? mockData.chartData.slice(0, 5) : mockData.chartData;

  const handleRefresh = useCallback(() => {
    setSeed((s) => s + 7);
  }, []);

  return (
    <Card className="flex flex-col" padding={false} style={{ height: "100%" }}>
      <div className="flex flex-col flex-1 p-5">
        <SectionTitle
          icon={<CloudRain className="w-5 h-5 text-blue-500" />}
          title="WEATHER INTELLIGENCE"
          size="section"
          subtitle="Real-time Disease Risk Prediction"
          actions={
            <div className="flex items-center gap-2">
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="text-[12px] font-semibold text-gray-500 bg-gray-100 border-0 rounded-[8px] px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Forecast hours"
              >
                {HOUR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} ▼</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Refresh weather data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          }
        />

        <div style={{ flex: "3 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "8px" }}>
            <WeatherMetric icon={<Thermometer className="w-5 h-5 text-orange-600" />} value={mockData.temp} label="Temperature" color="text-orange-700" bg="bg-orange-100" />
            <WeatherMetric icon={<Droplets className="w-5 h-5 text-blue-600" />} value={mockData.humidity} label="Humidity" color="text-blue-700" bg="bg-blue-100" />
            <WeatherMetric icon={<Wind className="w-5 h-5 text-indigo-600" />} value={mockData.wind} label="Wind" color="text-indigo-700" bg="bg-indigo-100" />
            <WeatherMetric icon={<CloudRain className="w-5 h-5 text-cyan-600" />} value={mockData.rain} label="Rainfall" color="text-cyan-700" bg="bg-cyan-100" />
          </div>
        </div>

        <div style={{ flex: "4 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">{hours}-Hour Forecast</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <WeatherChart data={filteredChart} />
          </div>
        </div>

        <div className={`${banner.bg} border ${banner.text} rounded-[12px] px-4 py-3 mb-2`} role="alert" aria-live="polite">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-black tracking-tight">{banner.label}</span>
          </div>
          <div className="text-[12px] leading-relaxed opacity-90">
            Humidity {mockData.humidity} · Rain {mockData.rain} expected · Disease probability {diseaseRisk === "HIGH" ? "elevated" : diseaseRisk === "MEDIUM" ? "moderate" : "low"}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-[12px] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.5px]">AI Recommendation</span>
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
