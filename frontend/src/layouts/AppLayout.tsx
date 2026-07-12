import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const doLogin = useCallback(() => {
    import("../services/auth.service")
      .then(({ authService }) => {
        authService.login({
          username: "usr001@durianguardian.ai",
          password: "password123"
        })
          .then((res: { access_token: string; refresh_token?: string }) => {
            if (res && res.access_token) {
              localStorage.setItem("access_token", res.access_token);
              if (res.refresh_token) {
                localStorage.setItem("refresh_token", res.refresh_token);
              }
              setIsAuthenticating(false);
              window.location.reload();
            }
          })
          .catch((err) => {
            console.error("Auto login error:", err);
            setIsAuthenticating(false);
          });
      })
      .catch((err) => {
        console.error("Failed to load authService:", err);
        setIsAuthenticating(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      doLogin();
      return;
    }

    import("../services/auth.service")
      .then(({ authService }) => {
        authService.getCurrentUser()
          .then(() => {
            setIsAuthenticating(false);
          })
          .catch(() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            doLogin();
          });
      })
      .catch(() => {
        doLogin();
      });
  }, [doLogin]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    // Initialize properly
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="w-8 h-8 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
