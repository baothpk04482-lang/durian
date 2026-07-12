import { useState, useEffect, useCallback, useRef } from "react";
import {
  Scan,
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
import { detectionResultService } from "../../services/detectionResult.service";
import { inspectionService } from "../../services/inspection.service";
import { treeService } from "../../services/tree.service";
import type { DetectionResult } from "../../types/detectionResult";
import type { Inspection } from "../../types/inspection";
import type { Tree } from "../../types/tree";

export default function DetectionResultsPage() {
  // Live API data states
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  void trees;
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
        const msg = err instanceof Error ? err.message : "Failed to load detection details.";
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
        inspectionService.get({ params: { per_page: 100 } }),
        treeService.get({ params: { per_page: 100 } }),
      ])
        .then(([detectionsResult, inspectionsResult, treesResult]) => {
          if (detectionsResult.status === "fulfilled") {
            const detectionsData = detectionsResult.value;
            const arr = detectionsData as unknown as DetectionResult[];
            setDetections(arr);
            setTotalDetections((detectionsData as any).total ?? arr.length);
            setTotalPages((detectionsData as any).total_pages ?? Math.ceil(((detectionsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = detectionsResult.reason instanceof Error ? detectionsResult.reason.message : "Failed to load detection details.";
            setError(msg);
          }
          if (inspectionsResult.status === "fulfilled") {
            setInspections(inspectionsResult.value);
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
    setIsDrawerOpen(true);
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
      const msg = err instanceof Error ? err.message : "Error saving detection data.";
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
        const msg = err instanceof Error ? err.message : "Error deleting detection result.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedDetectionId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const severities = ["All", ...Array.from(new Set(detections.map((d) => d.severity).filter(Boolean)))];
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
    { key: "prediction", label: "Prediction", width: "1fr" },
    { key: "inspection_code", label: "Inspection", width: "130px" },
    { key: "tree_code", label: "Tree", width: "120px" },
    { key: "severity", label: "Severity", width: "110px" },
    { key: "confidence", label: "Confidence", width: "110px" },
    { key: "image_url", label: "Image", width: "100px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
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
          aria-label="View detection result"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit detection result"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete detection result"
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
        title="Detection Results"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search detection..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Detection</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Inspection:</span>
          <select value={selectedInspectionId} onChange={(e) => { setSelectedInspectionId(e.target.value); setCurrentPage(1); }} aria-label="Filter by inspection" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">All</option>
            {inspections.map((i) => (<option key={i._id} value={i._id}>{i.inspection_code}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Severity:</span>
          <select value={selectedSeverity} onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }} aria-label="Filter by severity" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {severities.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Prediction:</span>
          <select value={selectedPrediction} onChange={(e) => { setSelectedPrediction(e.target.value); setCurrentPage(1); }} aria-label="Filter by prediction" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {predictions.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Detections" value={loading ? "..." : totalDetections} icon={Scan} />
        <StatCard compact title="High Confidence" value={loading ? "..." : highConfidenceDetections} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Avg Confidence" value={loading ? "..." : `${averageConfidence}%`} icon={Sprout} color="text-amber-600" />
        <StatCard compact title="Severe Cases" value={loading ? "..." : severeDetections} icon={Grid} color="text-indigo-600" />
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
        title={currentDetection ? "Edit Detection" : "Add Detection"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Prediction
            </label>
            <input
              type="text"
              value={formData.prediction}
              onChange={(e) => setFormData({ ...formData, prediction: e.target.value })}
              placeholder="e.g. Leaf Spot"
              aria-label="Prediction"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
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
              Confidence (%)
            </label>
            <input
              type="number"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) || 100 })}
              placeholder="e.g. 92.5"
              aria-label="Confidence percentage"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
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
              Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="e.g. https://example.com/leaf.jpg"
              aria-label="Image URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Detection"
        description="Are you sure you want to delete this detection result?"
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
