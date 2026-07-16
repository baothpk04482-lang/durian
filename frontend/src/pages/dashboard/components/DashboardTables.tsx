// Dedicated mock data objects (Mock Data Policy)
import { formatDateTime } from "../../../utils/dateFormatter";
const RECENT_INSPECTIONS = [
  { id: "INS-0481", treeCode: "TR-0041", date: "2026-07-03", inspector: "John Smith", status: "Healthy" },
  { id: "INS-0480", treeCode: "TR-0158", date: "2026-07-03", inspector: "Emily Davis", status: "Warning" },
  { id: "INS-0479", treeCode: "TR-0244", date: "2026-07-02", inspector: "John Smith", status: "Healthy" },
  { id: "INS-0478", treeCode: "TR-0092", date: "2026-07-02", inspector: "Robert Lee", status: "Error" },
  { id: "INS-0477", treeCode: "TR-0511", date: "2026-07-01", inspector: "Emily Davis", status: "Healthy" },
];

const RECENT_DETECTION_RESULTS = [
  { id: "DET-0921", treeCode: "TR-0158", date: "2026-07-03", disease: "Phytophthora", confidence: "87%" },
  { id: "DET-0920", treeCode: "TR-0092", date: "2026-07-02", disease: "Leaf Spot", confidence: "64%" },
  { id: "DET-0919", treeCode: "TR-0881", date: "2026-07-02", disease: "Powdery Mildew", confidence: "91%" },
  { id: "DET-0918", treeCode: "TR-0158", date: "2026-07-01", disease: "Phytophthora", confidence: "78%" },
  { id: "DET-0917", treeCode: "TR-0451", date: "2026-06-30", disease: "Leaf Spot", confidence: "45%" },
];

const RECENT_DISEASE_HISTORY = [
  { id: "HIS-0312", treeCode: "TR-0158", date: "2026-07-03", disease: "Phytophthora", status: "Pending" },
  { id: "HIS-0311", treeCode: "TR-0092", date: "2026-07-02", disease: "Leaf Spot", status: "Resolved" },
  { id: "HIS-0310", treeCode: "TR-0244", date: "2026-06-28", disease: "Root Rot", status: "Resolved" },
  { id: "HIS-0309", treeCode: "TR-0881", date: "2026-06-25", disease: "Powdery Mildew", status: "Pending" },
  { id: "HIS-0308", treeCode: "TR-0512", date: "2026-06-20", disease: "Leaf Spot", status: "Resolved" },
];

interface TableCardProps {
  title: string;
  children: React.ReactNode;
}

function TableCard({ title, children }: TableCardProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
      style={{ height: "360px" }}
    >
      <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full">
        {children}
      </div>
    </div>
  );
}

export default function DashboardTables() {
  const getBadgeClass = (status: string) => {
    switch (status) {
      case "Healthy":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Warning":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Error":
        return "bg-red-50 text-red-700 border border-red-100";
      case "Resolved":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "Pending":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Table 1: Recent Inspections */}
      <TableCard title="Recent Inspections">
        <table className="min-w-full table-layout-fixed border-collapse">
          <thead className="sticky top-0 bg-[#F9FAFB] z-10 border-b border-gray-200">
            <tr className="h-12 text-left">
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tree Code</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Inspector</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {RECENT_INSPECTIONS.map((row) => (
              <tr key={row.id} className="h-12 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 text-sm font-semibold text-gray-950 truncate">{row.id}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.treeCode}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.inspector}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{formatDateTime(row.date)}</td>
                <td className="px-6 text-sm font-semibold truncate">
                  <span className={`px-2 py-1 rounded-[6px] text-[10px] font-bold ${getBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {/* Table 2: Recent Detection Results */}
      <TableCard title="Recent Detection Results">
        <table className="min-w-full table-layout-fixed border-collapse">
          <thead className="sticky top-0 bg-[#F9FAFB] z-10 border-b border-gray-200">
            <tr className="h-12 text-left">
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tree Code</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Disease</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Confidence</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {RECENT_DETECTION_RESULTS.map((row) => (
              <tr key={row.id} className="h-12 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 text-sm font-semibold text-gray-950 truncate">{row.id}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.treeCode}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.disease}</td>
                <td className="px-6 text-sm font-bold text-gray-800 truncate">{row.confidence}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{formatDateTime(row.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {/* Table 3: Recent Disease History */}
      <TableCard title="Recent Disease History">
        <table className="min-w-full table-layout-fixed border-collapse">
          <thead className="sticky top-0 bg-[#F9FAFB] z-10 border-b border-gray-200">
            <tr className="h-12 text-left">
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tree Code</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Disease</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resolved</th>
              <th className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {RECENT_DISEASE_HISTORY.map((row) => (
              <tr key={row.id} className="h-12 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 text-sm font-semibold text-gray-950 truncate">{row.id}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.treeCode}</td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{row.disease}</td>
                <td className="px-6 text-sm font-semibold truncate">
                  <span className={`px-2 py-1 rounded-[6px] text-[10px] font-bold ${getBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 text-sm font-medium text-gray-600 truncate">{formatDateTime(row.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
