import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  CloudSun,
  Bell,
  Shield,
  Database,
  Activity,
  HardDrive,
  Lock,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

interface SettingsState {
  language: string;
  timezone: string;
  theme: string;
  compactMode: boolean;
  notifEmail: boolean;
  notifPush: boolean;
  notifDisease: boolean;
  notifWeather: boolean;
}

const STORAGE_KEY = "dga_settings";

const DEFAULTS: SettingsState = {
  language: "vi",
  timezone: "bangkok",
  theme: "light",
  compactMode: false,
  notifEmail: true,
  notifPush: true,
  notifDisease: true,
  notifWeather: false,
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // corrupted — ignore
  }
  return { ...DEFAULTS };
}

function saveSettings(s: SettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  localStorage.setItem("dga_compact_sidebar", String(s.compactMode));
}

function persistCompactMode(compact: boolean) {
  localStorage.setItem("dga_compact_sidebar", String(compact));
}

const COMPANY_KEY = "dga_company";

type ThemeMode = "light" | "dark" | "system";

interface CompanySettings {
  name: string;
  language: string;
  theme: ThemeMode;
  timezone: string;
  lastSaved: string | null;
}

const COMPANY_DEFAULTS: CompanySettings = {
  name: "Durian Guardian AI Co.",
  language: "vi",
  theme: "light",
  timezone: "UTC+07:00",
  lastSaved: null,
};

function loadCompany(): CompanySettings {
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...COMPANY_DEFAULTS, ...parsed };
    }
  } catch {
    // corrupted
  }
  return { ...COMPANY_DEFAULTS };
}

function saveCompany(c: CompanySettings) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
}

