import PageHeader from "../../components/common/PageHeader";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Settings"
        description="Configure system preferences, AI services, notification behavior, account preferences, and application settings."
      />

      {/* 2. Grid Sections for Settings Panel */}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: General Settings */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              General Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  System Name
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="DGA Portal"
                  aria-label="System Name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Timezone
                </label>
                <select
                  disabled
                  aria-label="Timezone"
                  defaultValue="bangkok"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="bangkok">UTC+7 (Bangkok)</option>
                  <option value="utc">UTC</option>
                  <option value="tokyo">UTC+9 (Tokyo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Language
                </label>
                <select
                  disabled
                  aria-label="Language"
                  defaultValue="en"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="vi">Vietnamese</option>
                  <option value="th">Thai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Appearance */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              Appearance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Theme Selector
                </label>
                <select
                  disabled
                  aria-label="Theme Selector"
                  defaultValue="light"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="compact-mode"
                  disabled
                  defaultChecked={false}
                  className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                />
                <label
                  htmlFor="compact-mode"
                  className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                >
                  Compact Mode Switch
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: AI Configuration */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              AI Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  AI Provider
                </label>
                <select
                  disabled
                  aria-label="AI Provider"
                  defaultValue="gemini"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="local">Local Model</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="gemini-1.5-pro"
                  aria-label="Model Name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Confidence Threshold (%)
                </label>
                <input
                  type="number"
                  disabled
                  defaultValue="80"
                  aria-label="Confidence Threshold"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Weather Configuration */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              Weather Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Weather Provider
                </label>
                <select
                  disabled
                  aria-label="Weather Provider"
                  defaultValue="openweather"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="openweather">OpenWeatherMap</option>
                  <option value="accuweather">AccuWeather</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Update Interval
                </label>
                <select
                  disabled
                  aria-label="Update Interval"
                  defaultValue="3h"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-[14px] text-gray-500 cursor-not-allowed focus:outline-none"
                >
                  <option value="1h">1 Hour</option>
                  <option value="3h">3 Hours</option>
                  <option value="6h">6 Hours</option>
                  <option value="12h">12 Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Notification Settings */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              Notification Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notif-email"
                  disabled
                  defaultChecked={true}
                  className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                />
                <label
                  htmlFor="notif-email"
                  className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                >
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notif-push"
                  disabled
                  defaultChecked={true}
                  className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                />
                <label
                  htmlFor="notif-push"
                  className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                >
                  Push Notifications
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notif-disease"
                  disabled
                  defaultChecked={true}
                  className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                />
                <label
                  htmlFor="notif-disease"
                  className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                >
                  Disease Alerts
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notif-weather"
                  disabled
                  defaultChecked={false}
                  className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                />
                <label
                  htmlFor="notif-weather"
                  className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                >
                  Weather Alerts
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: Security */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
                Security
              </h3>
              <div className="space-y-4">
                <div>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-[12px] text-[14px] font-semibold transition-all cursor-not-allowed w-full sm:w-auto"
                  >
                    Change Password
                  </button>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="sec-2fa"
                    disabled
                    defaultChecked={false}
                    className="w-4 h-4 text-[#1E8449] border-gray-200 bg-gray-50 rounded focus:ring-[#1E8449] focus:ring-opacity-20 cursor-not-allowed"
                  />
                  <label
                    htmlFor="sec-2fa"
                    className="text-[14px] font-semibold text-gray-600 cursor-not-allowed"
                  >
                    Two-factor Authentication (2FA)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: System Information */}
          <div className="bg-white border border-gray-100 rounded-[18px] p-6 shadow-sm hover:border-gray-200 transition-all md:col-span-2">
            <h3 className="text-[16px] font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 uppercase tracking-wider text-[11px] text-[#1E8449]">
              System Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Version
                </span>
                <span className="text-[15px] font-bold text-gray-800">
                  1.0.0
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Environment
                </span>
                <span className="text-[15px] font-bold text-gray-800">
                  Production
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Build Date
                </span>
                <span className="text-[15px] font-bold text-gray-800">
                  2026-07-04
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled
            className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-[12px] text-[14px] font-semibold transition-all cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled
            className="px-4 py-2 bg-[#1E8449]/50 text-white rounded-[12px] text-[14px] font-semibold transition-all cursor-not-allowed"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
