import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerFormProps {
  title: string;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function DrawerForm({ title, open, onClose, footer, children }: DrawerFormProps) {
  // Listen for Escape key to close the drawer
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
        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-gray-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