function formatLocalNow(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm/yyyy} ${hh}:${min}`;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:ring-offset-2 ${
        checked ? "bg-[#1E8449]" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Progress({
  value,
  color,
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          color || "bg-[#1E8449]"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "warning" | "info" | "error";
}) {
  const styles: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-blue-700",
    error: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${styles[variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === "success"
            ? "bg-emerald-500"
            : variant === "warning"
            ? "bg-amber-500"
            : variant === "error"
            ? "bg-red-500"
            : "bg-blue-500"
        }`}
      />
      {label}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-gray-700">{value}</span>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  color,
  children,
  onSave,
  saveLabel,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center bg-gray-50 ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-gray-800">{title}</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex-1 space-y-3">{children}</div>
      {onSave && (
        <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 bg-[#1E8449] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1E8449]/90 transition-all"
          >
            {saveLabel || "Lưu"}
          </button>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-semibold text-gray-600 shrink-0">
        {label}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [toast, setToast] = useState<"saved" | "reset" | null>(null);

  const [company, setCompany] = useState<CompanySettings>(loadCompany);
  const companyOriginalRef = useRef<CompanySettings>(loadCompany);

  const companyChanged =
    company.name !== companyOriginalRef.current.name ||
    company.language !== companyOriginalRef.current.language ||
    company.timezone !== companyOriginalRef.current.timezone;

  useEffect(() => {
    if (toast === null) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const set = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = () => {
    saveSettings(settings);
    persistCompactMode(settings.compactMode);
    setToast("saved");
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    saveSettings(DEFAULTS);
    persistCompactMode(DEFAULTS.compactMode);
    setToast("reset");
  };

  const handleCompanySave = () => {
    const withTimestamp = { ...company, lastSaved: formatLocalNow() };
    saveCompany(withTimestamp);
    setCompany(withTimestamp);
    companyOriginalRef.current = withTimestamp;
    setToast("saved");
  };

  const handleCompanyRestore = () => {
    setCompany({ ...COMPANY_DEFAULTS });
    saveCompany(COMPANY_DEFAULTS);
    companyOriginalRef.current = COMPANY_DEFAULTS;
    setToast("reset");
  };

  const selectClass =
    "px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all cursor-pointer";
  const inputClass =
    "w-full px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E8449]/20 focus:border-[#1E8449] transition-all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Quản lý cấu hình doanh nghiệp, AI, thời tiết, cảnh báo, bảo mật và hệ thống."
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E8449] text-white px-4 py-2 rounded-[12px] text-[13px] font-semibold shadow-lg animate-pulse">
          {toast === "saved" ? "Đã lưu cài đặt" : "Đã đặt lại cài đặt"}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Company */}
        <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-gray-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-gray-800">Công ty</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Thông tin doanh nghiệp và cấu hình chung</p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Company Name - readonly with lock */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Tên công ty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={company.name}
                  readOnly
                  className={inputClass + " pr-9 bg-gray-50 cursor-not-allowed text-gray-500"}
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Theme Selector - disabled */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Giao diện
              </label>
              <div className="grid grid-cols-3 gap-2 opacity-50 pointer-events-none">
                {([
                  { icon: Sun, label: "Sáng" },
                  { icon: Moon, label: "Tối" },
                  { icon: Monitor, label: "Hệ thống" },
                ]).map((opt) => (
                  <div
                    key={opt.label}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-[10px] text-[12px] font-semibold border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 italic">Chưa hỗ trợ</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Ngôn ngữ
              </label>
              <select
                value={company.language}
                onChange={(e) => setCompany((prev) => ({ ...prev, language: e.target.value }))}
                className={selectClass + " w-full"}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Múi giờ
              </label>
              <select
                value={company.timezone}
                onChange={(e) => setCompany((prev) => ({ ...prev, timezone: e.target.value }))}
                className={selectClass + " w-full"}
              >
                <option value="UTC+07:00">UTC+07:00 (Asia/Ho_Chi_Minh)</option>
                <option value="UTC">UTC (UTC)</option>
                <option value="UTC+09:00">UTC+09:00 (Asia/Tokyo)</option>
              </select>
            </div>

            {/* Save status & Last saved */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</span>
              {companyChanged ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Đã đồng bộ
                </span>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Lưu lần cuối</span>
              <span className="text-[13px] font-semibold text-gray-700">
                {company.lastSaved || "—"}
              </span>
            </div>
          </div>

          {/* Company-specific action buttons */}
          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompanyRestore}
              className="px-4 py-1.5 border border-gray-200 text-gray-600 bg-white rounded-[10px] text-[13px] font-semibold hover:bg-gray-50 transition-all"
            >
              ↺ Khôi phục
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleCompanySave}
              disabled={!companyChanged}
              className={`px-4 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all ${
                companyChanged
                  ? "bg-[#1E8449] text-white hover:bg-[#1E8449]/90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              💾 Lưu thay đổi
            </button>
          </div>
        </div>

        {/* 2. Weather */}
        <SettingsCard
          icon={CloudSun}
          title="Thời tiết"
          description="Dữ liệu thời tiết và dự báo rủi ro"
          color="text-amber-600"
          onSave={handleSave}
        >
          <div className="space-y-3">
            <FieldRow label="Kết nối API">
              <Badge label="Đã kết nối" variant="success" />
            </FieldRow>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Nhà cung cấp
              </label>
              <select disabled className={selectClass + " w-full opacity-60"}>
                <option value="openweather">OpenWeatherMap</option>
                <option value="accuweather">AccuWeather</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Tần suất cập nhật
              </label>
              <select disabled className={selectClass + " w-full opacity-60"}>
                <option value="1h">1 giờ</option>
                <option value="3h">3 giờ</option>
                <option value="6h">6 giờ</option>
              </select>
            </div>
            <InfoRow label="Vị trí hiện tại" value="Chumphon, Thái Lan" />
            <InfoRow label="Lần lấy dữ liệu" value="2026-07-15 09:00" />
          </div>
        </SettingsCard>

        {/* 3. Alert Center */}
        <SettingsCard
          icon={Bell}
          title="Trung tâm cảnh báo"
          description="Kênh thông báo và bộ lọc cảnh báo"
          color="text-red-600"
          onSave={handleSave}
        >
          <div className="space-y-3">
            <FieldRow label="Thông báo email">
              <Toggle
                checked={settings.notifEmail}
                onChange={(v) => set("notifEmail", v)}
              />
            </FieldRow>
            <FieldRow label="Thông báo đẩy">
              <Toggle
                checked={settings.notifPush}
                onChange={(v) => set("notifPush", v)}
              />
            </FieldRow>
            <FieldRow label="Cảnh báo bệnh">
              <Toggle
                checked={settings.notifDisease}
                onChange={(v) => set("notifDisease", v)}
              />
            </FieldRow>
            <FieldRow label="Cảnh báo thời tiết">
              <Toggle
                checked={settings.notifWeather}
                onChange={(v) => set("notifWeather", v)}
              />
            </FieldRow>
            <div className="pt-2">
              <InfoRow label="Tổng cảnh báo active" value="12" />
              <InfoRow label="Cảnh báo chưa đọc" value="3" />
            </div>
          </div>
        </SettingsCard>

        {/* 4. Security */}
        <SettingsCard
          icon={Shield}
          title="Bảo mật"
          description="Bảo vệ tài khoản và phiên đăng nhập"
          color="text-emerald-600"
          onSave={handleSave}
        >
          <div className="space-y-3">
            <div>
              <button
                type="button"
                className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-[10px] text-[13px] font-semibold hover:bg-gray-50 transition-all w-full text-left"
              >
                Đổi mật khẩu
              </button>
            </div>
            <FieldRow label="Xác thực 2FA">
              <Toggle checked={false} disabled />
            </FieldRow>
            <div className="pt-2 space-y-0">
              <InfoRow label="Phiên hiện tại" value="Chrome / Windows" />
              <InfoRow label="Đăng nhập lúc" value="2026-07-15 08:30" />
              <InfoRow label="IP" value="192.168.1.***" />
            </div>
          </div>
        </SettingsCard>

        {/* 5. Dataset */}
        <SettingsCard
          icon={Database}
          title="Dataset"
          description="Quản lý dữ liệu huấn luyện mô hình"
          color="text-cyan-600"
          onSave={handleSave}
        >
          <div className="space-y-3">
            <FieldRow label="Trạng thái">
              <Badge label="Đã đồng bộ" variant="success" />
            </FieldRow>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Dung lượng đã dùng
              </label>
              <div className="flex items-center gap-3">
                <Progress value={35} color="bg-cyan-500" />
                <span className="text-[13px] font-bold text-gray-700 w-16 text-right">
                  1.4 / 4 GB
                </span>
              </div>
            </div>
            <InfoRow label="Ảnh mẫu" value="2,847" />
            <InfoRow label="Nhãn bệnh" value="20 loại" />
            <InfoRow label="Cập nhật cuối" value="2026-07-12" />
          </div>
        </SettingsCard>

        {/* 6. System Monitor */}
        <SettingsCard
          icon={Activity}
          title="System Monitor"
          description="Giám sát hiệu năng hệ thống"
          color="text-orange-600"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                CPU
              </label>
              <div className="flex items-center gap-3">
                <Progress value={42} color="bg-orange-500" />
                <span className="text-[13px] font-bold text-gray-700 w-10 text-right">
                  42%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Bộ nhớ
              </label>
              <div className="flex items-center gap-3">
                <Progress value={67} color="bg-amber-500" />
                <span className="text-[13px] font-bold text-gray-700 w-10 text-right">
                  67%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Ổ cứng
              </label>
              <div className="flex items-center gap-3">
                <Progress value={28} color="bg-emerald-500" />
                <span className="text-[13px] font-bold text-gray-700 w-10 text-right">
                  28%
                </span>
              </div>
            </div>
            <div className="pt-1 space-y-0">
              <InfoRow label="Uptime" value="14 ngày 6 giờ" />
              <InfoRow label="Yêu cầu/phút" value="~120" />
            </div>
          </div>
        </SettingsCard>

        {/* 7. Backup & Restore */}
        <SettingsCard
          icon={HardDrive}
          title="Backup & Restore"
          description="Sao lưu và khôi phục dữ liệu"
          color="text-indigo-600"
        >
          <div className="space-y-3">
            <FieldRow label="Tự động sao lưu">
              <Toggle checked={true} disabled />
            </FieldRow>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Lịch sao lưu
              </label>
              <select disabled className={selectClass + " w-full opacity-60"}>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
              </select>
            </div>
            <InfoRow label="Sao lưu cuối" value="2026-07-15 03:00" />
            <InfoRow label="Dung lượng backup" value="342 MB" />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled
                className="flex-1 px-3 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-[10px] text-[12px] font-semibold cursor-not-allowed"
              >
                Sao lưu ngay
              </button>
              <button
                type="button"
                disabled
                className="flex-1 px-3 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-[10px] text-[12px] font-semibold cursor-not-allowed"
              >
                Khôi phục
              </button>
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* System Info Footer */}
      <div className="bg-white border border-gray-100 rounded-[18px] p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Phiên bản
            </span>
            <span className="block text-[14px] font-bold text-gray-800 mt-1">
              v1.0.0
            </span>
          </div>
          <div className="text-center">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Môi trường
            </span>
            <span className="block text-[14px] font-bold text-gray-800 mt-1">
              Sản xuất
            </span>
          </div>
          <div className="text-center">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Ngày build
            </span>
            <span className="block text-[14px] font-bold text-gray-800 mt-1">
              2026-07-15
            </span>
          </div>
          <div className="text-center">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Database
            </span>
            <span className="block text-[14px] font-bold text-gray-800 mt-1">
              MongoDB 7.x
            </span>
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-200 text-gray-600 bg-white rounded-[12px] text-[14px] font-semibold transition-all hover:bg-gray-50 hover:border-gray-300"
        >
          Đặt lại
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-[14px] font-semibold transition-all hover:bg-[#1E8449]/90"
        >
          Lưu tất cả
        </button>
      </div>
    </div>
  );
}
