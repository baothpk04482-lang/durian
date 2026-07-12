import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-[18px] text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] w-full max-w-lg mx-auto">
      {/* Icon Area */}
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4 select-none">
        {Icon ? <Icon className="w-8 h-8" /> : <Inbox className="w-8 h-8" />}
      </div>

      {/* Text Area */}
      <h3 className="text-[16px] font-semibold text-gray-800 tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-[14px] font-normal text-gray-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {/* Optional Recovery Action */}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
