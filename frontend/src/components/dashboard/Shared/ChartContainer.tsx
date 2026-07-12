import type { ReactNode } from "react";

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ChartContainer({ children, className = "" }: ChartContainerProps) {
  return (
    <div className={`w-full h-full min-h-0 ${className}`}>
      {children}
    </div>
  );
}
