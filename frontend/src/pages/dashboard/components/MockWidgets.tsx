import { CloudSunRain, Bot, AlertTriangle, TrendingUp, ShieldCheck, HelpCircle, MessageSquare } from "lucide-react";

// Dedicated mock objects (Mock Data Policy)
const MOCK_WEATHER_DATA = {
  temp: "31°C",
  humidity: "84%",
  condition: "Heavy Thunderstorm Forecast",
};

const MOCK_AI_AGRONOMIST_DATA = [
  { id: 1, message: "Moisture levels high. Scale back watering systems in Zone A." },
  { id: 2, message: "Risk of Phytophthora root rot has increased in Zone B due to soil saturation." },
];

const MOCK_HEATMAP_GRID = [
  { zone: "A1", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "A2", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "A3", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "B1", status: "High Risk", color: "bg-red-500" },
  { zone: "B2", status: "Moderate", color: "bg-amber-500" },
  { zone: "B3", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "C1", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "C2", status: "Low Risk", color: "bg-emerald-500" },
  { zone: "C3", status: "Low Risk", color: "bg-emerald-500" },
];

const MOCK_DISEASE_FORECAST = [
  { id: 1, disease: "Phytophthora", probability: "74%", trend: "Increasing" },
  { id: 2, disease: "Leaf Spot", probability: "35%", trend: "Stable" },
  { id: 3, disease: "Powdery Mildew", probability: "12%", trend: "Decreasing" },
];

const MOCK_RISK_SCORE = {
  score: 68,
  status: "Moderate Risk Level",
  color: "text-amber-600",
};

const MOCK_YIELD_PREDICTION = {
  tonnage: "148.6 Tons",
  subtitle: "Target harvest season Q3 2026",
  confidence: "82% Confidence interval",
};

const MOCK_RECOMMENDATION_LIST = [
  { id: 1, task: "Apply trace minerals in Zone A3" },
  { id: 2, task: "Schedule preventive spraying in Zone B1" },
  { id: 3, task: "Prune lower branches in Zone B2 to improve airflow" },
];

const MOCK_CHAT_MESSAGES = [
  { id: 1, sender: "user", text: "Is there any urgent action required today?" },
  { id: 2, sender: "ai", text: "Yes! High risk detected in Zone B1. Apply preventive spraying to limit leaf disease spread." },
];

interface WidgetCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function WidgetCard({ title, icon: Icon, children }: WidgetCardProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      style={{ minHeight: "220px" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

export default function MockWidgets() {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-4">Release 2 Placeholders (Mock Only)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weather */}
        <WidgetCard title="Weather Forecast" icon={CloudSunRain}>
          <div className="flex flex-col justify-center h-full">
            <span className="text-3xl font-extrabold text-gray-900">{MOCK_WEATHER_DATA.temp}</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-1">HUMIDITY: {MOCK_WEATHER_DATA.humidity}</span>
            <span className="text-xs font-semibold text-amber-600 mt-2">{MOCK_WEATHER_DATA.condition}</span>
          </div>
        </WidgetCard>

        {/* AI Agronomist */}
        <WidgetCard title="AI Agronomist Insights" icon={Bot}>
          <div className="space-y-2 text-xs">
            {MOCK_AI_AGRONOMIST_DATA.map((insight) => (
              <div key={insight.id} className="p-2 bg-gray-50 rounded-[12px] border border-gray-100 text-gray-600">
                {insight.message}
              </div>
            ))}
          </div>
        </WidgetCard>

        {/* Heatmap Grid */}
        <WidgetCard title="Risk Heatmap" icon={AlertTriangle}>
          <div className="grid grid-cols-3 gap-1.5 h-full py-1">
            {MOCK_HEATMAP_GRID.map((cell, index) => (
              <div
                key={index}
                className={`${cell.color} rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                title={`${cell.zone}: ${cell.status}`}
              >
                {cell.zone}
              </div>
            ))}
          </div>
        </WidgetCard>

        {/* Disease Forecast */}
        <WidgetCard title="Disease Forecast" icon={TrendingUp}>
          <div className="space-y-2 text-xs">
            {MOCK_DISEASE_FORECAST.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                <span className="font-semibold text-gray-700">{item.disease}</span>
                <div className="text-right">
                  <span className="text-gray-900 font-bold">{item.probability}</span>
                  <span className={`block text-[9px] font-bold ${item.trend === "Increasing" ? "text-red-500" : item.trend === "Stable" ? "text-gray-400" : "text-emerald-500"}`}>
                    {item.trend.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </WidgetCard>

        {/* Risk Score */}
        <WidgetCard title="Current Risk Index" icon={ShieldCheck}>
          <div className="flex flex-col justify-center h-full">
            <span className="text-4xl font-extrabold text-emerald-800">{MOCK_RISK_SCORE.score}%</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">Overall farm threshold</span>
            <span className="text-xs font-semibold text-amber-600 mt-2">{MOCK_RISK_SCORE.status}</span>
          </div>
        </WidgetCard>

        {/* Yield Prediction */}
        <WidgetCard title="Yield Prediction" icon={TrendingUp}>
          <div className="flex flex-col justify-center h-full">
            <span className="text-2xl font-extrabold text-gray-900">{MOCK_YIELD_PREDICTION.tonnage}</span>
            <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">{MOCK_YIELD_PREDICTION.subtitle}</span>
            <span className="text-xs font-semibold text-emerald-600 mt-2">{MOCK_YIELD_PREDICTION.confidence}</span>
          </div>
        </WidgetCard>

        {/* Recommendation */}
        <WidgetCard title="Recommendations" icon={HelpCircle}>
          <div className="space-y-2 text-xs">
            {MOCK_RECOMMENDATION_LIST.map((rec) => (
              <div key={rec.id} className="flex items-start gap-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span className="text-gray-600">{rec.task}</span>
              </div>
            ))}
          </div>
        </WidgetCard>

        {/* AI Chat */}
        <WidgetCard title="DGA AI Assistant" icon={MessageSquare}>
          <div className="flex flex-col h-full justify-between gap-2 text-[10px]">
            <div className="space-y-1 overflow-y-auto max-h-[100px] pr-1">
              {MOCK_CHAT_MESSAGES.map((msg) => (
                <div key={msg.id} className={`p-1.5 rounded-[12px] max-w-[85%] ${msg.sender === "user" ? "bg-emerald-50 text-emerald-900 self-end ml-auto border border-emerald-100" : "bg-gray-100 text-gray-800"}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-1.5">
              <input
                type="text"
                disabled
                placeholder="AI Chat Offline"
                className="w-full bg-gray-50 border border-gray-100 rounded-[12px] px-2 py-1 text-gray-400 cursor-not-allowed focus:outline-none text-[10px]"
              />
            </div>
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}
