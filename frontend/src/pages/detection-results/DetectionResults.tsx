import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Scan,
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
import { detectionResultService } from "../../services/detectionResult.service";
import { inspectionService } from "../../services/inspection.service";
import { treeService } from "../../services/tree.service";
import { zoneService } from "../../services/zone.service";
import { farmService } from "../../services/farm.service";
import type { DetectionResult } from "../../types/detectionResult";
import type { Inspection } from "../../types/inspection";
import type { Tree } from "../../types/tree";
import type { Zone } from "../../types/zone";
import type { Farm } from "../../types/farm";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, SEVERITY_VI, STATUS_VI } from "../../utils/translate";

export default function DetectionResultsPage() {
  // Live API data states
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalDetections, setTotalDetections] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInspectionId, setSelectedInspectionId] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedPrediction, setSelectedPrediction] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<DetectionResult | null>(null);
  const [formData, setFormData] = useState({
    prediction: "",
    inspection_id: "",
    confidence: 100,
    severity: "Mild",
    image_url: "",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);

  // Drawer mode state
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<DetectionResult | null>(null);

  // Lookup maps for resolving ObjectIds
  const inspectionMap = useMemo(() => new Map(inspections.map((i) => [String(i._id), i])), [inspections]);
  const treeMap = useMemo(() => new Map(trees.map((t) => [String(t._id), t])), [trees]);
  const zoneMap = useMemo(() => new Map(zones.map((z) => [String(z._id), z])), [zones]);
  const farmMap = useMemo(() => new Map(farms.map((f) => [String(f._id), f])), [farms]);

  // Build query params and fetch detection results from server
  const fetchDetections = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    detectionResultService.get<DetectionResult[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as DetectionResult[];
        setDetections(arr);
        setTotalDetections((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết kết quả phát hiện.";
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
      if (searchQuery) params.keyword = searchQuery;

      Promise.allSettled([
        detectionResultService.get<DetectionResult[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(inspectionService),
        loadAllPages(treeService),
        loadAllPages(zoneService),
        loadAllPages(farmService),
      ])
        .then(([detectionsResult, inspectionsResult, treesResult, zonesResult, farmsResult]) => {
          if (detectionsResult.status === "fulfilled") {
            const detectionsData = detectionsResult.value;
            const arr = detectionsData as unknown as DetectionResult[];
            setDetections(arr);
            setTotalDetections((detectionsData as any).total ?? arr.length);
            setTotalPages((detectionsData as any).total_pages ?? Math.ceil(((detectionsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = detectionsResult.reason instanceof Error ? detectionsResult.reason.message : "Không thể tải chi tiết kết quả phát hiện.";
            setError(msg);
          }
          if (inspectionsResult.status === "fulfilled") {
            setInspections(inspectionsResult.value);
          }
          if (treesResult.status === "fulfilled") {
            setTrees(treesResult.value);
          }
          if (zonesResult.status === "fulfilled") {
            setZones(zonesResult.value);
          }
          if (farmsResult.status === "fulfilled") {
            setFarms(farmsResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchDetections();
  }, [currentPage, searchQuery, fetchDetections]);

  const getSeverityChipVariant = (severity: string): "Error" | "Warning" | "Info" | "Pending" => {
    switch (severity) {
      case "Severe":
        return "Error";
      case "Moderate":
        return "Warning";
      case "Mild":
        return "Info";
      default:
        return "Pending";
    }
  };

  // Set form states for Add Detection
  const handleAddClick = () => {
    setCurrentDetection(null);
    setFormData({
      prediction: "Leaf Spot",
      inspection_id: inspections[0]?._id || "",
      confidence: 90,
      severity: "Mild",
      image_url: "",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Detection
  const handleEditClick = (detection: DetectionResult) => {
    setCurrentDetection(detection);
    setFormData({
      prediction: detection.disease_name,
      inspection_id: detection.inspection_id,
      confidence: detection.confidence,
      severity: detection.severity,
      image_url: detection.image_url,
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (detection: DetectionResult) => {
    setDetailRecord(detection);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedInspection = inspections.find((insp) => insp._id === formData.inspection_id);
    const payload = {
      disease_name: formData.prediction,
      inspection_id: formData.inspection_id,
      tree_id: selectedInspection ? selectedInspection.tree_id : "",
      severity: formData.severity,
      confidence: Number(formData.confidence) || 100,
      image_url: formData.image_url,
    };

    try {
      if (currentDetection) {
        // Edit Action
        await detectionResultService.put(currentDetection._id, payload);
      } else {
        // Create Action
        await detectionResultService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchDetections();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu phát hiện.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedDetectionId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedDetectionId) {
      try {
        await detectionResultService.delete(selectedDetectionId);
        fetchDetections();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa kết quả phát hiện.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedDetectionId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const severities = ["All", ...Array.from(new Set(detections.map((d) => d.severity).filter(Boolean)))];
  const severityLabels: Record<string, string> = {
    All: "Tất cả",
    ...SEVERITY_VI,
  };
  const predictions = ["All", ...Array.from(new Set(detections.map((d) => d.disease_name).filter(Boolean)))];

  // Client-side filtering for unsupported backend filters
  const filteredDetections = detections.filter((d) => {
    const matchesInspection = selectedInspectionId === "All" || d.inspection_id === selectedInspectionId;
    const matchesSeverity = selectedSeverity === "All" || d.severity === selectedSeverity;
    const matchesPrediction = selectedPrediction === "All" || d.disease_name === selectedPrediction;

    return matchesInspection && matchesSeverity && matchesPrediction;
  });

  // Dynamic statistics aggregations
  const highConfidenceDetections = detections.filter((d) => (d.confidence || 0) >= 90).length;
  const averageConfidence = detections.length > 0
    ? Math.round(detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / detections.length)
    : 0;
  const severeDetections = detections.filter((d) => d.severity === "Severe").length;

  // Column mapping
  const columns = [
    { key: "prediction", label: "Dự đoán", width: "1fr" },
    { key: "inspection_code", label: "Kiểm tra", width: "130px" },
    { key: "tree_code", label: "Cây", width: "120px" },
    { key: "severity", label: "Mức độ", width: "110px" },
    { key: "confidence", label: "Độ tin cậy", width: "110px" },
    { key: "image_url", label: "Ảnh", width: "100px" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredDetections.map((row) => ({
    prediction: <span className="font-semibold text-gray-900">{row.disease_name}</span>,
    inspection_code: <span className="text-gray-600 font-semibold">{row.inspection_code}</span>,
    tree_code: <span className="text-gray-600 font-semibold">{row.tree_code}</span>,
    severity: (
      <StatusChip
        label={row.severity}
        variant={getSeverityChipVariant(row.severity)}
      />
    ),
    confidence: <span className="text-gray-700 whitespace-nowrap">{row.confidence}%</span>,
    image_url: (
      <div className="w-12 h-12 rounded-[10px] overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center">
        {row.image_url ? (
          <img
            src={row.image_url}
            alt={row.disease_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-gray-400">Không có ảnh</span>
        )}
      </div>
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
          aria-label="Chỉnh sửa kết quả phát hiện"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Xóa kết quả phát hiện"
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
        title="Kết quả nhận diện"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm kết quả phát hiện..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm kết quả phát hiện</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Kiểm tra:</span>
          <select value={selectedInspectionId} onChange={(e) => { setSelectedInspectionId(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo lượt kiểm tra" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">Tất cả</option>
            {inspections.map((i) => (<option key={i._id} value={i._id}>{i.inspection_code}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Mức độ:</span>
          <select value={selectedSeverity} onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo mức độ" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {severities.map((s) => (<option key={s} value={s}>{severityLabels[s] || s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Dự đoán:</span>
          <select value={selectedPrediction} onChange={(e) => { setSelectedPrediction(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo dự đoán" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {predictions.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng kết quả phát hiện" value={loading ? "..." : totalDetections} icon={Scan} />
        <StatCard compact title="Độ tin cậy cao" value={loading ? "..." : highConfidenceDetections} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Độ tin cậy TB" value={loading ? "..." : `${averageConfidence}%`} icon={Sprout} color="text-amber-600" />
        <StatCard compact title="Trường hợp nghiêm trọng" value={loading ? "..." : severeDetections} icon={Grid} color="text-indigo-600" />
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
        total={totalDetections}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={drawerMode === "edit" ? "Chỉnh sửa kết quả phát hiện" : "Thêm kết quả phát hiện"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Dự đoán
            </label>
            <input
              type="text"
              value={formData.prediction}
              onChange={(e) => setFormData({ ...formData, prediction: e.target.value })}
              placeholder="VD: Leaf Spot"
              aria-label="Dự đoán"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Kiểm tra
            </label>
            <select
              value={formData.inspection_id}
              onChange={(e) => setFormData({ ...formData, inspection_id: e.target.value })}
              aria-label="Kiểm tra"
             
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Chọn lượt kiểm tra</option>
              {inspections.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.inspection_code}
                </option>
              ))}
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
              placeholder="VD: 92.5"
              aria-label="Phần trăm độ tin cậy"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mức độ
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              aria-label="Mức độ"
             
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="Mild">Nhẹ</option>
              <option value="Moderate">Trung bình</option>
              <option value="Severe">Nghiêm trọng</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              URL ảnh
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="VD: https://example.com/leaf.jpg"
              aria-label="URL ảnh"
             
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết kết quả phát hiện"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? (() => {
                const ext = detailRecord as unknown as Record<string, unknown>;
                const inspection = inspectionMap.get(String(detailRecord.inspection_id));
                const extInspection = inspection as unknown as Record<string, unknown> | undefined;
                const tree = treeMap.get(String(detailRecord.tree_id));

                const modelName = ext.model || ext.ai_model || extInspection?.model || extInspection?.ai_model || null;

                const conf = detailRecord.confidence;
                const confBadge =
                  conf == null ? null :
                  conf >= 80 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {conf >= 90 ? "Rất cao" : "Cao"} ({conf}%)
                    </span>
                  ) :
                  conf >= 60 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Trung bình ({conf}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-red-50 text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Thấp ({conf}%)
                    </span>
                  );

                const healthStatus = extInspection?.health_status;
                const statusBadge = healthStatus ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                    healthStatus === "Healthy" ? "bg-emerald-50 text-emerald-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      healthStatus === "Healthy" ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                    {healthStatus === "Healthy" ? vi(STATUS_VI, "Healthy") : vi(STATUS_VI, "Diseased")}
                  </span>
                ) : null;

                let resolvedZoneId = "";
                if (extInspection?.zone_id) {
                  resolvedZoneId = String(extInspection.zone_id);
                } else if (tree) {
                  resolvedZoneId = String(tree.zone_id || "");
                }
                const zone = resolvedZoneId ? zoneMap.get(resolvedZoneId) : null;
                const zoneName = zone ? zone.zone_name || zone.zone_code || null : null;
                const farmId = zone ? String(zone.farm_id || "") : "";
                const farm = farmId ? farmMap.get(farmId) : null;
                const farmName = farm ? farm.farm_name || null : null;

                const inspectionDate = extInspection?.inspection_date as string | undefined;

                const hasEnvData = extInspection && (
                  extInspection.temperature != null ||
                  extInspection.humidity != null ||
                  extInspection.rainfall != null
                );

                return [
                  {
                    title: "AI nhận diện",
                    fields: [
                      ...(modelName ? [{ label: "Model AI", value: String(modelName) }] : []),
                      { label: "Bệnh dự đoán", value: detailRecord.disease_name },
                      ...(confBadge ? [{ label: "Độ tin cậy", value: confBadge }] : []),
                      ...(statusBadge ? [{ label: "Trạng thái", value: statusBadge }] : []),
                    ],
                  },
                  {
                    title: "Thông tin kiểm tra",
                    fields: [
                      { label: "Mã kiểm tra", value: detailRecord.inspection_code },
                      ...(inspectionDate ? [{ label: "Ngày kiểm tra", value: formatDateTime(inspectionDate) }] : []),
                      ...(detailRecord.tree_code ? [{ label: "Tree Digital ID", value: detailRecord.tree_code }] : []),
                    ],
                  },
                  ...(farmName || zoneName
                    ? [{
                        title: "Vị trí",
                        fields: [
                          ...(farmName ? [{ label: "Trang trại", value: farmName }] : []),
                          ...(zoneName ? [{ label: "Khu vực", value: zoneName }] : []),
                        ],
                      }]
                    : []),
                  ...(hasEnvData
                    ? [{
                        title: "Điều kiện môi trường",
                        fields: [
                          ...(extInspection.temperature != null
                            ? [{
                                label: "Nhiệt độ",
                                value: (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-[15px]">🌡️</span>
                                    <span>{String(extInspection.temperature)}°C</span>
                                  </span>
                                ),
                              }]
                            : []),
                          ...(extInspection.humidity != null
                            ? [{
                                label: "Độ ẩm",
                                value: (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-[15px]">💧</span>
                                    <span>{String(extInspection.humidity)}%</span>
                                  </span>
                                ),
                              }]
                            : []),
                          ...(extInspection.rainfall != null
                            ? [{
                                label: "Lượng mưa",
                                value: (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-[15px]">🌧️</span>
                                    <span>{String(extInspection.rainfall)} mm</span>
                                  </span>
                                ),
                              }]
                            : []),
                        ],
                      }]
                    : []),
                  {
                    title: "Thời gian",
                    fields: [
                      { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                    ],
                  },
                ];
              })()
            : []
        }
      />

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Xóa kết quả phát hiện"
        description="Bạn có chắc chắn muốn xóa kết quả phát hiện này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedDetectionId(null);
        }}
      />
    </div>
  );
}
