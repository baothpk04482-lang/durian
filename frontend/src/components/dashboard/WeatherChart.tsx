import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

interface WeatherChartData {
  day: string;
  rain: number;
  humidity: number;
  wind: number;
}

interface WeatherChartProps {
  data: WeatherChartData[];
}

function WeatherChartInner({ data }: WeatherChartProps) {
  return (
    <div className="w-full" style={{ flex: "1 1 0%", minHeight: 0 }} role="img" aria-label="Biểu đồ dự báo thời tiết">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%" margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={{ stroke: "#f0f0f0" }} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              fontSize: "11px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Bar dataKey="rain" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Mưa (mm)" />
          <Bar dataKey="humidity" fill="#22C55E" radius={[3, 3, 0, 0]} name="Độ ẩm (%)" />
          <Bar dataKey="wind" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Gió (km/h)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const WeatherChart = memo(WeatherChartInner);
export default WeatherChart;
