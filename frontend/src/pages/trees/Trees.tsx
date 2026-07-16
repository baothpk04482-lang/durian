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
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RecordDetailDrawer from "../../components/common/RecordDetailDrawer";
import StatusChip from "../../components/common/StatusChip";
import { loadAllPages } from "../../utils/loadAllPages";
import { treeService } from "../../services/tree.service";
import { zoneService } from "../../services/zone.service";
import { farmService } from "../../services/farm.service";
import { inspectionService } from "../../services/inspection.service";
import { detectionResultService } from "../../services/detectionResult.service";
import { diseaseHistoryService } from "../../services/diseaseHistory.service";
import { alertService } from "../../services/alert.service";
import type { Tree } from "../../types/tree";
import type { Zone } from "../../types/zone";
import type { Farm } from "../../types/farm";
import type { Inspection } from "../../types/inspection";
import type { DetectionResult } from "../../types/detectionResult";
import type { DiseaseHistory } from "../../types/diseaseHistory";
import type { Alert } from "../../types/alert";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, STATUS_VI } from "../../utils/translate";

export default function TreesPage() {
  // Live API data states
  const [trees, setTrees] = useState<Tree[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [diseaseHistories, setDiseaseHistories] = useState<DiseaseHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalTrees, setTotalTrees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("All");
  const [selectedZoneId, setSelectedZoneId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentTree, setCurrentTree] = useState<Tree | null>(null);
  const [formData, setFormData] = useState({
    tree_code: "",
    zone_id: "",
    variety: "",
    planting_date: "",
    tree_age: 0,
    status: "Healthy",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<Tree | null>(null);

  // Build query params and fetch trees from server
  const fetchTrees = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;
    if (selectedFarmId !== "All") params.farm_id = selectedFarmId;
    if (selectedZoneId !== "All") params.zone_id = selectedZoneId;
    if (selectedStatus !== "All") params.status = selectedStatus;

    treeService.get<Tree[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Tree[];
        setTrees(arr);
        setTotalTrees((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết cây.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, searchQuery, selectedFarmId, selectedZoneId, selectedStatus]);

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
        treeService.get<Tree[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(zoneService),
        loadAllPages(farmService),
        loadAllPages(inspectionService),
        loadAllPages(detectionResultService),
        loadAllPages(diseaseHistoryService),
        loadAllPages(alertService),
      ])
        .then(([treesResult, zonesResult, farmsResult, inspectionsResult, detectionsResult, historyResult, alertsResult]) => {
          if (treesResult.status === "fulfilled") {
            const treesData = treesResult.value;
            const arr = treesData as unknown as Tree[];
            setTrees(arr);
            setTotalTrees((treesData as any).total ?? arr.length);
            setTotalPages((treesData as any).total_pages ?? Math.ceil(((treesData as any).total ?? arr.length) / perPage));
          } else {
            const msg = treesResult.reason instanceof Error ? treesResult.reason.message : "Không thể tải chi tiết cây.";
            setError(msg);
          }
          if (zonesResult.status === "fulfilled") {
            setZones(zonesResult.value);
          }
          if (farmsResult.status === "fulfilled") {
            setFarms(farmsResult.value);
          }
          if (inspectionsResult.status === "fulfilled") {
            setInspections(inspectionsResult.value);
          }
          if (detectionsResult.status === "fulfilled") {
            setDetectionResults(detectionsResult.value);
          }
          if (historyResult.status === "fulfilled") {
            setDiseaseHistories(historyResult.value);
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

    fetchTrees();
  }, [currentPage, searchQuery, selectedFarmId, selectedZoneId, selectedStatus, fetchTrees]);

  // Helper to map status to StatusChip variants
  const getStatusChipVariant = (status: string): "Healthy" | "Warning" | "Error" | "Pending" => {
    switch (status) {
      case "Healthy":
        return "Healthy";
      case "Monitoring":
        return "Warning";
      case "Diseased":
        return "Error";
      default:
        return "Pending";
    }
  };

  // Set form states for Add Tree
  const handleAddClick = () => {
    setCurrentTree(null);
    setFormData({
      tree_code: "",
      zone_id: zones[0]?._id || "",
      variety: "Ri6",
      planting_date: new Date().toISOString().split("T")[0],
      tree_age: 0,
      status: "Healthy",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Tree
  const handleEditClick = (tree: Tree) => {
    setCurrentTree(tree);
    const dateOnly = tree.planting_date
      ? tree.planting_date.split("T")[0]
      : tree.planted_date
      ? tree.planted_date.split("T")[0]
      : "";

    setFormData({
      tree_code: tree.tree_code,
      zone_id: tree.zone_id,
      variety: tree.variety,
      planting_date: dateOnly,
      tree_age: tree.tree_age ?? tree.age ?? 0,
      status: tree.status,
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (tree: Tree) => {
    setDetailRecord(tree);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      zone_id: formData.zone_id,
      tree_code: formData.tree_code,
      variety: formData.variety,
      age: Number(formData.tree_age) || 0,
      status: formData.status,
      planting_date: formData.planting_date || undefined,
    };

    try {
      if (currentTree) {
        await treeService.put(currentTree._id, payload);
      } else {
        await treeService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchTrees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu cây.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedTreeId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedTreeId) {
      try {
        await treeService.delete(selectedTreeId);
        fetchTrees();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa cây.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedTreeId(null);
      }
    }
  };

  const statuses = ["All", "Healthy", "Monitoring", "Diseased"];
  const statusLabels: Record<string, string> = {
    All: "Tất cả",
    ...STATUS_VI,
  };

  // Stat calculations use the currently-loaded trees
  const healthyTrees = trees.filter((t) => t.status === "Healthy").length;
  const monitoringTrees = trees.filter((t) => t.status === "Monitoring").length;
  const diseasedTrees = trees.filter((t) => t.status === "Diseased").length;

  const getFarmName = (id: string) => {
    const farm = farms.find((f) => f._id === id || f.farm_code === id);
    return farm ? farm.farm_name : id;
  };

  const farmMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farms) m.set(f._id, f.farm_name);
    return m;
  }, [farms]);

  const zoneMap = useMemo(() => {
    const m = new Map<string, { name: string; farmId: string }>();
    for (const z of zones) m.set(z._id, { name: z.zone_name || z.zone_code || "", farmId: z.farm_id });
    return m;
  }, [zones]);

  const treeStats = useMemo(() => {
    if (!detailRecord) return null;
    const tid = detailRecord._id;

    const treeInspections = inspections.filter((i) => i.tree_id === tid);
    const treeDetections = detectionResults.filter((d) => d.tree_id === tid);
    const treeHistory = diseaseHistories.filter((h) => h.tree_id === tid);
    const treeAlerts = alerts.filter((a) => a.tree_id === tid);

    const latestInspection = treeInspections.length > 0
      ? treeInspections.reduce((latest, i) => {
          const d = i.created_at || i.inspection_date || "";
          return d > (latest.created_at || latest.inspection_date || "") ? i : latest;
        })
      : null;

    const ext = latestInspection as unknown as Record<string, unknown> | null;

    const zoneInfo = zoneMap.get(detailRecord.zone_id);
    const farmName = zoneInfo ? (farmMap.get(zoneInfo.farmId) || "—") : (detailRecord.farm_name || "—");
    const zoneName = zoneInfo ? zoneInfo.name : (detailRecord.zone_name || detailRecord.zone_code || "—");

    return {
      inspectionCount: treeInspections.length,
      detectionCount: treeDetections.length,
      historyCount: treeHistory.length,
      alertCount: treeAlerts.length,
      latestInspection,
      ext,
      farmName,
      zoneName,
    };
  }, [detailRecord, inspections, detectionResults, diseaseHistories, alerts, farmMap, zoneMap]);

  // Column mapping
  const columns = [
    { key: "tree_code", label: "Mã cây", width: "120px" },
    { key: "farm_name", label: "Trang trại", width: "1fr" },
    { key: "zone_name", label: "Khu vực", width: "1fr" },
    { key: "variety", label: "Giống", width: "120px" },
    { key: "tree_age", label: "Tuổi (Năm)", width: "100px" },
    { key: "status", label: "Trạng thái", width: "110px" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = trees.map((row) => ({
    tree_code: <span className="font-semibold text-gray-900">{row.tree_code}</span>,
    farm_name: <span className="text-gray-600 font-semibold">{row.farm_name || "—"}</span>,
    zone_name: <span className="text-gray-600 font-semibold">{row.zone_name || row.zone_code || "—"}</span>,
    variety: <span className="text-gray-700">{row.variety}</span>,
    tree_age: <span className="text-gray-700 whitespace-nowrap">{row.tree_age ?? row.age ?? 0} Năm</span>,
    status: <StatusChip label={row.status} variant={getStatusChipVariant(row.status)} />,
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
          title="Sửa"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          title="Xóa"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
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
        title="Cây"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm kiếm cây..."
        action={
          <button
            onClick={handleAddClick}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cây</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trang trại:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedZoneId("All");
              setCurrentPage(1);
            }}
            aria-label="Lọc theo trang trại"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            <option value="All">Tất cả</option>
            {farms.map((f) => (
              <option key={f._id} value={f._id}>
                {f.farm_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Khu vực:</span>
          <select
            value={selectedZoneId}
            onChange={(e) => {
              setSelectedZoneId(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Lọc theo khu vực"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            <option value="All">Tất cả</option>
            {zones
              .filter((z) => selectedFarmId === "All" || z.farm_id === selectedFarmId)
              .map((z) => (
                <option key={z._id} value={z._id}>
                  {z.zone_name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{statusLabels[s] || s}</option>
            ))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng cây" value={loading ? "..." : totalTrees.toLocaleString()} icon={TreePine} />
        <StatCard compact title="Cây khỏe mạnh" value={loading ? "..." : healthyTrees.toLocaleString()} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Cây đang theo dõi" value={loading ? "..." : monitoringTrees} icon={Building2} color="text-amber-600" />
        <StatCard compact title="Cây bị bệnh" value={loading ? "..." : diseasedTrees} icon={Grid} color="text-indigo-600" />
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
        total={totalTrees}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={drawerMode === "edit" ? "Sửa cây" : "Thêm cây"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mã cây
            </label>
            <input
              type="text"
              value={formData.tree_code}
              onChange={(e) => setFormData({ ...formData, tree_code: e.target.value })}
              placeholder="VD: TR-005"
              aria-label="Mã cây"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Khu vực
            </label>
            <select
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              aria-label="Khu vực"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
              required
            >
              <option value="">Chọn khu vực</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.zone_name} ({getFarmName(z.farm_id)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Giống
            </label>
            <select
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              aria-label="Giống"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
              required
            >
              <option value="Ri6">Ri6</option>
              <option value="Monthong">Monthong</option>
              <option value="Kanyao">Kanyao</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Ngày trồng
            </label>
            <input
              type="date"
              value={formData.planting_date}
              onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
              aria-label="Ngày trồng"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tuổi cây (Năm)
            </label>
            <input
              type="number"
              value={formData.tree_age}
              onChange={(e) => setFormData({ ...formData, tree_age: Number(e.target.value) || 0 })}
              placeholder="VD: 5"
              aria-label="Tuổi cây"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
             
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              aria-label="Trạng thái"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
             
              required
            >
              <option value="Healthy">Khỏe mạnh</option>
              <option value="Monitoring">Đang theo dõi</option>
              <option value="Diseased">Bị bệnh</option>
            </select>
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <RecordDetailDrawer
        title="Chi tiết cây"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord && treeStats
            ? (() => {
                const ext = detailRecord as unknown as Record<string, unknown>;

                const statusVal = detailRecord.status || "";
                const statusLabel = vi(STATUS_VI, statusVal) || "Chưa xác định";
                const statusColor =
                  statusVal === "Healthy" ? "bg-emerald-100 text-emerald-700" :
                  statusVal === "Diseased" ? "bg-red-100 text-red-700" :
                  statusVal === "Monitoring" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500";

                const latest = treeStats.latestInspection;
                const latestExt = treeStats.ext;

                const plantingDate = detailRecord.planting_date?.split("T")[0]
                  || detailRecord.planted_date?.split("T")[0]
                  || null;

                const lastCheckDate = latest
                  ? (latest.inspection_date?.split("T")[0] || latest.created_at?.split("T")[0] || null)
                  : null;

                const sections = [
                  {
                    title: "Thông tin cây",
                    fields: [
                      { label: "Tree Digital ID", value: detailRecord.tree_code || "—" },
                      ...(ext.qr_code ? [{ label: "QR Code", value: String(ext.qr_code) }] : []),
                      { label: "Giống", value: detailRecord.variety || "—" },
                      { label: "Tuổi cây", value: `${detailRecord.tree_age ?? detailRecord.age ?? 0} năm` },
                      {
                        label: "Trạng thái",
                        value: statusVal ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${statusColor}`}>
                            <span className={`w-2 h-2 rounded-full ${
                              statusVal === "Healthy" ? "bg-emerald-500" :
                              statusVal === "Diseased" ? "bg-red-500" :
                              statusVal === "Monitoring" ? "bg-amber-500" :
                              "bg-gray-400"
                            }`} />
                            {statusLabel}
                          </span>
                        ) : "—",
                      },
                    ],
                  },
                  {
                    title: "Vị trí",
                    fields: [
                      { label: "Trang trại", value: treeStats.farmName },
                      { label: "Khu vực", value: treeStats.zoneName },
                    ],
                  },
                  {
                    title: "Thống kê hoạt động",
                    fields: [
                      ...(treeStats.inspectionCount > 0
                        ? [{ label: "Tổng lượt kiểm tra", value: treeStats.inspectionCount }]
                        : []),
                      ...(treeStats.detectionCount > 0
                        ? [{ label: "Tổng kết quả AI", value: treeStats.detectionCount }]
                        : []),
                      ...(treeStats.historyCount > 0
                        ? [{ label: "Tổng lịch sử bệnh", value: treeStats.historyCount }]
                        : []),
                      ...(treeStats.alertCount > 0
                        ? [{ label: "Tổng cảnh báo", value: treeStats.alertCount }]
                        : []),
                    ],
                  },
                  ...(latest
                    ? [{
                        title: "Kết quả AI gần nhất",
                        fields: [
                          { label: "Bệnh AI nhận diện", value: String(latestExt?.disease_name || latestExt?.ai_disease || "—") },
                          {
                            label: "Độ tin cậy",
                            value: latest.confidence != null ? `${latest.confidence}%` : "—",
                          },
                          {
                            label: "Trạng thái sức khỏe",
                            value: (() => {
                              const hs = latest.health_status || latest.status || "";
                              const hsLabel = vi(STATUS_VI, hs) || hs || "—";
                              const hsColor =
                                hs === "Healthy" ? "bg-emerald-100 text-emerald-700" :
                                hs === "Diseased" ? "bg-red-100 text-red-700" :
                                hs === "Monitoring" ? "bg-amber-100 text-amber-700" :
                                "";
                              return hsColor ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${hsColor}`}>
                                  <span className={`w-2 h-2 rounded-full ${
                                    hs === "Healthy" ? "bg-emerald-500" :
                                    hs === "Diseased" ? "bg-red-500" :
                                    "bg-amber-500"
                                  }`} />
                                  {hsLabel}
                                </span>
                              ) : hsLabel;
                            })(),
                          },
                          { label: "Ngày kiểm tra", value: latest.inspection_date?.split("T")[0] || formatDateTime(latest.created_at) },
                        ],
                      }]
                    : [{
                        title: "Kết quả AI gần nhất",
                        fields: [
                          { label: "", value: <span className="text-gray-400 italic text-[13px]">Chưa có dữ liệu</span> },
                        ],
                      }]
                  ),
                  ...(latest && (latestExt?.temperature != null || latestExt?.humidity != null || latestExt?.rainfall != null)
                    ? [{
                        title: "Điều kiện môi trường",
                        fields: [
                          ...(latestExt?.temperature != null
                            ? [{ label: "Nhiệt độ", value: <span className="inline-flex items-center gap-1.5"><span className="text-[15px]">🌡️</span><span>{String(latestExt.temperature)}°C</span></span> }]
                            : []),
                          ...(latestExt?.humidity != null
                            ? [{ label: "Độ ẩm", value: <span className="inline-flex items-center gap-1.5"><span className="text-[15px]">💧</span><span>{String(latestExt.humidity)}%</span></span> }]
                            : []),
                          ...(latestExt?.rainfall != null
                            ? [{ label: "Lượng mưa", value: <span className="inline-flex items-center gap-1.5"><span className="text-[15px]">🌧️</span><span>{String(latestExt.rainfall)} mm</span></span> }]
                            : []),
                        ],
                      }]
                    : []
                  ),
                  {
                    title: "Thời gian",
                    fields: [
                      ...(plantingDate
                        ? [{ label: "Ngày trồng", value: plantingDate }]
                        : []),
                      ...(lastCheckDate
                        ? [{ label: "Lần kiểm tra gần nhất", value: lastCheckDate }]
                        : []),
                      { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                    ],
                  },
                ];

                return sections;
              })()
            : []
        }
      />
      <ConfirmDialog
        title="Xóa cây"
        description="Bạn có chắc chắn muốn xóa cây này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedTreeId(null);
        }}
      />
    </div>
  );
}
