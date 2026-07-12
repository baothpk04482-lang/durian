import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  compact?: boolean;
}

export default function PageHeader({ title, description, actions, compact = false }: PageHeaderProps) {
  if (compact) {
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] font-normal text-gray-500 mt-1 leading-normal">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] font-normal text-gray-500 mt-1.5 leading-normal">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
