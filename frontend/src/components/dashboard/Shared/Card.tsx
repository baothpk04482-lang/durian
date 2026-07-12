import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  style?: React.CSSProperties;
}

export default function Card({ children, className = "", hover = true, padding = true }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#EEF2F7] rounded-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${padding ? "p-5" : ""} transition-all duration-200 ${hover ? "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
