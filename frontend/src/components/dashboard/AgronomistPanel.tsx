import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, TrendingUp, Activity, FileText, Search, AlertTriangle, CloudRain, TreePine } from "lucide-react";
import Card from "./Shared/Card";

interface RecommendationRow {
  id: number;
  treeId: string;
  riskScore: number;
  status: string;
  farm: string;
  zone: string;
  disease: string;
}

interface AgronomistPanelProps {
  priorityTrees: RecommendationRow[];
  farmStatus: string;
  kpiHealthyCount: number;
  kpiMonitoringCount: number;
  kpiDiseasedCount: number;
  alertCounts: { high: number; medium: number; low: number };
  highRiskCount: number;
}

function riskBadge(score: number): string {
  if (score >= 90) return "bg-red-100 text-red-700";
  if (score >= 80) return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
}

function actionLabel(score: number): string {
  if (score >= 90) return "Inspect";
  if (score >= 80) return "Monitor";
  return "Review";
}

function generateAiSummary(
  farmStatus: string,
  alertHigh: number,
  kpiDiseased: number,
  kpiHealthy: number,
  kpiMonitoring: number,
): string[] {
  const lines: string[] = [];
  if (farmStatus === "Critical") {
    lines.push("Critical farm condition detected.");
  }
  if (alertHigh > 50) {
    lines.push("Multiple high-risk trees require immediate attention.");
  }
  if (kpiDiseased > kpiHealthy) {
    lines.push("Disease spread should be contained.");
  }
  if (kpiMonitoring > kpiHealthy && kpiMonitoring > kpiDiseased) {
    lines.push("Monitoring cases outweigh other statuses.");
  }
  if (lines.length === 0) {
    lines.push("Farm systems operating within normal parameters.");
  }
  return lines.slice(0, 3);
}

function generateStrategicRecs(
  priorityTrees: RecommendationRow[],
  kpiHealthy: number,
  kpiDiseased: number,
): string[] {
  const recs: string[] = [];
  const hasHighRisk = priorityTrees.some((t) => t.riskScore >= 90);
  if (hasHighRisk) {
    recs.push("Inspect high-risk trees immediately.");
  }
  if (kpiHealthy < kpiDiseased) {
    recs.push("Disease spread should be contained.");
  }
  if (recs.length === 0) {
    recs.push("Continue regular monitoring schedule.");
  }
  return recs.slice(0, 3);
}

const QUICK_CHIPS = [
  { label: "Forecast next 7 days", text: "Forecast disease risk for next 7 days" },
  { label: "Disease analysis", text: "Analyze current disease patterns" },
  { label: "Yield prediction", text: "Estimate yield impact from diseased trees" },
  { label: "Cost optimization", text: "Calculate treatment cost estimate" },
  { label: "Resource planning", text: "Estimate resource requirements" },
];

