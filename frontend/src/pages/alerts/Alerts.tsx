import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  Building2,
  Sprout,
  Grid,
  Eye,
  Edit2,
  Trash2,
  Plus
} from "lucide-react";
import Toolbar from "../../components/common/Toolbar";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import DrawerForm from "../../components/common/DrawerForm";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import { alertService } from "../../services/alert.service";
import { farmService } from "../../services/farm.service";
import { treeService } from "../../services/tree.service";
import type { Alert } from "../../types/alert";
import type { Farm } from "../../types/farm";
import type { Tree } from "../../types/tree";

export default function AlertsPage() {
  // Live API data states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    farm_id: "",
    content: "",
    status: "unread",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Build query params and fetch alerts from server
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
        const msg = err instanceof Error ? err.message : "Failed to load alert details.";
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
        farmService.get({ params: { per_page: 100 } }),
        treeService.get({ params: { per_page: 100 } }),
      ])
        .then(([alertsResult, farmsResult, treesResult]) => {
          if (alertsResult.status === "fulfilled") {
            const alertsData = alertsResult.value;
            const arr = alertsData as unknown as Alert[];
            setAlerts(arr);
            setTotalAlerts((alertsData as any).total ?? arr.length);
            setTotalPages((alertsData as any).total_pages ?? Math.ceil(((alertsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = alertsResult.reason instanceof Error ? alertsResult.reason.message : "Failed to load alert details.";
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

  const getFarmName = (id: string) => {
    const farm = farms.find((f) => f._id === id || f.farm_code === id);
    return farm ? farm.farm_name : id;
  };

  const getTreeCode = (id: string) => {
    const tree = trees.find((t) => t._id === id);
    return tree ? tree.tree_code : id;
  };

  const getAlertStatusChipVariant = (status: string): "Warning" | "Success" | "Pending" => {
    switch (status) {
      case "unread":
        return "Warning";
      case "read":
        return "Success";
      default:
        return "Pending";
    }
  };

  // Set form states for Add Alert
  const handleAddClick = () => {
    setCurrentAlert(null);
    setFormData({
      title: "",
      farm_id: farms[0]?._id || "",
      content: "",
      status: "unread",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Alert
  const handleEditClick = (alertItem: Alert) => {
    setCurrentAlert(alertItem);
    setFormData({
      title: alertItem.title,
      farm_id: alertItem.farm_id,
      content: alertItem.content,
      status: alertItem.status,
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      farm_id: formData.farm_id,
      title: formData.title,
      content: formData.content,
      status: formData.status,
    };

    try {
      if (currentAlert) {
        // Edit Action
        await alertService.put(currentAlert._id, payload);
      } else {
        // Create Action
        await alertService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchAlerts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving alert data.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedAlertId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedAlertId) {
      try {
        await alertService.delete(selectedAlertId);
        fetchAlerts();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting alert.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedAlertId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const statuses = ["All", "unread", "read"];

  // Client-side filtering for farm/status (unsupported by backend)
  const filteredAlerts = alerts.filter((a) => {
    const matchesFarm = selectedFarmId === "All" || a.farm_id === selectedFarmId;
    const matchesStatus = selectedStatus === "All" || a.status === selectedStatus;
    return matchesFarm && matchesStatus;
  });

  // Dynamic statistics aggregations
  const unreadAlerts = alerts.filter((a) => a.status === "unread").length;
  const readAlerts = alerts.filter((a) => a.status === "read").length;
  const targetFarms = new Set(alerts.map((a) => a.farm_id).filter(Boolean)).size;

  // Column mapping
  const columns = [
    { key: "title", label: "Title", width: "1.2fr" },
    { key: "farm_id", label: "Farm", width: "1fr" },
    { key: "tree_id", label: "Tree", width: "1fr" },
    { key: "content", label: "Content", width: "1.5fr" },
    { key: "status", label: "Status", width: "110px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredAlerts.map((row) => ({
    title: <span className="font-semibold text-gray-900">{row.title}</span>,
    farm_id: <span className="text-gray-600 font-semibold">{getFarmName(row.farm_id)}</span>,
    tree_id: <span className="text-gray-600 font-semibold">{row.tree_id ? getTreeCode(row.tree_id) : "N/A"}</span>,
    content: (
      <span className="text-gray-500 truncate max-w-[250px] block" title={row.content}>
        {row.content}
      </span>
    ),
    status: (
      <StatusChip
        label={row.status === "unread" ? "Unread" : "Read"}
        variant={getAlertStatusChipVariant(row.status)}
      />
    ),
    created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => {}}
          type="button"
          aria-label="View alert"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit alert"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete alert"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          title="Delete"
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
        Cancel
      </button>
      <button
        onClick={handleSave}
        type="button"
        className="px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-[14px] font-semibold hover:bg-emerald-700 transition-all"
      >
        Save
      </button>
    </div>
  );

  const emptyState = error ? (
    <div className="text-red-600 text-sm font-semibold py-6 text-center">
      {error}. Please try again later.
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col h-full space-y-4">
      <Toolbar
        title="Alerts"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search alert..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Alert</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Farm:</span>
          <select value={selectedFarmId} onChange={(e) => { setSelectedFarmId(e.target.value); setCurrentPage(1); }} aria-label="Filter by farm" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">All</option>
            {farms.map((f) => (<option key={f._id} value={f._id}>{f.farm_name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} aria-label="Filter by status" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {statuses.map((s) => (<option key={s} value={s}>{s === "unread" ? "Unread" : s === "read" ? "Read" : "All"}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Alerts" value={loading ? "..." : totalAlerts.toLocaleString()} icon={ClipboardList} />
        <StatCard compact title="Unread Alerts" value={loading ? "..." : unreadAlerts} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Read Alerts" value={loading ? "..." : readAlerts} icon={Building2} color="text-amber-600" />
        <StatCard compact title="Target Farms" value={loading ? "..." : targetFarms} icon={Grid} color="text-indigo-600" />
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
        total={totalAlerts}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentAlert ? "Edit Alert" : "Add Alert"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Leaf Spot Infection"
              aria-label="Title"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Farm
            </label>
            <select
              value={formData.farm_id}
              onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
              aria-label="Farm"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select a farm</option>
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.farm_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              placeholder="e.g. AI detected Leaf Spot..."
              aria-label="Content"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              aria-label="Status"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Alert"
        description="Are you sure you want to delete this alert?"
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
