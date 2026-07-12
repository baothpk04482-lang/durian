import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardCheck,
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
import { inspectionService } from "../../services/inspection.service";
import { treeService } from "../../services/tree.service";
import { userService } from "../../services/user.service";
import type { Inspection } from "../../types/inspection";
import type { Tree } from "../../types/tree";
import type { User } from "../../types/user";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalInspections, setTotalInspections] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTreeId, setSelectedTreeId] = useState("All");
  const [selectedInspectorId, setSelectedInspectorId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [formData, setFormData] = useState({
    inspection_code: "",
    tree_id: "",
    inspector_id: "",
    status: "Healthy",
    confidence: 100,
    notes: "",
    inspection_date: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

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
        const msg = err instanceof Error ? err.message : "Failed to load inspection details.";
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
        treeService.get(),
        userService.get(),
      ])
        .then(([inspectionsResult, treesResult, usersResult]) => {
          if (inspectionsResult.status === "fulfilled") {
            const inspectionsData = inspectionsResult.value;
            const arr = inspectionsData as unknown as Inspection[];
            setInspections(arr);
            setTotalInspections((inspectionsData as any).total ?? arr.length);
            setTotalPages((inspectionsData as any).total_pages ?? Math.ceil(((inspectionsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = inspectionsResult.reason instanceof Error ? inspectionsResult.reason.message : "Failed to load inspection details.";
            setError(msg);
          }
          if (treesResult.status === "fulfilled") {
            setTrees(treesResult.value);
          }
          if (usersResult.status === "fulfilled") {
            setUsers(usersResult.value);
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
      inspector_id: users[0]?._id || "",
      status: "Healthy",
      confidence: 100,
      notes: "",
      inspection_date: new Date().toISOString().split("T")[0],
    });
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
      inspector_id: inspection.inspector_id,
      status: inspection.status || inspection.health_status || "Healthy",
      confidence: inspection.confidence ?? 100,
      notes: inspection.notes,
      inspection_date: dateOnly,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tree_id: formData.tree_id,
      inspector_id: formData.inspector_id,
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
      const msg = err instanceof Error ? err.message : "Error saving inspection data.";
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
        const msg = err instanceof Error ? err.message : "Error deleting inspection.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedInspectionId(null);
      }
    }
  };

  const statuses = ["All", "Healthy", "Monitoring", "Diseased"];

  const filteredInspections = inspections.filter((i) => {
    const matchesTree = selectedTreeId === "All" || i.tree_id === selectedTreeId;
    const matchesInspector = selectedInspectorId === "All" || i.inspector_id === selectedInspectorId;
    const matchesStatus = selectedStatus === "All" || (i.status || i.health_status || "Healthy") === selectedStatus;
    return matchesTree && matchesInspector && matchesStatus;
  });

  const healthyCount = inspections.filter((i) => (i.status || i.health_status) === "Healthy").length;
  const today = new Date().toISOString().split("T")[0];
  const todayInspections = inspections.filter((i) => i.inspection_date?.startsWith(today)).length;
  const passRate = totalInspections > 0 ? Math.round((healthyCount / totalInspections) * 100) : 0;

  const columns = [
    { key: "inspection_code", label: "Inspection Code", width: "130px" },
    { key: "tree_code", label: "Tree", width: "1fr" },
    { key: "inspector_name", label: "Inspector", width: "1fr" },
    { key: "health_status", label: "Status", width: "110px" },
    { key: "confidence", label: "Confidence", width: "110px" },
    { key: "notes", label: "Notes", width: "1.5fr" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  const tableRows = filteredInspections.map((row) => ({
    inspection_code: <span className="font-semibold text-gray-900">{row.inspection_code}</span>,
    tree_code: <span className="text-gray-600 font-semibold">{row.tree_code}</span>,
    inspector_name: <span className="text-gray-600 font-semibold">{row.inspector_name}</span>,
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
    created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => {}}
          type="button"
          aria-label="View inspection"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit inspection"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete inspection"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          title="Delete"
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
        title="Inspections"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search inspection..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Inspection</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Tree:</span>
          <select value={selectedTreeId} onChange={(e) => { setSelectedTreeId(e.target.value); setCurrentPage(1); }} aria-label="Filter by tree" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">All</option>
            {trees.map((t) => (<option key={t._id} value={t._id}>{t.tree_code}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Inspector:</span>
          <select value={selectedInspectorId} onChange={(e) => { setSelectedInspectorId(e.target.value); setCurrentPage(1); }} aria-label="Filter by inspector" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">All</option>
            {users.filter((u) => u.role === "Inspector" || u.role === "Admin").map((u) => (<option key={u._id} value={u._id}>{u.full_name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} aria-label="Filter by status" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Inspections" value={loading ? "..." : totalInspections} icon={ClipboardCheck} />
        <StatCard compact title="Total Conditions" value={loading ? "..." : healthyCount} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Inspect. Today" value={loading ? "..." : todayInspections} icon={Grid} color="text-amber-600" />
        <StatCard compact title="Pass Rate" value={loading ? "..." : `${passRate}%`} icon={Sprout} color="text-indigo-600" />
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
        title={currentInspection ? "Edit Inspection" : "Add Inspection"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Inspection Code
            </label>
            <input
              type="text"
              value={formData.inspection_code}
              onChange={(e) => setFormData({ ...formData, inspection_code: e.target.value })}
              placeholder="e.g. INS-0005"
              aria-label="Inspection Code"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tree
            </label>
            <select
              value={formData.tree_id}
              onChange={(e) => setFormData({ ...formData, tree_id: e.target.value })}
              aria-label="Tree"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select a tree</option>
              {trees.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.tree_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Inspector
            </label>
            <select
              value={formData.inspector_id}
              onChange={(e) => setFormData({ ...formData, inspector_id: e.target.value })}
              aria-label="Inspector"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select an inspector</option>
              {users
                .filter((u) => u.role === "Inspector" || u.role === "Admin")
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.full_name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Inspection Date
            </label>
            <input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
              aria-label="Inspection Date"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
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
              <option value="Healthy">Healthy</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Diseased">Diseased</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Confidence (%)
            </label>
            <input
              type="number"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) || 100 })}
              placeholder="e.g. 95.0"
              aria-label="Confidence percentage"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="e.g. Bark looks healthy, no anomalies..."
              aria-label="Notes"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <ConfirmDialog
        title="Delete Inspection"
        description="Are you sure you want to delete this inspection?"
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
