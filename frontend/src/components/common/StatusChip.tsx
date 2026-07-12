interface StatusChipProps {
  label: string;
  variant: "Healthy" | "Warning" | "Error" | "Resolved" | "Pending" | "Info" | "Success";
}

export default function StatusChip({ label, variant }: StatusChipProps) {
  const getBadgeClass = () => {
    switch (variant) {
      case "Healthy":
      case "Success":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Warning":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Error":
        return "bg-red-50 text-red-700 border border-red-100";
      case "Resolved":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "Pending":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      case "Info":
        return "bg-indigo-50 text-indigo-700 border border-indigo-100";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  return (
    <span className={`inline-flex items-center justify-center min-w-[80px] h-[26px] px-3 rounded-full text-[11px] font-bold leading-none ${getBadgeClass()}`}>
      {label}
    </span>
  );
}
