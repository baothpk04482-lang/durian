import { memo } from "react";
import type { ReactNode } from "react";

interface KPICardProps {
  icon: ReactNode;
  title: string;
  value: string;
  valueSuffix?: string;
  subtitle?: string;
  subtitleColor?: string;
  subtitleGreen?: boolean;
  subtitleLine1?: string;
  subtitleLine2?: string;
  sparkline?: ReactNode;
  valueColor?: string;
  iconBg?: string;
}

const BG_MAP: Record<string, string> = {
  "bg-emerald-50": "#DCFCE7",
  "bg-emerald-100": "#DCFCE7",
  "bg-amber-100": "#FEF3C7",
  "bg-red-50": "#FEE2E2",
};

function KPICardInner({
  icon, title, value, valueSuffix, subtitle, subtitleColor, subtitleGreen, subtitleLine1, subtitleLine2, sparkline, valueColor = "text-[#111827]", iconBg,
}: KPICardProps) {
  const iconBgColor = iconBg ? (BG_MAP[iconBg] || "#DCFCE7") : "#DCFCE7";

  const subBlock = subtitleLine1 != null ? (
    <>
      <span className="text-[13px] font-semibold text-[#15803D]" style={{ marginBottom: "2px" }}>{subtitleLine1}</span>
      {subtitleLine2 != null && (
        <span className="text-[12px] font-medium text-[#94A3B8]">{subtitleLine2}</span>
      )}
    </>
  ) : subtitle ? (
    subtitleColor ? (
      <span className="text-[12px] font-medium" style={{ color: subtitleColor }}>{subtitle}</span>
    ) : (
      <span className={`text-[12px] font-medium ${subtitleGreen ? "text-[#15803D]" : "text-[#94A3B8]"}`}>{subtitle}</span>
    )
  ) : null;

  const leftContent = (
    <>
      <span
        className="text-[11px] font-semibold text-[#94A3B8] uppercase"
        style={{ letterSpacing: "0.6px", marginBottom: "10px", lineHeight: "1" }}
      >
        {title}
      </span>
      {valueSuffix ? (
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: "4px" }}>
          <span className={`text-[48px] font-bold ${valueColor}`} style={{ lineHeight: "1" }}>{value}</span>
          <span className={`text-[34px] font-semibold ${valueColor}`} style={{ lineHeight: "1", marginLeft: "4px" }}>{valueSuffix}</span>
        </div>
      ) : (
        <span className={`text-[48px] font-bold ${valueColor}`} style={{ marginBottom: "4px", lineHeight: "48px" }}>
          {value}
        </span>
      )}
      {subBlock}
    </>
  );

  const iconBlock = (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: "56px",
        height: "56px",
        backgroundColor: iconBgColor,
      }}
      aria-hidden="true"
    >
      {icon}
    </div>
  );

  const cardBase = "bg-white border border-[#EEF2F7] rounded-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.06)]";

  if (sparkline) {
    return (
      <div className={cardBase} style={{ height: "116px", padding: "20px 24px", display: "flex", flexDirection: "column" }} role="group" aria-label={`${title}: ${value}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: "1" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "auto" }}>
            {leftContent}
          </div>
          <div style={{ marginTop: "26px" }}>
            {iconBlock}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {sparkline}
        </div>
      </div>
    );
  }

  return (
    <div className={cardBase} style={{ height: "116px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} role="group" aria-label={`${title}: ${value}`}>
      <div style={{ display: "flex", flexDirection: "column", width: "auto" }}>
        {leftContent}
      </div>
      <div style={{ marginTop: "26px" }}>
        {iconBlock}
      </div>
    </div>
  );
}

const KPICard = memo(KPICardInner);
export default KPICard;
