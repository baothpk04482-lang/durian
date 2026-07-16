import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  TreePine,
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
import { diseaseService } from "../../services/disease.service";
import type { Disease } from "../../types/disease";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, PART_VI } from "../../utils/translate";

export default function DiseasesPage() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalDiseases, setTotalDiseases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDisease, setCurrentDisease] = useState<Disease | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    affected_part: "",
    severity: "Mild",
    description: "",
    recommendation: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<Disease | null>(null);

  const fetchDiseases = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    diseaseService.get<Disease[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Disease[];
        setDiseases(arr);
        setTotalDiseases((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết bệnh.";
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

      diseaseService.get<Disease[] & { total?: number; total_pages?: number }>({ params })
        .then((data) => {
          const arr = data as unknown as Disease[];
          setDiseases(arr);
          setTotalDiseases((data as any).total ?? arr.length);
          setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Không thể tải chi tiết bệnh.";
          setError(msg);
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchDiseases();
  }, [currentPage, searchQuery, fetchDiseases]);

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

  const parseSeverityTokens = (severity: string | undefined | null): string[] =>
    typeof severity === "string" ? severity.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const SEVERITY_TOKEN_VI: Record<string, string> = {
    mild: "Nhẹ",
    moderate: "Trung bình",
    severe: "Nghiêm trọng",
    critical: "Rất nghiêm trọng",
    none: "Không",
  };

  const translateSeverityToken = (token: string): string =>
    SEVERITY_TOKEN_VI[token.toLowerCase()] || token;

  const hasSeverity = (severityStr: string, target: string): boolean =>
    parseSeverityTokens(severityStr).some((t) => t.toLowerCase() === target.toLowerCase());

  const handleAddClick = () => {
    setCurrentDisease(null);
    setFormData({
      code: "",
      name: "",
      affected_part: "",
      severity: "Mild",
      description: "",
      recommendation: "",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleEditClick = (disease: Disease) => {
    setCurrentDisease(disease);
    setFormData({
      code: disease.code || "",
      name: disease.name || "",
      affected_part: disease.affected_part || "",
      severity: disease.severity || "Mild",
      description: disease.description || "",
      recommendation: disease.recommendation || "",
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (disease: Disease) => {
    setDetailRecord(disease);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code,
      name: formData.name,
      affected_part: formData.affected_part,
      severity: formData.severity,
      description: formData.description,
      recommendation: formData.recommendation,
    };

    try {
      if (currentDisease) {
        await diseaseService.put(currentDisease._id, payload);
      } else {
        await diseaseService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchDiseases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu bệnh.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedDiseaseId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDiseaseId) {
      try {
        await diseaseService.delete(selectedDiseaseId);
        fetchDiseases();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa bệnh.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedDiseaseId(null);
      }
    }
  };

  const severities = ["All", ...Array.from(new Set(diseases.flatMap((d) => parseSeverityTokens(d.severity))))];
  const severityLabels: Record<string, string> = {
    All: "Tất cả",
    ...SEVERITY_TOKEN_VI,
  };

  const filteredDiseases = diseases.filter((d) => {
    return selectedSeverity === "All" || hasSeverity(d.severity, selectedSeverity);
  });

  const severeCount = filteredDiseases.filter((d) => hasSeverity(d.severity, "severe")).length;
  const moderateCount = filteredDiseases.filter((d) => hasSeverity(d.severity, "moderate")).length;

  const columns = [
    { key: "code", label: "Mã bệnh", width: "120px" },
    { key: "name", label: "Tên bệnh", width: "1fr" },
    { key: "affected_part", label: "Bộ phận ảnh hưởng", width: "1fr" },
    { key: "severity", label: "Mức độ", width: "110px" },
    { key: "description", label: "Mô tả", width: "1.5fr" },
    { key: "recommendation", label: "Phương pháp xử lý", width: "1.5fr" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredDiseases.map((row) => ({
    code: <span className="font-semibold text-gray-900">{row.code}</span>,
    name: <span className="text-gray-700">{row.name}</span>,
    affected_part: <span className="text-gray-600">{(row.affected_part ?? "").split(",").map((t: string) => vi(PART_VI, t.trim()) || t.trim()).filter(Boolean).join(", ") || "—"}</span>,
    severity: (
      <span className="flex flex-wrap gap-1">
        {parseSeverityTokens(row.severity).map((token) => (
          <StatusChip
            key={token}
            label={translateSeverityToken(token)}
            variant={getSeverityChipVariant(token)}
          />
        ))}
      </span>
    ),
    description: (
      <span className="text-gray-500 truncate max-w-[150px] block" title={row.description || ""}>
        {row.description || "—"}
      </span>
    ),
    recommendation: (
      <span className="text-gray-500 truncate max-w-[150px] block" title={row.recommendation}>
        {row.recommendation}
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
          aria-label="Chỉnh sửa bệnh"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Xóa bệnh"
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
        title="Bệnh"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm bệnh..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm bệnh</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Mức độ:</span>
          <select value={selectedSeverity} onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo mức độ" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {severities.map((s) => (<option key={s} value={s}>{severityLabels[s] || s}</option>))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng bệnh" value={loading ? "..." : totalDiseases} icon={ClipboardList} />
        <StatCard compact title="Nghiêm trọng" value={loading ? "..." : severeCount} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Trung bình" value={loading ? "..." : moderateCount} icon={TreePine} color="text-amber-600" />
        <StatCard compact title="Bệnh hiện có" value={loading ? "..." : filteredDiseases.length} icon={Grid} color="text-indigo-600" />
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
        total={totalDiseases}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={drawerMode === "edit" ? "Chỉnh sửa bệnh" : "Thêm bệnh"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mã bệnh
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="VD: DISEASE-001"
              aria-label="Mã bệnh"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tên bệnh
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Đốm lá"
              aria-label="Tên bệnh"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Bộ phận ảnh hưởng
            </label>
            <input
              type="text"
              value={formData.affected_part}
              onChange={(e) => setFormData({ ...formData, affected_part: e.target.value })}
              placeholder="VD: Lá, Thân, Rễ"
              aria-label="Bộ phận ảnh hưởng"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Mức độ nghiêm trọng
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              aria-label="Mức độ nghiêm trọng"
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
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="VD: Nhiễm trùng nấm gây ra các đốm..."
              aria-label="Mô tả"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Phương pháp xử lý
            </label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={3}
              placeholder="VD: Phun thuốc diệt nấm đồng mỗi 14 ngày..."
              aria-label="Phương pháp xử lý"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết bệnh"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? [
                {
                  title: "Thông tin chung",
                  fields: [
                    { label: "Mã bệnh", value: detailRecord.code },
                    { label: "Tên bệnh", value: detailRecord.name },
                    { label: "Bộ phận ảnh hưởng", value: (detailRecord.affected_part ?? "").split(",").map((t: string) => vi(PART_VI, t.trim()) || t.trim()).filter(Boolean).join(", ") || "—" },
                    {
                      label: "Mức độ",
                      value: (
                        <span className="flex flex-wrap gap-1">
                          {parseSeverityTokens(detailRecord.severity).map((token) => (
                            <StatusChip
                              key={token}
                              label={translateSeverityToken(token)}
                              variant={getSeverityChipVariant(token)}
                            />
                          ))}
                        </span>
                      ),
                    },
                  ],
                },
                {
                  title: "Mô tả & Xử lý",
                  fields: [
                    { label: "Mô tả", value: detailRecord.description || "—" },
                    { label: "Phương pháp xử lý", value: detailRecord.recommendation },
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

      <ConfirmDialog
        title="Xóa bệnh"
        description="Bạn có chắc chắn muốn xóa bệnh này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedDiseaseId(null);
        }}
      />
    </div>
  );
}
