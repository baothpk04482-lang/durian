import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function SearchBar({ placeholder = "Search...", value, onChange, className }: SearchBarProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={`relative w-full flex items-center ${className || ""}`}>
      <div className="absolute left-3 text-gray-400 select-none pointer-events-none">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] text-gray-800 placeholder-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-gray-300 focus:border-[#1E8449] focus:outline-none transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
