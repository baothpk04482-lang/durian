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
  if (score >= 90) return "Khám";
  if (score >= 80) return "Theo dõi";
  return "Xem xét";
}

function generateAiSummary(
  _farmStatus: string,
  _alertHigh: number,
  _kpiDiseased: number,
  _kpiHealthy: number,
  _kpiMonitoring: number,
): string[] {
  const lines: string[] = [];
  lines.push("Báo cáo hệ thống ghi nhận các khu vực có Risk Index ở mức cao.");
  lines.push("Một số khu vực cần ưu tiên kiểm tra nhằm giảm nguy cơ lây lan.");
  lines.push("Khuyến nghị phân bổ nguồn lực theo mức độ rủi ro của từng khu vực.");
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
    recs.push("Kiểm tra cây nguy cơ cao ngay lập tức.");
  }
  if (kpiHealthy < kpiDiseased) {
    recs.push("Cần kiểm soát sự lây lan của bệnh.");
  }
  if (recs.length === 0) {
    recs.push("Tiếp tục lịch kiểm tra định kỳ.");
  }
  return recs.slice(0, 3);
}

const QUICK_CHIPS = [
  { label: "Dự báo 7 ngày tới", text: "Dự báo nguy cơ bệnh trong 7 ngày tới" },
  { label: "Phân tích bệnh", text: "Phân tích mô hình bệnh hiện tại" },
  { label: "Dự báo sản lượng", text: "Ước tính tác động sản lượng từ cây bệnh" },
  { label: "Tối ưu hóa chi phí", text: "Tính toán chi phí điều trị ước tính" },
  { label: "Kế hoạch nguồn lực", text: "Ước tính nhu cầu nguồn lực" },
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

  const fungicideL = (highRiskCount * 0.04).toFixed(1);
  const stickerL = (highRiskCount * 0.01).toFixed(1);
  const waterL = (highRiskCount * 12.5).toFixed(0);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatMessage("Trợ lý AI Nông nghiệp sẽ có trong Bản phát hành 2.");
    setChatInput("");
  };

  const handleChipClick = (text: string) => {
    setChatInput(text);
  };

  return (
    <Card className="flex flex-col overflow-hidden" style={{ height: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[18px]" aria-hidden="true">🤖</span>
        <div>
          <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Trung tâm Phân tích AI</h3>
          <p className="text-[11px] text-gray-400 font-medium">Hỗ trợ phân tích và điều hành hệ thống</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* 1. AI Summary */}
        <div className="bg-emerald-50 rounded-[10px] px-3 py-2">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.5px] block mb-1">Báo cáo hệ thống</span>
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
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Phân tích rủi ro</span>
            <span className="text-[10px] text-gray-400">Top 5</span>
          </div>
          {priorityTrees.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-2">Không tìm thấy cây ưu tiên.</p>
          ) : (
            <table className="w-full border-collapse" role="table" aria-label="Cây ưu tiên">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1 pr-1">Cây</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1 pr-1">Rủi ro</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1">Trạng thái</th>
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
                        aria-label={`Xem cây ${row.treeId}`}
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
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Đề xuất vận hành</span>
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
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1">Dự toán nguồn lực</span>
          <span className="text-[9px] text-gray-400 block mb-1">Ước tính từ cây nguy cơ cao</span>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-blue-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-blue-700 block">{fungicideL} L</span>
              <span className="text-[9px] font-bold text-blue-500 block leading-tight">Thuốc phòng nấm</span>
            </div>
            <div className="bg-purple-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-purple-700 block">{stickerL} L</span>
              <span className="text-[9px] font-bold text-purple-500 block leading-tight">Chất bám dính</span>
            </div>
            <div className="bg-cyan-50 rounded-[6px] px-2 py-1.5 text-center">
              <span className="text-[13px] font-bold text-cyan-700 block">{waterL} L</span>
              <span className="text-[9px] font-bold text-cyan-500 block leading-tight">Nước</span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* 5. AI Chat */}
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1">Trung tâm Phân tích AI</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Nhập yêu cầu phân tích hoặc câu hỏi về vận hành..."
              className="flex-1 px-2.5 py-1.5 rounded-[8px] border border-gray-200 text-[11px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
            />
            <button
              type="button"
              onClick={handleSend}
              className="p-1.5 rounded-[8px] bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-label="Gửi tin nhắn"
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
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-1.5">Tác vụ điều hành</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => navigate("/report/yield")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dự báo rủi ro</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/diseases")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Phân tích dịch bệnh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-amber-600 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Báo cáo hệ thống</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/inspections")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors duration-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Điều phối kiểm tra</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
