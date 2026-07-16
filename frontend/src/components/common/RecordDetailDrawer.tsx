import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DetailField {
  label: string;
  value: React.ReactNode;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface RecordDetailDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  sections: DetailSection[];
}

export default function RecordDetailDrawer({ title, open, onClose, sections }: RecordDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity flex justify-end"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[560px] h-full bg-white rounded-l-[18px] shadow-2xl flex flex-col justify-between"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Đóng bảng"
            className="w-10 h-10 rounded-[12px] flex items-center justify-center border border-gray-100 text-gray-400 hover:text-gray-700 hover:border-gray-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="rounded-[12px] border border-gray-100 divide-y divide-gray-50">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-start px-4 py-3">
                    <span className="text-[13px] text-gray-400 w-[160px] shrink-0 leading-relaxed">
                      {field.label}
                    </span>
                    <span className="text-[13px] text-gray-800 font-medium leading-relaxed">
                      {field.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 border border-gray-200 rounded-[12px] text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
