import SearchBar from "./SearchBar";

interface ToolbarProps {
  title: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Toolbar({ title, searchValue, onSearchChange, searchPlaceholder = "Tìm kiếm...", action, children }: ToolbarProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-[18px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">{title}</h1>
        <div className="hidden lg:block w-px h-6 bg-gray-200" />
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full lg:w-auto lg:min-w-[200px]"
        />
        {children && (
          <div className="flex flex-wrap items-center gap-3">
            {children}
          </div>
        )}
        {action && (
          <div className="lg:ml-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
