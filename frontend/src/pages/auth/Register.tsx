import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const api = (await import("../../api")).default;
      await api.post("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      setSuccess("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ||
        (err instanceof Error ? err.message : "Đăng ký thất bại.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8FA]">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0F3D2E] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-500/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-wider text-emerald-50">
              DGA Portal
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Tham gia cùng
            <br />
            <span className="text-emerald-400">Durian Guardian AI</span>
          </h1>
          <p className="mt-4 text-emerald-200/60 text-sm leading-relaxed max-w-sm">
            Tạo tài khoản để bắt đầu quản lý trang trại sầu riêng với hỗ trợ
            trí tuệ nhân tạo.
          </p>
        </div>

        <div className="relative z-10 text-emerald-200/30 text-[11px]">
          &copy; 2026 Durian Guardian AI. All rights reserved.
        </div>
      </div>

      {/* Right Register Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-[12px] bg-[#0F3D2E] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-wider text-gray-800">
              DGA Portal
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h2>
            <p className="mt-1.5 text-[13px] text-gray-400">
              Nhập thông tin để tạo tài khoản mới.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-[13px] text-red-600 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-[10px] bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-600 font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-[10px] bg-white text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-[10px] bg-white text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-[10px] bg-white text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-[10px] bg-white text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1E8449] hover:bg-[#1E8449]/90 text-white rounded-[10px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-gray-400">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#1E8449] hover:text-[#1E8449]/80 transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
