import React from "react";
import { SearchX } from "lucide-react";

interface DataTableColumn {
  key: string;
  label: string;
  className?: string;
  width?: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: Array<Record<string, React.ReactNode>>;
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export default function DataTable({ columns, rows, emptyState, loading = false, className }: DataTableProps) {
  const renderSkeletonRows = () =>
    Array.from({ length: 6 }).map((_, rIndex) => (
      <tr key={rIndex} className="animate-pulse">
        {columns.map((col) => (
          <td key={col.key} className="px-5 py-3">
            <div className="h-4 bg-gray-100 rounded-[6px] w-full" style={{ maxWidth: col.width ? `calc(${col.width} * 0.6)` : "80%" }} />
          </td>
        ))}
      </tr>
    ));

  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length} className="px-5 py-16 text-center">
        {emptyState || (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <SearchX className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-500">No data found</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Try adjusting your search or filter criteria.</p>
            </div>
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className={`bg-white border border-gray-100 rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col w-full flex-1 min-h-0 ${className || ""}`}>
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full">
        <table className="w-full border-collapse" style={{ minWidth: "900px" }}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="h-11 text-left bg-[#F8FAFC] border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${
                    col.className || ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {loading ? renderSkeletonRows() : rows.length === 0 ? renderEmptyState() : (
              rows.map((row, rIndex) => (
                <tr key={rIndex} className="h-11 hover:bg-[#F8FAFC] transition-colors duration-100">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3 text-[13px] font-medium text-gray-600 truncate ${
                        col.className || ""
                      }`}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
