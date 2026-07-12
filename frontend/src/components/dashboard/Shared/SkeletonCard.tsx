import type { ReactNode } from "react";

interface SkeletonCardProps {
  children?: ReactNode;
  height?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-[6px] animate-pulse ${className || ""}`} />;
}

export function SkeletonBar({ className }: { className?: string }) {
  return <SkeletonBlock className={className} />;
}

export function KPISkeleton() {
  return (
    <div className="bg-white border border-[#EEF2F7] rounded-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.06)]" style={{ height: "116px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkeletonBar className="h-[11px] w-[80px]" />
        <SkeletonBar className="h-[48px] w-[100px]" />
        <SkeletonBar className="h-[13px] w-[130px]" />
      </div>
      <SkeletonBar className="w-[56px] h-[56px] rounded-full" />
    </div>
  );
}

export function CardSkeleton({ children, height = "100%" }: SkeletonCardProps) {
  return (
    <div className="bg-white border border-[#EEF2F7] rounded-[18px] shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5 flex flex-col animate-pulse" style={{ height }}>
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "30% 40% 30%",
        gridTemplateRows: "auto 520px 420px",
        gap: "20px",
      }}
    >
      <div style={{ gridColumn: "1 / -1", gridRow: 1 }}>
        <div className="grid grid-cols-5" style={{ gap: "20px" }}>
          {Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)}
        </div>
      </div>
      <CardSkeleton><SkeletonBar className="h-4 w-[180px] mb-4" /><div className="flex-1 grid grid-cols-2 gap-2"><SkeletonBar className="h-[60px]" /><SkeletonBar className="h-[60px]" /><SkeletonBar className="h-[60px]" /><SkeletonBar className="h-[60px]" /></div></CardSkeleton>
      <CardSkeleton><SkeletonBar className="h-4 w-[160px] mb-4" /><SkeletonBar className="flex-1 w-full rounded-[12px]" /></CardSkeleton>
      <div style={{ gridRow: "2 / 4", gridColumn: 3 }}>
        <CardSkeleton height="100%"><SkeletonBar className="h-4 w-[140px] mb-4" /><SkeletonBar className="h-12 w-full mb-2" /><SkeletonBar className="flex-1 w-full" /></CardSkeleton>
      </div>
      <CardSkeleton><SkeletonBar className="h-4 w-[140px] mb-4" /><div className="flex-1 flex items-center gap-4"><SkeletonBar className="flex-1 h-full rounded-full" /><SkeletonBar className="w-[100px] h-16" /></div></CardSkeleton>
      <CardSkeleton><SkeletonBar className="h-4 w-[140px] mb-4" /><SkeletonBar className="flex-1 w-full" /></CardSkeleton>
    </div>
  );
}
