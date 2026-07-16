import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Sprout,
  Grid,
  TreePine,
  Users,
  ClipboardCheck,
  Scan,
  History,
  AlertTriangle,
  Bug,
  ChevronLeft,
  ChevronRight,
  Leaf
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { label: "Bảng điều khiển", path: "/dashboard", icon: LayoutDashboard },
    { label: "Công ty", path: "/companies", icon: Building2 },
    { label: "Trang trại", path: "/farms", icon: Sprout },
    { label: "Khu vực", path: "/zones", icon: Grid },
    { label: "Cây", path: "/trees", icon: TreePine },
    { label: "Người dùng", path: "/users", icon: Users },
    { label: "Kiểm tra", path: "/inspections", icon: ClipboardCheck },
    { label: "Kết quả nhận diện", path: "/detection-results", icon: Scan },
    { label: "Lịch sử phát sinh bệnh", path: "/disease-history", icon: History },
    { label: "Cảnh báo", path: "/alerts", icon: AlertTriangle },
    { label: "Bệnh", path: "/diseases", icon: Bug },
  ];

  return (
    <aside
      className={`h-screen flex flex-col justify-between text-white flex-shrink-0 transition-all duration-200 lg:static absolute top-0 left-0 z-30 lg:translate-x-0 ${
        collapsed ? "max-lg:-translate-x-full" : "max-lg:translate-x-0"
      }`}
      style={{
        width: collapsed ? "80px" : "280px",
        backgroundColor: "#0F3D2E",
      }}
    >
      {/* Top DGA Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-emerald-900/40">
        <Leaf className="w-6 h-6 text-emerald-400 flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-base tracking-wider text-emerald-50 truncate">
            DGA Portal
          </span>
        )}
      </div>

      {/* Middle Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? currentPath === "/" || currentPath === "/dashboard"
              : currentPath === item.path || currentPath.startsWith(item.path + "/");
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-colors truncate ${
                isActive
                  ? "bg-[#1E8449] text-white font-semibold shadow-[0_2px_8px_rgba(30,132,73,0.2)]"
                  : "text-emerald-100/70 hover:text-white hover:bg-emerald-950/20"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium leading-none">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Collapse Button */}
      <div className="border-t border-emerald-900/40 p-4">
        {/* Collapse Button */}
        <button
          onClick={onToggle}
          type="button"
          className="w-full flex items-center justify-center py-2 rounded-[12px] bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-medium">Thu gọn menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
