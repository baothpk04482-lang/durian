import {
  Building2,
  Sprout,
  Grid,
  TreePine,
  Users,
  ClipboardCheck
} from "lucide-react";

const KPI_MOCK_DATA = [
  {
    label: "COMPANIES",
    value: "12",
    subtitle: "Compared with last month",
    icon: Building2,
  },
  {
    label: "FARMS",
    value: "48",
    subtitle: "Compared with last month",
    icon: Sprout,
  },
  {
    label: "ZONES",
    value: "154",
    subtitle: "Compared with last month",
    icon: Grid,
  },
  {
    label: "TREES",
    value: "12,450",
    subtitle: "Compared with last month",
    icon: TreePine,
  },
  {
    label: "USERS",
    value: "84",
    subtitle: "Compared with last month",
    icon: Users,
  },
  {
    label: "INSPECTIONS",
    value: "3,892",
    subtitle: "Compared with last month",
    icon: ClipboardCheck,
  },
];

export default function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      {KPI_MOCK_DATA.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white border border-gray-100 rounded-[18px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            style={{ height: "130px" }}
          >
            {/* Top Area */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#1E8449] flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                {card.label}
              </span>
            </div>

            {/* Center Area */}
            <div className="leading-none mt-1">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {card.value}
              </span>
            </div>

            {/* Bottom Area */}
            <div className="mt-1">
              <span className="text-[10px] text-gray-400 font-medium block truncate">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
