import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, perPage, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    pages.push(1);

    if (page <= 4) {
      pages.push(2, 3, 4, 5);
      pages.push("...");
    } else if (page >= totalPages - 3) {
      pages.push("...");
      pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push("...");
      pages.push(page - 1, page, page + 1);
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const btnBase = "w-9 h-9 rounded-[10px] flex items-center justify-center border text-[13px] font-semibold transition-all";
  const btnInactive = "border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300";
  const btnActive = "bg-[#1E8449] text-white shadow-sm border border-[#1E8449]";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
      <div className="text-[12px] text-gray-500 font-medium tabular-nums">
        Hiển thị <span className="font-semibold text-gray-700">{startItem.toLocaleString()}</span>
        <span className="mx-0.5">–</span>
        <span className="font-semibold text-gray-700">{endItem.toLocaleString()}</span>
        {" "}<span className="mx-1">trên</span>{" "}
        <span className="font-semibold text-gray-700">{total.toLocaleString()}</span>
        {" "}<span className="ml-1">mục</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={page <= 1}
          type="button"
          aria-label="Đến trang đầu"
          className={`${btnBase} ${btnInactive} ${page <= 1 ? btnDisabled : ""}`}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          type="button"
          aria-label="Trang trước"
          className={`${btnBase} ${btnInactive} ${page <= 1 ? btnDisabled : ""}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-[13px] font-semibold text-gray-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              type="button"
              aria-label={`Đến trang ${p}`}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          type="button"
          aria-label="Trang sau"
          className={`${btnBase} ${btnInactive} ${page >= totalPages ? btnDisabled : ""}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={page >= totalPages}
          type="button"
          aria-label="Đến trang cuối"
          className={`${btnBase} ${btnInactive} ${page >= totalPages ? btnDisabled : ""}`}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
