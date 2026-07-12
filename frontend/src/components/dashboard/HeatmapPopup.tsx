interface HeatmapPopupProps {
  treeId: string;
  farm?: string;
  zone?: string;
  disease?: string;
  confidence?: number;
  status?: string;
  riskScore: number;
}

export default function HeatmapPopup({ treeId, farm, zone, disease, confidence, status, riskScore }: HeatmapPopupProps) {
  const scoreColor = riskScore <= 30 ? "text-emerald-600" : riskScore <= 60 ? "text-amber-500" : riskScore <= 80 ? "text-orange-500" : "text-red-500";
  const scoreBg = riskScore <= 30 ? "bg-emerald-50" : riskScore <= 60 ? "bg-amber-50" : riskScore <= 80 ? "bg-orange-50" : "bg-red-50";
  const statusColor = status === "Healthy" ? "text-emerald-600 bg-emerald-50" : status === "Monitoring" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  const recommendation = status === "Healthy" ? "Healthy" : status === "Monitoring" ? "Monitor this week" : "Inspect today";
  const recColor = status === "Healthy" ? "text-emerald-600 bg-emerald-50" : status === "Monitoring" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  return (
    <div className="bg-white border border-gray-200 rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-3 w-[240px] box-border overflow-hidden" role="dialog" aria-label={`Tree ${treeId} details`}>
      <div className="text-[14px] font-bold text-gray-900 mb-2">{treeId}</div>
      <div className="space-y-1.5">
        {farm && (
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">Farm</span>
            <span className="font-semibold text-gray-800">{farm}</span>
          </div>
        )}
        {zone && (
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">Zone</span>
            <span className="font-semibold text-gray-800">{zone}</span>
          </div>
        )}
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">Disease</span>
          <span className="font-semibold text-gray-800">{disease || "N/A"}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-bold ${scoreColor} ${scoreBg} px-1.5 py-0.5 rounded-[4px]`}>{confidence !== undefined ? `${confidence}%` : "N/A"}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">Status</span>
          <span className={`font-bold ${statusColor} px-1.5 py-0.5 rounded-[4px]`}>{status || "Healthy"}</span>
        </div>
        <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-500">Recommendation</span>
          <span className={`text-[11px] font-bold ${recColor} px-2 py-0.5 rounded-[4px]`}>{recommendation}</span>
        </div>
      </div>
    </div>
  );
}
