import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Building2,
  Sprout,
  Grid,
  TreePine,
  Edit2,
  Trash2,
  Eye,
  Plus
} from "lucide-react";
import Toolbar from "../../components/common/Toolbar";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import DrawerForm from "../../components/common/DrawerForm";
import RecordDetailDrawer from "../../components/common/RecordDetailDrawer";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { loadAllPages } from "../../utils/loadAllPages";
import { farmService } from "../../services/farm.service";
import { companyService } from "../../services/company.service";
import { zoneService } from "../../services/zone.service";
import { inspectionService } from "../../services/inspection.service";
import { alertService } from "../../services/alert.service";
import type { Farm } from "../../types/farm";
import type { Company } from "../../types/company";
import type { Zone } from "../../types/zone";
import type { Inspection } from "../../types/inspection";
import type { Alert } from "../../types/alert";
import { formatDateTime } from "../../utils/dateFormatter";

export default function FarmsPage() {
  // Live API data states
  const [farms, setFarms] = useState<Farm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({
    farm_code: "",
    farm_name: "",
    company_id: "",
    district: "",
    area_hectare: 0,
    address: "",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<Farm | null>(null);

  // Build query params and fetch farms from server
  const fetchFarms = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    farmService.get<Farm[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Farm[];
        setFarms(arr);
        setTotalFarms((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết trang trại.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, searchQuery]);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: perPage,
      };

      Promise.allSettled([
        farmService.get<Farm[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(companyService),
        loadAllPages(zoneService),
        loadAllPages(inspectionService),
        loadAllPages(alertService),
      ])
        .then(([farmsResult, companiesResult, zonesResult, inspectionsResult, alertsResult]) => {
          if (farmsResult.status === "fulfilled") {
            const farmsData = farmsResult.value;
            const arr = farmsData as unknown as Farm[];
            setFarms(arr);
            setTotalFarms((farmsData as any).total ?? arr.length);
            setTotalPages((farmsData as any).total_pages ?? Math.ceil(((farmsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = farmsResult.reason instanceof Error ? farmsResult.reason.message : "Không thể tải chi tiết trang trại.";
            setError(msg);
          }
          if (companiesResult.status === "fulfilled") {
            setCompanies(companiesResult.value);
          }
          if (zonesResult.status === "fulfilled") {
            setZones(zonesResult.value);
          }
          if (inspectionsResult.status === "fulfilled") {
            setInspections(inspectionsResult.value);
          }
          if (alertsResult.status === "fulfilled") {
            setAlerts(alertsResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchFarms();
  }, [currentPage, searchQuery, fetchFarms]);

  const getCompanyName = (id: string) => {
    const company = companies.find((c) => c._id === id || c.company_code === id);
    return company ? company.company_name : id;
  };

  const companyMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of companies) m.set(c._id, c.company_name);
    return m;
  }, [companies]);

  const totalAreaAll = useMemo(() => farms.reduce((s, f) => s + (f.area_hectare || 0), 0), [farms]);
  const totalTreesAll = useMemo(() => farms.reduce((s, f) => s + (f.tree_count || 0), 0), [farms]);

  const detailStats = useMemo(() => {
    if (!detailRecord) return null;
    const fid = detailRecord._id;
    const zoneCount = zones.filter((z) => z.farm_id === fid).length;
    const area = detailRecord.area_hectare || 0;
    const trees = detailRecord.tree_count || 0;
    const density = area > 0 ? Number((trees / area).toFixed(1)) : 0;
    const areaShare = totalAreaAll > 0 ? ((area / totalAreaAll) * 100).toFixed(1) : "0";
    const treeShare = totalTreesAll > 0 ? ((trees / totalTreesAll) * 100).toFixed(1) : "0";
    const inspectionCount = inspections.filter((i) => {
      const ext = i as unknown as Record<string, unknown>;
      return ext.farm_id === fid || ext.farm === detailRecord.farm_name;
    }).length;
    const alertCount = alerts.filter((a) => a.farm_id === fid).length;
    return { zoneCount, density, areaShare, treeShare, inspectionCount, alertCount };
  }, [detailRecord, zones, inspections, alerts, totalAreaAll, totalTreesAll]);

  // Set form states for Add Farm
  const handleAddClick = () => {
    setCurrentFarm(null);
    setFormData({
      farm_code: "",
      farm_name: "",
      company_id: companies[0]?._id || "",
      district: "",
      area_hectare: 0,
      address: "",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Farm
  const handleEditClick = (farm: Farm) => {
    setCurrentFarm(farm);
    setFormData({
      farm_code: farm.farm_code,
      farm_name: farm.farm_name,
      company_id: farm.company_id,
      district: farm.district,
      area_hectare: farm.area_hectare,
      address: farm.address || "",
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (farm: Farm) => {
    setDetailRecord(farm);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.farm_name,
      farm_code: formData.farm_code,
      company_id: formData.company_id,
      district: formData.district,
      area: Number(formData.area_hectare) || 0,
      address: formData.address || "",
    };

    try {
      if (currentFarm) {
        // Edit Action
        await farmService.put(currentFarm._id, payload);
      } else {
        // Create Action
        await farmService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchFarms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu trang trại.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedFarmId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedFarmId) {
      try {
        await farmService.delete(selectedFarmId);
        fetchFarms();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa trang trại.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedFarmId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const districts = ["All", ...Array.from(new Set(farms.map((f) => f.district).filter(Boolean)))];

  // Client-side filtering for company/district (unsupported by backend)
  const filteredFarms = farms.filter((f) => {
    const matchesCompany = selectedCompanyId === "All" || f.company_id === selectedCompanyId;
    const matchesDistrict = selectedDistrict === "All" || f.district === selectedDistrict;
    return matchesCompany && matchesDistrict;
  });

  // Dynamic statistics aggregations
  const totalAreaHectare = Number(filteredFarms.reduce((sum, f) => sum + (f.area_hectare || 0), 0).toFixed(1));
  const averageAreaHectare = totalFarms > 0 ? Number((totalAreaHectare / totalFarms).toFixed(1)) : 0;
  const totalTrees = filteredFarms.reduce((sum, f) => sum + (f.tree_count || 0), 0);

  // Column mapping
  const columns = [
    { key: "farm_code", label: "Mã trang trại", width: "120px" },
    { key: "farm_name", label: "Tên trang trại", width: "1fr" },
    { key: "company_id", label: "Công ty", width: "1fr" },
    { key: "district", label: "Quận/Huyện", width: "1fr" },
    { key: "area_hectare", label: "Diện tích (Ha)", width: "110px" },
    { key: "tree_count", label: "Cây", width: "100px" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredFarms.map((row) => ({
    farm_code: <span className="font-semibold text-gray-900">{row.farm_code}</span>,
    farm_name: <span className="text-gray-700">{row.farm_name}</span>,
    company_id: <span className="text-gray-600 font-semibold">{getCompanyName(row.company_id)}</span>,
    district: <span className="text-gray-600">{row.district}</span>,
    area_hectare: <span className="text-gray-700 whitespace-nowrap">{row.area_hectare || 0} Ha</span>,
    tree_count: <span className="text-gray-700">{(row.tree_count || 0).toLocaleString()}</span>,
    created_at: <span className="text-gray-500">{formatDateTime(row.created_at)}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => handleViewClick(row)}
          type="button"
          title="Xem"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit farm"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete farm"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }));

  // Drawer Footer layout
  const drawerFooter = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={() => setIsDrawerOpen(false)}
        type="button"
        className="px-4 py-2 border border-gray-200 rounded-[12px] text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-all"
      >
        Hủy
      </button>
      <button
        onClick={handleSave}
        type="button"
        className="px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-[14px] font-semibold hover:bg-emerald-700 transition-all"
      >
        Lưu
      </button>
    </div>
  );

  const emptyState = error ? (
    <div className="text-red-600 text-sm font-semibold py-6 text-center">
      {error}. Vui lòng thử lại sau.
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col h-full space-y-4">
      <Toolbar
        title="Trang trại"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm kiếm trang trại..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm trang trại</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Công ty:</span>
          <select value={selectedCompanyId} onChange={(e) => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }} aria-label="Filter by company" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">Tất cả</option>
            {companies.map((c) => (<option key={c._id} value={c._id}>{c.company_name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Quận/Huyện:</span>
          <select value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }} aria-label="Filter by district" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {districts.map((dist) => (<option key={dist} value={dist}>{dist}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          compact
          title="Tổng trang trại"
          value={loading ? "..." : totalFarms.toLocaleString()}
          icon={Sprout}
        />
        <StatCard
          compact
          title="Diện tích TB (Ha)"
          value={loading ? "..." : `${averageAreaHectare} Ha`}
          icon={Building2}
          color="text-blue-600"
        />
        <StatCard
          compact
          title="Tổng diện tích"
          value={loading ? "..." : `${totalAreaHectare} Ha`}
          icon={Grid}
          color="text-amber-600"
        />
        <StatCard
          compact
          title="Tổng cây"
          value={loading ? "..." : totalTrees.toLocaleString()}
          icon={TreePine}
          color="text-indigo-600"
        />
      </div>

      {/* 4. Data Table Grid Layout */}
      <DataTable
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyState={emptyState}
      />

      {/* 5. Pagination Control Footer */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={totalFarms}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={drawerMode === "edit" ? "Sửa trang trại" : "Thêm trang trại"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mã trang trại
            </label>
            <input
              type="text"
              value={formData.farm_code}
              onChange={(e) => setFormData({ ...formData, farm_code: e.target.value })}
              placeholder="VD: FRM-005"
              aria-label="Mã trang trại"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tên trang trại
            </label>
            <input
              type="text"
              value={formData.farm_name}
              onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
              placeholder="VD: Chumphon Gold Hill"
              aria-label="Tên trang trại"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Công ty
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              aria-label="Company"
             
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Chọn công ty</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Quận/Huyện
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="VD: Lamae"
              aria-label="District"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Diện tích (Ha)
            </label>
            <input
              type="number"
              step="any"
              value={formData.area_hectare}
              onChange={(e) => setFormData({ ...formData, area_hectare: Number(e.target.value) || 0 })}
              placeholder="VD: 10.5"
              aria-label="Area in Hectares"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Địa chỉ
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: Lamae Road"
              aria-label="Address"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết trang trại"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord && detailStats
            ? [
                {
                  title: "Thông tin chung",
                  fields: [
                    { label: "Mã trang trại", value: detailRecord.farm_code || "—" },
                    { label: "Tên trang trại", value: detailRecord.farm_name || "—" },
                    { label: "Công ty", value: companyMap.get(detailRecord.company_id) || getCompanyName(detailRecord.company_id) },
                  ],
                },
                {
                  title: "Vị trí",
                  fields: [
                    { label: "Quận / Huyện", value: detailRecord.district || "—" },
                  ],
                },
                {
                  title: "Thống kê",
                  fields: [
                    { label: "Diện tích", value: `${detailRecord.area_hectare || 0} ha` },
                    { label: "Số lượng cây", value: (detailRecord.tree_count || 0).toLocaleString() },
                    { label: "Số khu vực", value: detailStats.zoneCount },
                    {
                      label: "Mật độ cây",
                      value: detailStats.density > 0 ? `${detailStats.density} cây/ha` : "—",
                    },
                    { label: "Tỷ trọng diện tích", value: `${detailStats.areaShare}%` },
                    { label: "Tỷ trọng số cây", value: `${detailStats.treeShare}%` },
                  ],
                },
                {
                  title: "Hoạt động",
                  fields: [
                    ...(detailStats.inspectionCount > 0
                      ? [{ label: "Lượt kiểm tra", value: detailStats.inspectionCount }]
                      : []),
                    ...(detailStats.alertCount > 0
                      ? [{ label: "Cảnh báo", value: detailStats.alertCount }]
                      : []),
                  ],
                },
                {
                  title: "Thời gian",
                  fields: [
                    { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                  ],
                },
              ]
            : []
        }
      />

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Xóa trang trại"
        description="Bạn có chắc chắn muốn xóa trang trại này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedFarmId(null);
        }}
      />
    </div>
  );
}
