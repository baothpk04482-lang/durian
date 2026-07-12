import { ClipboardList, Download, RefreshCw } from "lucide-react";
import Card from "./Shared/Card";
import SectionTitle from "./Shared/SectionTitle";
import InspectionTable from "./InspectionTable";
import type { InspectionRow } from "./InspectionTable";

interface RealtimeInspectionCardProps {
  data: InspectionRow[];
  onRefresh?: () => void;
}

export default function RealtimeInspectionCard({ data, onRefresh }: RealtimeInspectionCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden" style={{ height: "420px" }}>
      <SectionTitle
        icon={<ClipboardList className="w-5 h-5 text-emerald-600" />}
        title="Realtime Inspection Activity"
        size="section"
        subtitle="What happened today?"
        actions={
          <div className="flex items-center" style={{ gap: "8px" }}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-[8px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Export to Excel"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export Excel</span>
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[8px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Refresh inspection data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <InspectionTable data={data} />
        </div>
      </div>
    </Card>
  );
}
