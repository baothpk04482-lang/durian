import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  TreePine,
  Sprout,
  Stethoscope,
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
import { loadAllPages } from "../../utils/loadAllPages";
import { diseaseHistoryService } from "../../services/diseaseHistory.service";
import { treeService } from "../../services/tree.service";
import type { DiseaseHistory } from "../../types/diseaseHistory";
import type { Tree } from "../../types/tree";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, ACTION_VI } from "../../utils/translate";

export default function DiseaseHistoryPage() {
  const [history, setHistory] = useState<DiseaseHistory[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DiseaseHistory | null>(null);
  const [formData, setFormData] = useState({
    disease: "",
    tree_id: "",
    date: "",
    action: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<DiseaseHistory | null>(null);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    diseaseHistoryService.get<DiseaseHistory[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as DiseaseHistory[];
        setHistory(arr);
        setTotalRecords((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết lịch sử bệnh.";
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
        diseaseHistoryService.get<DiseaseHistory[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(treeService),
      ])
        .then(([historyResult, treesResult]) => {
          if (historyResult.status === "fulfilled") {
            const historyData = historyResult.value;
            const arr = historyData as unknown as DiseaseHistory[];
            setHistory(arr);
            setTotalRecords((historyData as any).total ?? arr.length);
            setTotalPages((historyData as any).total_pages ?? Math.ceil(((historyData as any).total ?? arr.length) / perPage));
          } else {
            const msg = historyResult.reason instanceof Error ? historyResult.reason.message : "Không thể tải chi tiết lịch sử bệnh.";
            setError(msg);
          }
          if (treesResult.status === "fulfilled") {
            setTrees(treesResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchHistory();
  }, [currentPage, searchQuery, fetchHistory]);

  const handleAddClick = () => {
    setCurrentRecord(null);
    setFormData({
      disease: "",
      tree_id: trees[0]?._id || "",
      date: new Date().toISOString().split("T")[0],
      action: "",
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleEditClick = (record: DiseaseHistory) => {
    setCurrentRecord(record);
    setFormData({
      disease: record.disease,
      tree_id: record.tree_id,
      date: record.date,
      action: record.action,
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (record: DiseaseHistory) => {
    setDetailRecord(record);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tree_id: formData.tree_id,
      disease: formData.disease,
      date: formData.date,
      action: formData.action,
    };

    try {
      if (currentRecord) {
        await diseaseHistoryService.put(currentRecord._id, payload);
      } else {
        await diseaseHistoryService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu bản ghi lịch sử bệnh.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedRecordId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedRecordId) {
      try {
        await diseaseHistoryService.delete(selectedRecordId);
        fetchHistory();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa bản ghi.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedRecordId(null);
      }
    }
  };

  const filteredHistory = history;

  const processedCount = history.filter((h) =>
    h.action && h.action.toLowerCase().includes("treatment")
  ).length;
  const unprocessedCount = history.length - processedCount;
  const uniqueDiseases = new Set(history.map((h) => h.disease).filter(Boolean)).size;

  const columns = [
    { key: "disease", label: "Tên bệnh", width: "1fr" },
    { key: "tree_code", label: "Mã cây", width: "120px" },
    { key: "action", label: "Hành động", width: "140px" },
    { key: "date", label: "Ngày phát sinh", width: "140px" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredHistory.map((row) => {
    return {
      disease: <span className="font-semibold text-gray-900">{row.disease}</span>,
      tree_code: <span className="text-gray-700">{row.tree_code ?? ""}</span>,
      action: <span className="text-gray-700">{vi(ACTION_VI, row.action) || row.action}</span>,
      date: <span className="text-gray-500">{formatDateTime(row.date)}</span>,
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
            title="Chỉnh sửa"
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
    };
  });

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
        title="Lịch sử phát sinh bệnh"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm lịch sử bệnh..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm bản ghi</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng bản ghi" value={loading ? "..." : totalRecords} icon={ClipboardList} />
        <StatCard compact title="Đã xử lý" value={loading ? "..." : processedCount} icon={Stethoscope} color="text-blue-600" />
        <StatCard compact title="Chưa xử lý" value={loading ? "..." : unprocessedCount} icon={TreePine} color="text-amber-600" />
        <StatCard compact title="Số bệnh khác nhau" value={loading ? "..." : uniqueDiseases} icon={Sprout} color="text-indigo-600" />
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
        total={totalRecords}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={drawerMode === "edit" ? "Chỉnh sửa bản ghi" : "Thêm bản ghi"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tên bệnh
            </label>
            <input
              type="text"
              value={formData.disease}
              onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
              placeholder="VD: Đốm lá"
              aria-label="Tên bệnh"
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
              Ngày phát sinh
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-label="Ngày phát sinh"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hành động
            </label>
            <input
              type="text"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              placeholder="VD: Treatment"
              aria-label="Hành động"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết bản ghi bệnh"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? [
                {
                  title: "Thông tin bệnh",
                  fields: [
                    { label: "Tên bệnh", value: detailRecord.disease },
                  ],
                },
                ...(detailRecord.tree_code
                  ? [{
                      title: "Thông tin cây",
                      fields: [
                        { label: "Mã cây", value: detailRecord.tree_code },
                      ],
                    }]
                  : []),
                {
                  title: "Xử lý",
                  fields: [
                    { label: "Hành động", value: vi(ACTION_VI, detailRecord.action) || detailRecord.action },
                  ],
                },
                {
                  title: "Thời gian",
                  fields: [
                    { label: "Ngày phát sinh", value: formatDateTime(detailRecord.date) },
                    { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                  ],
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        title="Xóa bản ghi"
        description="Bạn có chắc chắn muốn xóa bản ghi lịch sử bệnh này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedRecordId(null);
        }}
      />
    </div>
  );
}