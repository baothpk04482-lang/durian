import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  open,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if the click was directly on the backdrop container itself
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="w-full max-w-md bg-white border border-gray-100 rounded-[18px] p-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)] flex flex-col gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="dialog-title" className="text-[16px] font-semibold text-gray-800 tracking-tight">
              {title}
            </h3>
            <p id="dialog-description" className="text-[14px] font-normal text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[14px] font-semibold rounded-[12px] border border-gray-200 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[14px] font-semibold rounded-[12px] transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
