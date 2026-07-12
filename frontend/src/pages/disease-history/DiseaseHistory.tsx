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
import { diseaseHistoryService } from "../../services/diseaseHistory.service";
import { treeService } from "../../services/tree.service";
import { detectionResultService } from "../../services/detectionResult.service";
import { inspectionService } from "../../services/inspection.service";
import type { DiseaseHistory } from "../../types/diseaseHistory";
import type { Tree } from "../../types/tree";
import type { DetectionResult } from "../../types/detectionResult";
import type { Inspection } from "../../types/inspection";

export default function DiseaseHistoryPage() {
  // Live API data states
  const [history, setHistory] = useState<DiseaseHistory[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTreeId, setSelectedTreeId] = useState("All");
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  void selectedStatus;
  void setSelectedStatus;

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DiseaseHistory | null>(null);
  const [formData, setFormData] = useState({
    disease_name: "",
    tree_id: "",
    detection_result_id: "",
    inspection_id: "",
    severity: "Mild",
    confidence: 100,
    status: "Active",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Build query params and fetch disease history from server
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
        const msg = err instanceof Error ? err.message : "Failed to load disease history details.";
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
        treeService.get({ params: { per_page: 100 } }),
        detectionResultService.get({ params: { per_page: 100 } }),
        inspectionService.get({ params: { per_page: 100 } }),
      ])
        .then(([historyResult, treesResult, detectionsResult, inspectionsResult]) => {
          if (historyResult.status === "fulfilled") {
            const historyData = historyResult.value;
            const arr = historyData as unknown as DiseaseHistory[];
            setHistory(arr);
            setTotalRecords((historyData as any).total ?? arr.length);
            setTotalPages((historyData as any).total_pages ?? Math.ceil(((historyData as any).total ?? arr.length) / perPage));
          } else {
            const msg = historyResult.reason instanceof Error ? historyResult.reason.message : "Failed to load disease history details.";
            setError(msg);
          }
          if (treesResult.status === "fulfilled") {
            setTrees(treesResult.value);
          }
          if (detectionsResult.status === "fulfilled") {
            setDetections(detectionsResult.value);
          }
          if (inspectionsResult.status === "fulfilled") {
            setInspections(inspectionsResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchHistory();
  }, [currentPage, searchQuery, fetchHistory]);

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

  // Set form states for Add Record
  const handleAddClick = () => {
    setCurrentRecord(null);
    setFormData({
      disease_name: "Leaf Spot",
      tree_id: trees[0]?._id || "",
      detection_result_id: detections[0]?._id || "",
      inspection_id: inspections[0]?._id || "",
      severity: "Mild",
      confidence: 90,
      status: "Active",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Record
  const handleEditClick = (record: DiseaseHistory) => {
    setCurrentRecord(record);
    setFormData({
      disease_name: record.disease_name,
      tree_id: record.tree_id,
      detection_result_id: record.detection_result_id,
      inspection_id: record.inspection_id,
      severity: record.severity,
      confidence: record.confidence,
      status: record.status,
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tree_id: formData.tree_id,
      detection_result_id: formData.detection_result_id,
      inspection_id: formData.inspection_id,
      disease_name: formData.disease_name,
      severity: formData.severity,
      confidence: Number(formData.confidence) || 100,
      status: formData.status,
    };

    try {
      if (currentRecord) {
        // Edit Action
        await diseaseHistoryService.put(currentRecord._id, payload);
      } else {
        // Create Action
        await diseaseHistoryService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving disease history record.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedRecordId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedRecordId) {
      try {
        await diseaseHistoryService.delete(selectedRecordId);
        fetchHistory();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting record.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedRecordId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const diseases = ["All", ...Array.from(new Set(history.map((h) => h.disease_name).filter(Boolean)))];
  const severities = ["All", ...Array.from(new Set(history.map((h) => h.severity).filter(Boolean)))];
  const statuses = ["All", ...Array.from(new Set(history.map((h) => h.status).filter(Boolean)))];
  void statuses;

  // Client-side filtering for unsupported backend filters
  const filteredHistory = history.filter((h) => {
    const matchesTree = selectedTreeId === "All" || h.tree_id === selectedTreeId;
    const matchesDisease = selectedDisease === "All" || h.disease_name === selectedDisease;
    const matchesSeverity = selectedSeverity === "All" || h.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "All" || h.status === selectedStatus;

    return matchesTree && matchesDisease && matchesSeverity && matchesStatus;
  });

  // Dynamic statistics aggregations
  const resolvedCount = history.filter((h) => h.status === "Resolved").length;
  const pendingCount = history.filter((h) => h.status === "Active" || h.status === "Monitoring").length;
  const uniqueDiseases = new Set(history.map((h) => h.disease_name).filter(Boolean)).size;

  // Column mapping
  const columns = [
    { key: "disease_name", label: "Disease Name", width: "1fr" },
    { key: "tree_code", label: "Tree Code", width: "120px" },
    { key: "severity", label: "Severity", width: "110px" },
    { key: "confidence", label: "Confidence", width: "110px" },
    { key: "image_url", label: "Image Preview", width: "100px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredHistory.map((row) => {
    const detectionResult = detections.find((d) => d._id === row.detection_result_id);
    const imageUrl = detectionResult ? detectionResult.image_url : "";

    return {
      disease_name: <span className="font-semibold text-gray-900">{row.disease_name}</span>,
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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={row.disease_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-gray-400">No Image</span>
          )}
        </div>
      ),
      created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
      actions: (
        <div className="flex items-center justify-end gap-2 pr-6">
          <button
            onClick={() => {}}
            type="button"
            title="View"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            type="button"
            title="Edit"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row._id)}
            type="button"
            title="Delete"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    };
  });

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
      {/* 1. Toolbar */}
      <Toolbar
        title="Disease History"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search history..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
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
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Disease:</span>
          <select value={selectedDisease} onChange={(e) => { setSelectedDisease(e.target.value); setCurrentPage(1); }} aria-label="Filter by disease" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {diseases.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Severity:</span>
          <select value={selectedSeverity} onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }} aria-label="Filter by severity" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {severities.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 2. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Records" value={loading ? "..." : totalRecords} icon={ClipboardList} />
        <StatCard compact title="Resolved" value={loading ? "..." : resolvedCount} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Pending" value={loading ? "..." : pendingCount} icon={Grid} color="text-amber-600" />
        <StatCard compact title="Unique Diseases" value={loading ? "..." : uniqueDiseases} icon={Sprout} color="text-indigo-600" />
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
        total={totalRecords}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentRecord ? "Edit Record" : "Add Record"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Disease Name
            </label>
            <input
              type="text"
              value={formData.disease_name}
              onChange={(e) => setFormData({ ...formData, disease_name: e.target.value })}
              placeholder="e.g. Leaf Spot"
              aria-label="Disease Name"
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
              Inspection
            </label>
            <select
              value={formData.inspection_id}
              onChange={(e) => setFormData({ ...formData, inspection_id: e.target.value })}
              aria-label="Inspection"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select an inspection</option>
              {inspections.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.inspection_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Detection Result
            </label>
            <select
              value={formData.detection_result_id}
              onChange={(e) => setFormData({ ...formData, detection_result_id: e.target.value })}
              aria-label="Detection Result"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select a detection</option>
              {detections.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.disease_name} ({d.tree_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              aria-label="Severity"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
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
              placeholder="e.g. 94.8"
              aria-label="Confidence percentage"
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
              <option value="Active">Active</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Record"
        description="Are you sure you want to delete this disease history record?"
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
