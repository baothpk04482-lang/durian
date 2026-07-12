import type { ReactNode } from "react";

interface SectionTitleProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  size?: "section" | "card";
}

export default function SectionTitle({ icon, title, subtitle, actions, size = "section" }: SectionTitleProps) {
  const titleSize = size === "section" ? "text-[20px]" : "text-[16px]";
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-gray-500">{icon}</span>}
        <div>
          <h3 className={`${titleSize} font-bold text-gray-900 tracking-tight`}>{title}</h3>
          {subtitle && <span className="text-[13px] text-gray-500 font-medium mt-0.5 block">{subtitle}</span>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
