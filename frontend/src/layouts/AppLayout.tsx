import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function getInitialCollapsed(): boolean {
  const stored = localStorage.getItem("dga_compact_sidebar");
  if (stored === "true") return true;
  if (stored === "false") return false;
  return window.innerWidth < 1024;
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: "#F7F8FA" }}
    >
      {/* Sidebar Layout */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Dim Backdrop for Mobile/Tablet overlay sheet */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Layout */}
        <Header onToggleSidebar={toggleSidebar} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-6 flex-1">
            <Outlet />
          </div>
          {/* Footer Layout inside scroll viewport */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
