
interface LoadingStateProps {
  variant: "Card" | "Table" | "List";
}

export default function LoadingState({ variant }: LoadingStateProps) {
  if (variant === "Card") {
    return (
      <div className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] w-full h-[220px] flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="h-4 bg-gray-100 rounded-[10px] w-1/3" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-8 bg-gray-100 rounded-[10px] w-1/2" />
          <div className="h-4 bg-gray-100 rounded-[10px] w-2/3" />
        </div>
        <div className="h-3 bg-gray-100 rounded-[10px] w-1/4 mt-4" />
      </div>
    );
  }

  if (variant === "Table") {
    return (
      <div className="bg-white border border-gray-100 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 w-full h-[360px] flex flex-col gap-4">
        {/* Table Header skeleton */}
        <div className="flex gap-4 border-b border-gray-100 pb-3">
          <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
          <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
          <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
          <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
        </div>
        {/* Table Rows skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2 border-b border-gray-50 last:border-0">
            <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
            <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
            <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
            <div className="h-4 bg-gray-100 rounded-[10px] flex-1" />
          </div>
        ))}
      </div>
    );
  }

  // Variant: List
  return (
    <div className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] w-full flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
          <div className="w-8 h-8 rounded-[12px] bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-100 rounded-[10px] w-1/3" />
            <div className="h-3 bg-gray-100 rounded-[10px] w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
