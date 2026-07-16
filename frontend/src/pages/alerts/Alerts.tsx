import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ClipboardList,
  Building2,
  TreePine,
  Bug,
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
import { alertService } from "../../services/alert.service";
import { farmService } from "../../services/farm.service";
import { treeService } from "../../services/tree.service";
import type { Alert } from "../../types/alert";
import type { Farm } from "../../types/farm";
import type { Tree } from "../../types/tree";
import { formatDateTime } from "../../utils/dateFormatter";
import { vi, ALERT_TYPE_VI, PRIORITY_VI } from "../../utils/translate";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalAlerts, setTotalAlerts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState({
    alert_type: "",
    farm_id: "",
    tree_id: "",
    priority: "",
    date: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailRecord, setDetailRecord] = useState<Alert | null>(null);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    alertService.get<Alert[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Alert[];
        setAlerts(arr);
        setTotalAlerts((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải chi tiết cảnh báo.";
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
        alertService.get<Alert[] & { total?: number; total_pages?: number }>({ params }),
        loadAllPages(farmService),
        loadAllPages(treeService),
      ])
        .then(([alertsResult, farmsResult, treesResult]) => {
          if (alertsResult.status === "fulfilled") {
            const alertsData = alertsResult.value;
            const arr = alertsData as unknown as Alert[];
            setAlerts(arr);
            setTotalAlerts((alertsData as any).total ?? arr.length);
            setTotalPages((alertsData as any).total_pages ?? Math.ceil(((alertsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = alertsResult.reason instanceof Error ? alertsResult.reason.message : "Không thể tải chi tiết cảnh báo.";
            setError(msg);
          }
          if (farmsResult.status === "fulfilled") {
            setFarms(farmsResult.value);
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

    fetchAlerts();
  }, [currentPage, searchQuery, fetchAlerts]);

  const treeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of trees) {
      map.set(String(t._id), t.tree_code);
    }
    return map;
  }, [trees]);

  const getFarmName = (id: string) => {
    const farm = farms.find((f) => f._id === id || f.farm_code === id);
    return farm ? farm.farm_name : "";
  };

  const getTreeCode = (id: string) => {
    return treeMap.get(String(id)) ?? "";
  };

  const handleAddClick = () => {
    setCurrentAlert(null);
    setFormData({
      alert_type: "",
      farm_id: farms[0]?._id || "",
      tree_id: "",
      priority: "High",
      date: new Date().toISOString().split("T")[0],
    });
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleEditClick = (alertItem: Alert) => {
    setCurrentAlert(alertItem);
    setFormData({
      alert_type: alertItem.alert_type,
      farm_id: alertItem.farm_id,
      tree_id: alertItem.tree_id || "",
      priority: alertItem.priority,
      date: alertItem.date?.split(" ")[0] || alertItem.date || "",
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleViewClick = (alertItem: Alert) => {
    setDetailRecord(alertItem);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      farm_id: formData.farm_id,
      tree_id: formData.tree_id || undefined,
      alert_type: formData.alert_type,
      priority: formData.priority,
      date: formData.date,
    };

    try {
      if (currentAlert) {
        await alertService.put(currentAlert._id, payload);
      } else {
        await alertService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchAlerts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu cảnh báo.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedAlertId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAlertId) {
      try {
        await alertService.delete(selectedAlertId);
        fetchAlerts();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi khi xóa cảnh báo.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedAlertId(null);
      }
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    return selectedFarmId === "All" || a.farm_id === selectedFarmId;
  });

  const uniqueTypes = new Set(alerts.map((a) => a.alert_type).filter(Boolean)).size;
  const targetFarms = new Set(alerts.map((a) => a.farm_id).filter(Boolean)).size;
  const targetTrees = new Set(alerts.map((a) => a.tree_id).filter(Boolean)).size;

  const columns = [
    { key: "alert_type", label: "Loại cảnh báo", width: "1fr" },
    { key: "farm_id", label: "Trang trại", width: "1fr" },
    { key: "tree_id", label: "Cây", width: "1fr" },
    { key: "priority", label: "Mức ưu tiên", width: "120px" },
    { key: "date", label: "Ngày cảnh báo", width: "140px" },
    { key: "created_at", label: "Ngày tạo", width: "140px" },
    { key: "actions", label: "Thao tác", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredAlerts.map((row) => ({
    alert_type: <span className="font-semibold text-gray-900">{vi(ALERT_TYPE_VI, row.alert_type) || row.alert_type}</span>,
    farm_id: <span className="text-gray-600 font-semibold">{getFarmName(row.farm_id)}</span>,
    tree_id: <span className="text-gray-600 font-semibold">{row.tree_id ? getTreeCode(row.tree_id) : "—"}</span>,
    priority: <span className="text-gray-700">{vi(PRIORITY_VI, row.priority) || row.priority}</span>,
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
          aria-label="Chỉnh sửa cảnh báo"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Xóa cảnh báo"
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
        title="Cảnh báo"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Tìm cảnh báo..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Thêm cảnh báo</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Trang trại:</span>
          <select value={selectedFarmId} onChange={(e) => { setSelectedFarmId(e.target.value); setCurrentPage(1); }} aria-label="Lọc theo trang trại" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">Tất cả</option>
            {farms.map((f) => (<option key={f._id} value={f._id}>{f.farm_name}</option>))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Tổng cảnh báo" value={loading ? "..." : totalAlerts.toLocaleString()} icon={ClipboardList} />
        <StatCard compact title="Loại cảnh báo" value={loading ? "..." : uniqueTypes} icon={Bug} color="text-blue-600" />
        <StatCard compact title="Trang trại bị ảnh hưởng" value={loading ? "..." : targetFarms} icon={Building2} color="text-amber-600" />
        <StatCard compact title="Cây bị ảnh hưởng" value={loading ? "..." : targetTrees} icon={TreePine} color="text-indigo-600" />
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
        total={totalAlerts}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={drawerMode === "edit" ? "Sửa cảnh báo" : "Thêm cảnh báo"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Loại cảnh báo
            </label>
            <input
              type="text"
              value={formData.alert_type}
              onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
              placeholder="VD: Leaf Spot"
              aria-label="Loại cảnh báo"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Trang trại
            </label>
            <select
              value={formData.farm_id}
              onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
              aria-label="Trang trại"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Chọn trang trại</option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.farm_name}
                </option>
              ))}
            </select>
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
              Mức ưu tiên
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              aria-label="Mức ưu tiên"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Chọn mức ưu tiên</option>
              <option value="Critical">Khẩn cấp</option>
              <option value="High">Cao</option>
              <option value="Medium">Trung bình</option>
              <option value="Low">Thấp</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Ngày cảnh báo
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-label="Ngày cảnh báo"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <RecordDetailDrawer
        title="Chi tiết cảnh báo"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        sections={
          detailRecord
            ? [
                {
                  title: "Thông tin cảnh báo",
                  fields: [
                    { label: "Loại cảnh báo", value: vi(ALERT_TYPE_VI, detailRecord.alert_type) || detailRecord.alert_type },
                    { label: "Mức ưu tiên", value: vi(PRIORITY_VI, detailRecord.priority) || detailRecord.priority },
                  ],
                },
                {
                  title: "Vị trí",
                  fields: [
                    { label: "Trang trại", value: getFarmName(detailRecord.farm_id) },
                    ...(detailRecord.tree_id
                      ? [{ label: "Cây", value: getTreeCode(detailRecord.tree_id) }]
                      : []),
                  ],
                },
                {
                  title: "Thời gian",
                  fields: [
                    { label: "Ngày cảnh báo", value: formatDateTime(detailRecord.date) },
                    { label: "Ngày tạo", value: formatDateTime(detailRecord.created_at) },
                  ],
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        title="Xóa cảnh báo"
        description="Bạn có chắc chắn muốn xóa cảnh báo này?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedAlertId(null);
        }}
      />
    </div>
  );
}
