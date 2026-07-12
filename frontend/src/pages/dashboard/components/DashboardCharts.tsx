import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Dedicated mock objects (Mock Data Policy)
const TREES_BY_COMPANY_DATA = [
  { name: "Company A", count: 4200 },
  { name: "Company B", count: 3800 },
  { name: "Company C", count: 2450 },
  { name: "Company D", count: 2000 },
];

const TREES_BY_FARM_DATA = [
  { name: "Farm Alpha", count: 1800 },
  { name: "Farm Beta", count: 1500 },
  { name: "Farm Gamma", count: 1200 },
  { name: "Farm Delta", count: 900 },
  { name: "Farm Epsilon", count: 800 },
];

const DETECTION_RESULTS_DATA = [
  { name: "Healthy", value: 8500, color: "#1E8449" },
  { name: "Mild Disease", value: 2400, color: "#F59E0B" },
  { name: "Severe Disease", value: 1550, color: "#EF4444" },
];

const INSPECTION_TREND_DATA = [
  { month: "Jan", count: 210 },
  { month: "Feb", count: 280 },
  { month: "Mar", count: 320 },
  { month: "Apr", count: 410 },
  { month: "May", count: 390 },
  { month: "Jun", count: 480 },
];

const DISEASE_TREND_DATA = [
  { month: "Jan", count: 45 },
  { month: "Feb", count: 50 },
  { month: "Mar", count: 35 },
  { month: "Apr", count: 65 },
  { month: "May", count: 60 },
  { month: "Jun", count: 55 },
];

const ALERTS_PRIORITY_DATA = [
  { name: "High", value: 35, color: "#EF4444" },
  { name: "Medium", value: 98, color: "#F59E0B" },
  { name: "Low", value: 241, color: "#3B82F6" },
];

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  footer?: string;
  children: React.ReactNode;
}

function ChartWrapper({ title, subtitle, footer = "Updated 1 hour ago", children }: ChartWrapperProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      style={{ height: "320px" }}
    >
      {/* Title + Subtitle */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">{subtitle || "Overview statistics"}</p>
      </div>

      {/* Divider */}
      <hr className="border-gray-100/60 my-2" />

      {/* Chart Area */}
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100/60 pt-2 mt-2">
        <span className="text-[10px] text-gray-400 font-medium block truncate">
          {footer}
        </span>
      </div>
    </div>
  );
}

export default function DashboardCharts() {
  return (
    <div className="space-y-6 mb-6">
      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Trees by Company */}
        <ChartWrapper
          title="Trees by Company"
          subtitle="Total active trees distribution across companies"
          footer="Real-time company alignment"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TREES_BY_COMPANY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Legend verticalAlign="bottom" height={24} iconSize={10} fontSize={10} />
              <Bar
                name="Tree Count"
                dataKey="count"
                fill="#1E8449"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Chart 2: Trees by Farm */}
        <ChartWrapper
          title="Trees by Farm"
          subtitle="Top tree counts grouped by specific farm"
          footer="Updated recently"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TREES_BY_FARM_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Legend verticalAlign="bottom" height={24} iconSize={10} fontSize={10} />
              <Bar
                name="Tree Count"
                dataKey="count"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Chart 3: Detection Results */}
        <ChartWrapper
          title="Detection Results"
          subtitle="Diagnostics breakdown by health classifications"
          footer="Based on historical inspections"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DETECTION_RESULTS_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={false}
              >
                {DETECTION_RESULTS_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} iconSize={8} fontSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 4: Inspection Trend */}
        <ChartWrapper
          title="Inspection Trend"
          subtitle="Number of inspections registered monthly"
          footer="Monthly historical updates"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={INSPECTION_TREND_DATA} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} iconSize={10} fontSize={10} />
              <Line
                name="Inspections"
                type="monotone"
                dataKey="count"
                stroke="#1E8449"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Chart 5: Disease History Trend */}
        <ChartWrapper
          title="Disease History Trend"
          subtitle="Diagnosed infection counts over past months"
          footer="Monthly historical updates"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DISEASE_TREND_DATA} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} iconSize={10} fontSize={10} />
              <Line
                name="Infection Occurrences"
                type="monotone"
                dataKey="count"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Chart 6: Alerts by Priority */}
        <ChartWrapper
          title="Alerts by Priority"
          subtitle="Alert severity breakdowns currently active"
          footer="Real-time notification alignment"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ALERTS_PRIORITY_DATA}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={85}
                paddingAngle={0}
                dataKey="value"
                isAnimationActive={false}
              >
                {ALERTS_PRIORITY_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} iconSize={8} fontSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
}
