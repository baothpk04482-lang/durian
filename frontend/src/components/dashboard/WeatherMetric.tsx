import { memo } from "react";
import type { ReactNode } from "react";

interface WeatherMetricProps {
  icon: ReactNode;
  value: string;
  label: string;
  color?: string;
  bg?: string;
}

const gradientMap: Record<string, string> = {
  "bg-orange-100": "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
  "bg-blue-100": "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
  "bg-indigo-100": "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
  "bg-cyan-100": "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
};

function WeatherMetricInner({ icon, value, label, color = "text-gray-900", bg = "bg-gray-50" }: WeatherMetricProps) {
  return (
    <div
      className="rounded-[12px] p-3 flex items-center gap-3 transition-colors duration-200"
      style={{ background: gradientMap[bg] || bg, border: "1px solid rgba(0,0,0,0.04)" }}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0">
        <span className={`text-[32px] font-black ${color} leading-none block`}>{value}</span>
        <span className="text-[12px] text-gray-500 font-medium">{label}</span>
      </div>
    </div>
  );
}

const WeatherMetric = memo(WeatherMetricInner);
export default WeatherMetric;
