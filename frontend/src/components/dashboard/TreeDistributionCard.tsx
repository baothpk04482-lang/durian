import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Heart } from "lucide-react";
import Card from "./Shared/Card";
import SectionTitle from "./Shared/SectionTitle";

interface HealthSegment {
  name: string;
  value: number;
  color: string;
}

interface FarmHealthCardProps {
  data: HealthSegment[];
  total: number;
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-[13px] font-semibold text-gray-400">No Data Available</p>
    </div>
  );
}

export default function TreeDistributionCard({ data, total }: FarmHealthCardProps) {
  const hasData = data.length > 0 && data.some((s) => s.value > 0);
  const grandTotal = hasData ? data.reduce((sum, s) => sum + s.value, 0) : total;

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as HealthSegment;
    const pct = grandTotal > 0 ? Math.round((d.value / grandTotal) * 100) : 0;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
          <span className="text-[13px] font-bold text-gray-800">{d.name}</span>
        </div>
        <span className="text-[12px] text-gray-500 font-medium">{d.value.toLocaleString()} Trees</span>
        <span className="text-[12px] text-gray-400 ml-1">({pct}%)</span>
      </div>
    );
  };

  return (
    <Card className="flex flex-col" style={{ height: "100%" }}>
      <SectionTitle
        icon={<Heart className="w-5 h-5 text-emerald-600" />}
        title="Farm Health Distribution"
        size="section"
        subtitle="How healthy is my farm?"
      />
      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="flex-1 flex items-center" style={{ gap: "16px", minHeight: 0 }}>
          <div className="flex-1 h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="48%"
                  innerRadius={95}
                  outerRadius={150}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  isAnimationActive={false}
                  style={{ outline: "none" }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: "none", cursor: "pointer" }} />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center" style={{ marginTop: "-8px" }}>
                <span className="text-[20px] font-black text-gray-900 block leading-none">{total.toLocaleString()}</span>
                <span className="text-[11px] text-gray-500 font-bold block">Total Trees</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-shrink-0" style={{ gap: "12px", paddingRight: "4px" }}>
            {data.map((item) => {
              const pct = grandTotal > 0 ? Math.round((item.value / grandTotal) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center" style={{ gap: "10px" }}>
                  <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <div>
                    <span className="text-[13px] font-bold text-gray-700 block leading-tight">{item.name}</span>
                    <span className="text-[12px] text-gray-400 font-medium">{item.value.toLocaleString()} trees ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
