import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ClipboardCheck,
  Building2,
  Sprout,
  Grid,
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
import StatusChip from "../../components/common/StatusChip";
import { loadAllPages } from "../../utils/loadAllPages";
import { inspectionService } from "../../services/inspection.service";
import { treeService } from "../../services/tree.service";
import { farmService } from "../../services/farm.service";
import { zoneService } from "../../services/zone.service";
import { diseaseService } from "../../services/disease.service";
import type { Inspection } from "../../types/inspection";
import type { Tree } from "../../types/tree";
import type { Farm } from "../../types/farm";
import type { Zone } from "../../types/zone";
import type { Disease } from "../../types/disease";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, STATUS_VI } from "../../utils/translate";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalInspections, setTotalInspections] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTreeId, setSelectedTreeId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [formData, setFormData] = useState({
    inspection_code: "",
    tree_id: "",
    status: "Healthy",
    confidence: 100,
    notes: "",
    inspection_date: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<Inspection | null>(null);

  const fetchInspections = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    inspectionService.get<Inspection[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Inspection[];
        setInspections(arr);
        setTotalInspections((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết kiểm tra.";
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
        inspectionService.get<Inspection[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(treeService),
        loadAllPages(farmService),
        loadAllPages(zoneService),
        loadAllPages(diseaseService),
      ])
        .then(([inspectionsResult, treesResult, farmsResult, zonesResult, diseasesResult]) => {
          if (inspectionsResult.status === "fulfilled") {
            const inspectionsData = inspectionsResult.value;
            const arr = inspectionsData as unknown as Inspection[];
            setInspections(arr);
            setTotalInspections((inspectionsData as any).total ?? arr.length);
            setTotalPages((inspectionsData as any).total_pages ?? Math.ceil(((inspectionsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = inspectionsResult.reason instanceof Error ? inspectionsResult.reason.message : "Không thể tải chi tiết kiểm tra.";
            setError(msg);
          }
          if (treesResult.status === "fulfilled") {
            setTrees(treesResult.value);
          }
          if (farmsResult.status === "fulfilled") {
            setFarms(farmsResult.value);
          }
          if (zonesResult.status === "fulfilled") {
            setZones(zonesResult.value);
          }
          if (diseasesResult.status === "fulfilled") {
            setDiseases(diseasesResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchInspections();
  }, [currentPage, searchQuery, fetchInspections]);

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

  const handleAddClick = () => {
    setCurrentInspection(null);
    setFormData({
      inspection_code: "",
      tree_id: trees[0]?._id || "",
      status: "Healthy",
      confidence: 100,
      notes: "",
      inspection_date: new Date().toISOString().split("T")[0],
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleEditClick = (inspection: Inspection) => {
    setCurrentInspection(inspection);
    const dateOnly = inspection.inspection_date
      ? inspection.inspection_date.split("T")[0]
      : new Date().toISOString().split("T")[0];

    setFormData({
      inspection_code: inspection.inspection_code,
      tree_id: inspection.tree_id,
      status: inspection.status || inspection.health_status || "Healthy",
      confidence: inspection.confidence ?? 100,
      notes: inspection.notes,
      inspection_date: dateOnly,
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (inspection: Inspection) => {
    setDetailRecord(inspection);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tree_id: formData.tree_id,
      inspection_code: formData.inspection_code,
      inspection_date: formData.inspection_date,
      status: formData.status,
      notes: formData.notes,
      confidence: Number(formData.confidence) || 100,
    };

    try {
      if (currentInspection) {
        await inspectionService.put(currentInspection._id, payload);
      } else {
        await inspectionService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchInspections();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu kiểm tra.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedInspectionId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedInspectionId) {
      try {
        await inspectionService.delete(selectedInspectionId);
        fetchInspections();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa kiểm tra.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedInspectionId(null);
      }
    }
  };

  const statuses = ["All", "Healthy", "Monitoring", "Diseased"];
  const statusLabels: Record<string, string> = {
    All: "Tất cả",
    ...STATUS_VI,
  };

  const filteredInspections = inspections.filter((i) => {
    const matchesTree = selectedTreeId === "All" || i.tree_id === selectedTreeId;
    const matchesStatus = selectedStatus === "All" || (i.status || i.health_status || "Healthy") === selectedStatus;
    return matchesTree && matchesStatus;
  });

  const healthyCount = inspections.filter((i) => (i.status || i.health_status) === "Healthy").length;
  const today = new Date().toISOString().split("T")[0];
  const todayInspections = inspections.filter((i) => i.inspection_date?.startsWith(today)).length;
  const passRate = totalInspections > 0 ? Math.round((healthyCount / totalInspections) * 100) : 0;

  const farmMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farms) m.set(String(f._id), f.farm_name);
    return m;
  }, [farms]);

  const zoneMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const z of zones) m.set(String(z._id), z.zone_name || z.zone_code || "");
    return m;
  }, [zones]);

  const treeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of trees) m.set(String(t._id), t.tree_code);
    return m;
  }, [trees]);

  const diseaseMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of diseases) m.set(String(d._id), d.name || "");
    return m;
  }, [diseases]);

  const columns = [
    { key: "inspection_code", label: "Mã kiểm tra", width: "130px" },
    { key: "tree_code", label: "Cây", width: "1fr" },
    { key: "health_status", label: "Trạng thái", width: "110px" },
    { key: "confidence", label: "Độ tin cậy", width: "110px" },
    { key: "notes", label: "Ghi chú", width: "1.5fr" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredInspections.map((row) => ({
    inspection_code: <span className="font-semibold text-gray-900">{row.inspection_code}</span>,
    tree_code: <span className="text-gray-600 font-semibold">{row.tree_code}</span>,
    health_status: (
      <StatusChip
        label={row.status || row.health_status || "Healthy"}
        variant={getStatusChipVariant(row.status || row.health_status || "Healthy")}
      />
    ),
    confidence: <span className="text-gray-700 whitespace-nowrap">{row.confidence ?? 100}%</span>,
    notes: (
      <span className="text-gray-500 truncate max-w-[200px] block" title={row.notes}>
        {row.notes}
      </span>
    ),
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
          aria-label="Chỉnh sửa kiểm tra"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Xóa kiểm tra"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }));

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
        title="Kiểm tra"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm lượt kiểm tra..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm kiểm tra</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Cây:</span>
          <select value={selectedTreeId} onChange={(e) => { setSelectedTreeId(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo cây" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">Tất cả</option>
            {trees.map((t) => (<option key={t._id} value={t._id}>{t.tree_code}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trạng thái:</span>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo trạng thái" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {statuses.map((s) => (<option key={s} value={s}>{statusLabels[s] || s}</option>))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng lượt kiểm tra" value={loading ? "..." : totalInspections} icon={ClipboardCheck} />
        <StatCard compact title="Tổng tình trạng" value={loading ? "..." : healthyCount} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Kiểm tra hôm nay" value={loading ? "..." : todayInspections} icon={Grid} color="text-amber-600" />
        <StatCard compact title="Tỷ lệ đạt" value={loading ? "..." : `${passRate}%`} icon={Sprout} color="text-indigo-600" />
      </div>

      <DataTable
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyState={emptyState}
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={totalInspections}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={drawerMode === "edit" ? "Sửa kiểm tra" : "Thêm kiểm tra"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mã kiểm tra
            </label>
            <input
              type="text"
              value={formData.inspection_code}
              onChange={(e) => setFormData({ ...formData, inspection_code: e.target.value })}
              placeholder="VD: INS-0005"
              aria-label="Mã kiểm tra"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
             
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Cây
            </label>
            <select
              value={formData.tree_id}
              onChange={(e) => setFormData({ ...formData, tree_id: e.target.value })}
              aria-label="Cây"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
             
            >
              <option value="">Chọn cây</option>
              {trees.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.tree_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Ngày kiểm tra
            </label>
            <input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
              aria-label="Ngày kiểm tra"
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
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Độ tin cậy (%)
            </label>
            <input
              type="number"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) || 100 })}
              placeholder="VD: 95.0"
              aria-label="Phần trăm độ tin cậy"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
             
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="VD: Vỏ cây trông khỏe mạnh, không có bất thường..."
              aria-label="Ghi chú"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
             
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết kiểm tra"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? (() => {
                const ext = detailRecord as unknown as Record<string, unknown>;

                const statusVal = detailRecord.status || detailRecord.health_status || "";
                const statusLabel = vi(STATUS_VI, statusVal) || "Chưa xác định";
                const statusColor =
                  statusVal === "Healthy" ? "bg-emerald-100 text-emerald-700" :
                  statusVal === "Diseased" ? "bg-red-100 text-red-700" :
                  statusVal === "Monitoring" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500";

                const conf = detailRecord.confidence;
                const confLabel =
                  conf == null ? "" :
                  conf >= 90 ? "Rất cao" :
                  conf >= 80 ? "Cao" :
                  conf >= 60 ? "Trung bình" :
                  "Thấp";
                const confColor =
                  conf == null ? "" :
                  conf >= 80 ? "bg-emerald-100 text-emerald-700" :
                  conf >= 60 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700";
                const confDot =
                  conf == null ? "" :
                  conf >= 80 ? "bg-emerald-500" :
                  conf >= 60 ? "bg-amber-500" :
                  "bg-red-500";

                // Resolve farm name: try ext.farm_id first, then derive from zone
                const extFarmId = String(ext.farm_id || "");
                const extZoneId = String(ext.zone_id || "");
                const extDiseaseId = String(ext.disease_id || "");
                const extTreeId = String(detailRecord.tree_id || "");

                // Zone to farm mapping: find zone's farm_id if ext.farm_id missing
                let resolvedFarmId = extFarmId;
                if (!resolvedFarmId && extZoneId) {
                  const zone = zones.find((z) => String(z._id) === extZoneId);
                  if (zone) resolvedFarmId = String(zone.farm_id || "");
                }

                const farmName = resolvedFarmId
                  ? farmMap.get(resolvedFarmId) || null
                  : null;
                const zoneName = extZoneId
                  ? zoneMap.get(extZoneId) || null
                  : null;
                const treeCode = extTreeId
                  ? treeMap.get(extTreeId) || detailRecord.tree_code || null
                  : null;

                // predicted_disease is the primary AI disease field
                const predictedDisease = String(ext.predicted_disease || "");
                const aiDisease = String(ext.ai_disease || "");

                // Disease name for "Liên kết dữ liệu": prefer predicted_disease, then disease lookup, then ai_disease
                let linkedDiseaseName: string | null = null;
                if (predictedDisease) {
                  linkedDiseaseName = predictedDisease;
                } else if (extDiseaseId) {
                  const looked = diseaseMap.get(extDiseaseId);
                  linkedDiseaseName = looked || (aiDisease ? aiDisease : null);
                } else if (aiDisease) {
                  linkedDiseaseName = aiDisease;
                }

                // "Bệnh AI nhận diện" in section 1: always show predicted_disease
                const aiIdentifiedDisease = predictedDisease || (extDiseaseId ? diseaseMap.get(extDiseaseId) || null : null);

                return [
                  {
                    title: "Thông tin chung",
                    fields: [
                      { label: "Mã kiểm tra", value: detailRecord.inspection_code || "—" },
                      ...(treeCode ? [{ label: "Tree Digital ID", value: treeCode }] : []),
                      ...(farmName ? [{ label: "Trang trại", value: farmName }] : []),
                      ...(zoneName ? [{ label: "Khu vực", value: zoneName }] : []),
                      ...(aiIdentifiedDisease ? [{ label: "Bệnh AI nhận diện", value: aiIdentifiedDisease }] : []),
                    ],
                  },
                  {
                    title: "Điều kiện môi trường",
                    fields: [
                      ...(ext.temperature != null
                        ? [{
                            label: "Nhiệt độ",
                            value: (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-[15px]">🌡️</span>
                                <span>{String(ext.temperature)}°C</span>
                              </span>
                            ),
                          }]
                        : []),
                      ...(ext.humidity != null
                        ? [{
                            label: "Độ ẩm",
                            value: (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-[15px]">💧</span>
                                <span>{String(ext.humidity)}%</span>
                              </span>
                            ),
                          }]
                        : []),
                      ...(ext.rainfall != null
                        ? [{
                            label: "Lượng mưa",
                            value: (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-[15px]">🌧️</span>
                                <span>{String(ext.rainfall)} mm</span>
                              </span>
                            ),
                          }]
                        : []),
                    ],
                  },
                  {
                    title: "Kết quả AI",
                    fields: [
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
                      {
                        label: "Độ tin cậy",
                        value: conf != null ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-gray-800">{conf}%</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${confColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${confDot}`} />
                              {confLabel}
                            </span>
                          </span>
                        ) : "—",
                      },
                      ...(predictedDisease && aiDisease && predictedDisease !== aiDisease
                        ? [
                            { label: "Bệnh AI nhận diện", value: aiDisease },
                            { label: "Bệnh dự đoán", value: predictedDisease },
                          ]
                        : predictedDisease
                        ? [{ label: "Bệnh", value: predictedDisease }]
                        : aiDisease
                        ? [{ label: "Bệnh", value: aiDisease }]
                        : []),
                    ],
                  },
                  {
                    title: "Liên kết dữ liệu",
                    fields: [
                      ...(farmName ? [{ label: "Trang trại", value: farmName }] : []),
                      ...(zoneName ? [{ label: "Khu vực", value: zoneName }] : []),
                      ...(treeCode ? [{ label: "Tree Digital ID", value: treeCode }] : []),
                      ...(linkedDiseaseName ? [{ label: "Bệnh", value: linkedDiseaseName }] : []),
                    ],
                  },
                  {
                    title: "Thời gian",
                    fields: [
                      { label: "Ngày kiểm tra", value: detailRecord.inspection_date?.split("T")[0] || "—" },
                      { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                    ],
                  },
                ];
              })()
            : []
        }
      />

      <ConfirmDialog
        title="Xóa kiểm tra"
        description="Bạn có chắc chắn muốn xóa lượt kiểm tra này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedInspectionId(null);
        }}
      />
    </div>
  );
}
