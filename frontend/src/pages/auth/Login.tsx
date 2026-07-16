import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Brain,
  CloudSun,
  Layers,
  ShieldAlert,
  Check,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const FEATURES = [
  { icon: Brain, text: "AI Disease Detection" },
  { icon: CloudSun, text: "Weather Intelligence" },
  { icon: Layers, text: "Farm Digital Twin" },
  { icon: ShieldAlert, text: "Early Warning System" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await login({ username: email.trim(), password });
      if (rememberMe) {
        localStorage.setItem("dga_remember_email", email.trim());
      } else {
        localStorage.removeItem("dga_remember_email");
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 animate-[fadeIn_0.5s_ease-out]">
      {/* ── Left Hero Panel ── */}
      <div
        className="hidden md:flex md:w-[58%] lg:w-[58%] relative overflow-hidden flex-col justify-between"
        style={{
          /* TODO: Replace with background image when public/images/login-bg.jpg is available
             backgroundImage: "url('/images/login-bg.jpg')", */
          background: "linear-gradient(160deg, #05231A 0%, #0F3D2E 40%, #145A3C 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(5,55,35,0.70)" }}
        />

        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 lg:px-20 py-14 justify-between">
          {/* Top: Logo */}
          <div className="flex items-center gap-3 animate-[fadeSlideDown_0.6s_ease-out]">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-500/20">
              <Leaf className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-wide text-white/90">
              DGA Portal
            </span>
          </div>

          {/* Center: Title + Features */}
          <div className="flex-1 flex flex-col justify-center max-w-xl animate-[fadeSlideUp_0.7s_ease-out]">
            <h1 className="text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight">
              Durian Guardian
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                AI
              </span>{" "}
              <span className="text-white/90">Operating System</span>
            </h1>

            <p className="mt-3 text-xl font-medium text-emerald-300/80">
              for Smart Durian Farms
            </p>

            <p className="mt-6 text-[16px] leading-relaxed text-white/50 max-w-lg">
              Nền tảng AI giúp doanh nghiệp quản lý trang trại sầu riêng,
              phát hiện bệnh sớm, phân tích rủi ro,
              theo dõi sức khỏe cây theo thời gian thực.
            </p>

            {/* Feature list */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FEATURES.map((f) => (
                <div
                  key={f.text}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[14px] font-medium text-white/70">
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Tagline */}
          <div className="animate-[fadeSlideUp_0.8s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-[2px] bg-emerald-500/40 rounded-full" />
            </div>
            <p className="text-[13px] font-semibold text-emerald-300/60 tracking-wide uppercase">
              Protect Every Tree. Predict Every Risk.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-[580px] animate-[fadeIn_0.6s_ease-out_0.15s_both]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="w-11 h-11 rounded-2xl bg-[#0F3D2E] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-wide text-gray-800">
              DGA Portal
            </span>
          </div>

          {/* White card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-10 sm:p-16">
            {/* Header */}
            <div className="mb-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <Leaf className="w-7 h-7 text-[#1E8449]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Đăng nhập
              </h2>
              <p className="mt-2 text-[15px] text-gray-400">
                Đăng nhập để truy cập hệ thống.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium flex items-center gap-2 animate-[shake_0.3s_ease-in-out]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-600 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    autoFocus
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-[16px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/15 focus:border-[#1E8449] focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-600 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-gray-50/50 text-[16px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/15 focus:border-[#1E8449] focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-[18px] h-[18px] rounded border-gray-300 text-[#1E8449] focus:ring-[#1E8449]/20 cursor-pointer"
                  />
                  <span className="text-[14px] text-gray-500">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  className="text-[14px] font-medium text-[#1E8449] hover:text-[#176B3A] transition-colors duration-200"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1E8449] hover:bg-[#176B3A] active:scale-[0.98] text-white rounded-xl text-[16px] font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_2px_12px_rgba(30,132,73,0.25)] hover:shadow-[0_4px_20px_rgba(30,132,73,0.35)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[13px] font-medium text-gray-300 uppercase tracking-wider">
                or
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Register link */}
            <p className="text-center text-[15px] text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#1E8449] hover:text-[#176B3A] transition-colors duration-200"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[12px] text-gray-300">
            &copy; 2026 Durian Guardian AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
