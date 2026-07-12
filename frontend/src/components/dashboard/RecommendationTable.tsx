interface RecommendationRow {
  id: number;
  treeId: string;
  variety: string;
  age: number;
  riskScore: number;
  status: string;
}

interface RecommendationTableProps {
  data: RecommendationRow[];
}

function riskColor(score: number): string {
  if (score <= 30) return "bg-emerald-100 text-emerald-700";
  if (score <= 60) return "bg-yellow-100 text-yellow-700";
  if (score <= 80) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

export default function RecommendationTable({ data }: RecommendationTableProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Priority Trees</span>
        <span className="text-[10px] text-gray-400">{data.length} items</span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5 w-5">#</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5">Tree ID</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5">Variety</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5">Age</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5">Risk Score</th>
            <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] pb-1.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-1.5 text-[12px] text-gray-400">{row.id}</td>
              <td className="py-1.5 text-[12px] font-semibold text-gray-800">{row.treeId}</td>
              <td className="py-1.5 text-[12px] text-gray-600">{row.variety}</td>
              <td className="py-1.5 text-[12px] text-gray-600">{row.age}yr</td>
              <td className="py-1.5">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${riskColor(row.riskScore)}`}>
                  {row.riskScore}%
                </span>
              </td>
              <td className="py-1.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  row.status === "Healthy" ? "bg-emerald-100 text-emerald-700" :
                  row.status === "Warning" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
