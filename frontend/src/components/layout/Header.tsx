import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, Bell, X } from "lucide-react";
import { alertService } from "@/services/alert.service";
import { formatDateTime } from "@/utils/dateFormatter";
import { useAuth } from "@/hooks/useAuth";
import type { Alert } from "@/types/alert";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const userName = user?.full_name || "Quản trị viên";
  const userRole = user?.role || "Administrator";

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch alerts on mount
  useEffect(() => {
    alertService
      .get<Alert[]>({ params: { per_page: 50 } })
      .then((data) => setAlerts(data))
      .catch(() => {});
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC to close all dropdowns
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/trees?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const highAlertCount = alerts.filter(
    (a) => (a.priority || "").toLowerCase() === "high",
  ).length;
  const badgeCount = highAlertCount > 0 ? highAlertCount : alerts.length;

  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getBreadcrumbLabel = (path: string) => {
    switch (path) {
      case "/":
      case "/dashboard":
        return "Tổng quan";
      case "/companies":
        return "Công ty";
      case "/farms":
        return "Trang trại";
      case "/zones":
        return "Khu vực";
      case "/trees":
        return "Cây";
      case "/users":
        return "Người dùng";
      case "/inspections":
        return "Kiểm tra";
      case "/detection-results":
        return "Kết quả nhận diện";
      case "/disease-history":
        return "Lịch sử phát sinh bệnh";
      case "/diseases":
        return "Bệnh";
      case "/alerts":
        return "Cảnh báo";
      case "/settings":
        return "Cài đặt";
      default: {
        const segment = path.split("/").pop() || "";
        return segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  };

  const priorityDot = (priority?: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "high") return "bg-red-500";
    if (p === "medium") return "bg-amber-400";
    return "bg-gray-300";
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

        <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 select-none">
          <span>PORTAL</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 uppercase font-bold tracking-wider">
            {getBreadcrumbLabel(currentPath)}
          </span>
        </div>
      </div>

      {/* Right side: Search, Notification, Profile */}
      <div className="flex items-center gap-3">
        {/* ── Search ── */}
        <div ref={searchRef} className="relative">
          <button
            type="button"
            onClick={() => { setSearchOpen((o) => !o); setNotifOpen(false); setProfileOpen(false); }}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all"
            aria-label="Tìm kiếm"
          >
            <Search className="w-4 h-4" />
          </button>
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-[12px] shadow-lg p-2 z-50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="Tree ID, trang trại, khu vực..."
                  className="flex-1 text-[13px] text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Notification ── */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((o) => !o); setSearchOpen(false); setProfileOpen(false); }}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all relative"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {badgeCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-[13px] font-bold text-gray-800">Thông báo</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                    Chưa có thông báo
                  </div>
                ) : (
                  recentAlerts.map((a) => (
                    <div
                      key={a._id}
                      className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (a.tree_id) {
                          navigate(`/trees?search=${encodeURIComponent(a.tree_id)}`);
                        } else {
                          navigate("/alerts");
                        }
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(a.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{a.title}</p>
                          {a.tree_id && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{a.tree_id}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(a.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {recentAlerts.length > 0 && (
                <div
                  className="px-4 py-2.5 text-center border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => { navigate("/alerts"); setNotifOpen(false); }}
                >
                  <span className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700">
                    Xem tất cả
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Profile ── */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => { setProfileOpen((o) => !o); setSearchOpen(false); setNotifOpen(false); }}
            className="w-10 h-10 rounded-full bg-[#15803d] flex items-center justify-center text-white text-sm font-semibold shadow-sm hover:brightness-110 transition-all"
            aria-label="Tài khoản"
          >
            {userInitials}
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-800">{userName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{userRole}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
