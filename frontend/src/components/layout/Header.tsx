import { useLocation } from "react-router-dom";
import { Menu, Search, Bell, Sun, User } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const getBreadcrumbLabel = (path: string) => {
    switch (path) {
      case "/":
      case "/dashboard":
        return "Dashboard";
      case "/companies":
        return "Companies";
      case "/farms":
        return "Farms";
      case "/zones":
        return "Zones";
      case "/trees":
        return "Trees";
      case "/users":
        return "Users";
      case "/inspections":
        return "Inspections";
      case "/detection-results":
        return "Detection Results";
      case "/disease-history":
        return "Disease History";
      case "/diseases":
        return "Diseases";
      case "/alerts":
        return "Alerts";
      case "/settings":
        return "Settings";
      default: {
        const segment = path.split("/").pop() || "";
        return segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  };

  return (
    <header
      className="bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0"
      style={{ height: "72px" }}
    >
      {/* Left side: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-200 border border-transparent transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Header */}
        <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 select-none">
          <span>PORTAL</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 uppercase font-bold tracking-wider">
            {getBreadcrumbLabel(currentPath)}
          </span>
        </div>
      </div>

      {/* Right side: Search, Notification, Theme, Profile Icons */}
      <div className="flex items-center gap-4">
        {/* Search Icon Placeholder */}
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
          <Search className="w-4 h-4" />
        </div>

        {/* Notification Icon Placeholder (Icon only, no badges/counters) */}
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
          <Bell className="w-4 h-4" />
        </div>

        {/* Theme Placeholder (Icon only, disabled/no toggling or logic) */}
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-300 border border-gray-100/50 shadow-sm select-none cursor-not-allowed">
          <Sun className="w-4 h-4" />
        </div>

        {/* Profile Placeholder (Icon only, no dropdown logic) */}
        <div className="w-10 h-10 rounded-[12px] border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-500 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
