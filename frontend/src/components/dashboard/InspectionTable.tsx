import { memo } from "react";
import { useNavigate } from "react-router-dom";

export interface InspectionRow {
  id: string;
  time: string;
  treeCode: string;
  farm: string;
  zone: string;
  disease: string;
  risk: number;
  inspector: string;
  status: string;
  action: string;
}

interface InspectionTableProps {
  data: InspectionRow[];
}

function riskBadge(score: number): string {
  if (score >= 90) return "bg-red-100 text-red-700";
  if (score >= 80) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

function actionBadge(action: string): string {
  if (action === "Inspect Today") return "bg-red-100 text-red-700";
  if (action === "Monitor") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-700";
  if (s === "in_progress" || s === "in progress") return "bg-blue-100 text-blue-700";
  if (s === "pending") return "bg-yellow-100 text-yellow-700";
  if (s === "cancelled") return "bg-gray-100 text-gray-500";
  if (s === "confirmed") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-[13px] font-semibold text-gray-400">No inspections found</p>
    </div>
  );
}

function InspectionTableInner({ data }: InspectionTableProps) {
  const navigate = useNavigate();

  if (data.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto" role="table" aria-label="Inspection records">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 sticky top-0 bg-white z-10">
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[60px]">Time</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[80px]">Tree Code</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[90px]">Farm</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[80px]">Zone</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[90px]">Disease</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[55px]">Risk %</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[80px]">Inspector</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[75px]">Status</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-2 px-1 w-[85px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowBg = row.risk >= 90 ? "bg-red-50" : row.risk >= 80 ? "bg-amber-50" : "";
            const treeColor = row.risk >= 90 ? "text-red-700" : "text-gray-800";
            return (
              <tr
                key={row.id}
                className={`border-b border-gray-50 hover:brightness-95 transition-all duration-200 cursor-pointer ${rowBg}`}
                onClick={() => navigate(`/inspections?search=${encodeURIComponent(row.treeCode)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/inspections?search=${encodeURIComponent(row.treeCode)}`); }}
              >
                <td className="text-[13px] text-gray-500 whitespace-nowrap px-1 py-1.5">{row.time}</td>
                <td className={`text-[13px] font-semibold whitespace-nowrap px-1 py-1.5 ${treeColor}`}>{row.treeCode}</td>
                <td className="text-[13px] text-gray-600 whitespace-nowrap px-1 py-1.5">{row.farm}</td>
                <td className="text-[13px] text-gray-600 whitespace-nowrap px-1 py-1.5">{row.zone}</td>
                <td className="text-[13px] text-gray-600 whitespace-nowrap px-1 py-1.5">{row.disease}</td>
                <td className="px-1 py-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${riskBadge(row.risk)}`}>
                    {row.risk}%
                  </span>
                </td>
                <td className="text-[13px] text-gray-600 whitespace-nowrap px-1 py-1.5">{row.inspector}</td>
                <td className="px-1 py-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-1 py-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${actionBadge(row.action)}`}>
                    {row.action}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const InspectionTable = memo(InspectionTableInner);
export default InspectionTable;