export default function AgronomistPanel({
  priorityTrees, farmStatus,
  kpiHealthyCount, kpiMonitoringCount, kpiDiseasedCount, alertCounts, highRiskCount,
}: AgronomistPanelProps) {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  const aiSummary = generateAiSummary(farmStatus, alertCounts.high, kpiDiseasedCount, kpiHealthyCount, kpiMonitoringCount);
  const strategicRecs = generateStrategicRecs(priorityTrees, kpiHealthyCount, kpiDiseasedCount);

  const displayConfidence = (() => {
    if (priorityTrees.length > 0) {
      const maxRisk = Math.max(...priorityTrees.map((t) => t.riskScore));
      if (maxRisk > 0) return maxRisk;
      const avgRisk = Math.round(priorityTrees.reduce((s, t) => s + t.riskScore, 0) / priorityTrees.length);
      if (avgRisk > 0) return avgRisk;
    }
    return 0;
  })();

  const fungicideL = (highRiskCount * 0.04).toFixed(1);
  const stickerL = (highRiskCount * 0.01).toFixed(1);
  const waterL = (highRiskCount * 12.5).toFixed(0);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatMessage("AI Agronomist will be available in Release 2.");
    setChatInput("");
  };

  const handleChipClick = (text: string) => {
    setChatInput(text);
  };

  return (
    <Card className="flex flex-col overflow-hidden" style={{ height: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[18px]" aria-hidden="true">🤖</span>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">AI Agronomist</h3>
            <p className="text-[11px] text-gray-400 font-medium">Strategic Farm Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span className="text-[10px] font-bold text-emerald-700">
            {displayConfidence > 0 ? `${displayConfidence}% AI Confidence` : "-- AI Confidence"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* 1. AI Summary */}
        <div className="bg-emerald-50 rounded-[10px] px-3 py-2">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.5px] block mb-1">AI Summary</span>
          <ul className="space-y-0.5">
            {aiSummary.map((line, i) => {
              let Icon = Sparkles;
              let iconClass = "text-emerald-500";
              if (line.includes("Critical") || line.includes("high-risk") || line.includes("immediate")) {
                Icon = AlertTriangle;
                iconClass = "text-amber-500";
              } else if (line.includes("weather") || line.includes("rain") || line.includes("humidity")) {
                Icon = CloudRain;
                iconClass = "text-blue-500";
              } else if (line.includes("Disease") || line.includes("disease") || line.includes("spread")) {
                Icon = TreePine;
                iconClass = "text-red-500";
              }
              return (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-snug">
                  <Icon className={`w-3 h-3 ${iconClass} mt-0.5 flex-shrink-0`} aria-hidden="true" />
                  <span>{line}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* 2. AI Analysis — Top Priority Trees */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">AI Analysis</span>
            <span className="text-[10px] text-gray-400">Top 5</span>
          </div>
          {priorityTrees.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-2">No priority trees found.</p>
          ) : (
            <table className="w-full border-collapse" role="table" aria-label="Priority trees">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1 pr-1">Tree</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1 pr-1">Risk</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {priorityTrees.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-1 pr-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/trees?search=${encodeURIComponent(row.treeId)}`)}
                        className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded"
                        aria-label={`View tree ${row.treeId}`}
                      >
                        {row.treeId}
                      </button>
                    </td>
                    <td className="py-1 pr-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${riskBadge(row.riskScore)}`}>
                        {row.riskScore}%
                      </span>
                    </td>
                    <td className="py-1">
                      <span className="text-[11px] font-semibold text-gray-600">{actionLabel(row.riskScore)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* 3. Strategic Recommendations */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Strategic Recommendations</span>
          </div>
          <ul className="space-y-0.5">
            {strategicRecs.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* 4. Resource Estimation */}
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1">Resource Estimation</span>
          <span className="text-[9px] text-gray-400 block mb-1">Estimated from High Risk Trees</span>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-blue-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-blue-700 block">{fungicideL} L</span>
              <span className="text-[9px] font-bold text-blue-500 block leading-tight">Fungicide A</span>
            </div>
            <div className="bg-purple-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-purple-700 block">{stickerL} L</span>
              <span className="text-[9px] font-bold text-purple-500 block leading-tight">Sticker</span>
            </div>
            <div className="bg-cyan-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-cyan-700 block">{waterL} L</span>
              <span className="text-[9px] font-bold text-cyan-500 block leading-tight">Water</span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* 5. AI Chat */}
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1">AI Chat</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask about disease, weather or farm management..."
              className="flex-1 px-2.5 py-1.5 rounded-[8px] border border-gray-200 text-[11px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={handleSend}
              className="p-1.5 rounded-[8px] bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          {chatMessage && (
            <p className="text-[11px] text-gray-500 mt-1 italic">{chatMessage}</p>
          )}
        </div>

        {/* 6. Quick Suggestions */}
        <div className="flex flex-wrap gap-1">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-100 mt-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1.5">Quick Actions</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => navigate("/report/yield")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Forecast</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/diseases")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Disease</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-amber-600 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reports</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/inspections")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Inspection</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
