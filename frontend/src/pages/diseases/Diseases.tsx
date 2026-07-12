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
import { diseaseService } from "../../services/disease.service";
import type { Disease } from "../../types/disease";

export default function DiseasesPage() {
  // Live API data states
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalDiseases, setTotalDiseases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDisease, setCurrentDisease] = useState<Disease | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    category: "Fungal",
    description: "",
    symptoms: "",
    treatment: "",
    prevention: "",
    severity: "Mild",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);

  // Build query params and fetch diseases from server
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
        const msg = err instanceof Error ? err.message : "Failed to load disease details.";
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
          const msg = err instanceof Error ? err.message : "Failed to load disease details.";
          setError(msg);
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchDiseases();
  }, [currentPage, searchQuery, fetchDiseases]);

  const getCategoryChipVariant = (category: string): "Warning" | "Error" | "Success" | "Info" | "Pending" => {
    switch (category) {
      case "Fungal":
        return "Warning";
      case "Insect Pest":
        return "Error";
      case "None":
        return "Success";
      case "Bacterial":
        return "Info";
      default:
        return "Pending";
    }
  };

  // Set form states for Add Disease
  const handleAddClick = () => {
    setCurrentDisease(null);
    setFormData({
      name: "",
      scientific_name: "",
      category: "Fungal",
      description: "",
      symptoms: "",
      treatment: "",
      prevention: "",
      severity: "Mild",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Disease
  const handleEditClick = (disease: Disease) => {
    setCurrentDisease(disease);
    const symptomsStr = Array.isArray(disease.symptoms)
      ? disease.symptoms.join(", ")
      : disease.symptoms || "";

    setFormData({
      name: disease.name || disease.disease_name || "",
      scientific_name: disease.scientific_name || disease.common_name || "",
      category: disease.category,
      description: disease.description || "",
      symptoms: symptomsStr,
      treatment: disease.treatment,
      prevention: disease.prevention || "",
      severity: disease.severity || "Mild",
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptomsArray = formData.symptoms
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      scientific_name: formData.scientific_name,
      category: formData.category,
      symptoms: symptomsArray,
      treatment: formData.treatment,
      prevention: formData.prevention,
      severity: formData.severity,
      description: formData.description,
    };

    try {
      if (currentDisease) {
        // Edit Action
        await diseaseService.put(currentDisease._id, payload);
      } else {
        // Create Action
        await diseaseService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchDiseases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving disease data.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedDiseaseId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedDiseaseId) {
      try {
        await diseaseService.delete(selectedDiseaseId);
        fetchDiseases();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting disease.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedDiseaseId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const categories = ["All", ...Array.from(new Set(diseases.map((d) => d.category).filter(Boolean)))];
  const severities = ["All", ...Array.from(new Set(diseases.map((d) => d.severity || "Mild").filter(Boolean)))];

  // Client-side filtering for category/severity (unsupported by backend)
  const filteredDiseases = diseases.filter((d) => {
    const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "All" || (d.severity || "Mild") === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });

  // Dynamic statistics aggregations
  const fungalPathogens = filteredDiseases.filter((d) => d.category === "Fungal").length;
  const insectPests = filteredDiseases.filter((d) => d.category === "Insect Pest").length;

  const categoriesCount = filteredDiseases.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const commonPathogen = Object.keys(categoriesCount).reduce(
    (a, b) => (categoriesCount[a] > categoriesCount[b] ? a : b),
    "N/A"
  );

  // Column mapping
  const columns = [
    { key: "disease_name", label: "Disease Name", width: "1fr" },
    { key: "common_name", label: "Common Name", width: "1fr" },
    { key: "category", label: "Category", width: "130px" },
    { key: "description", label: "Description", width: "1.5fr" },
    { key: "symptoms", label: "Symptoms", width: "1.5fr" },
    { key: "treatment", label: "Treatment", width: "1.5fr" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredDiseases.map((row) => {
    const symptomsStr = Array.isArray(row.symptoms) ? row.symptoms.join(", ") : row.symptoms || "";

    return {
      disease_name: <span className="font-semibold text-gray-900">{row.name || row.disease_name}</span>,
      common_name: <span className="text-gray-700 font-semibold">{row.scientific_name || row.common_name}</span>,
      category: (
        <StatusChip
          label={row.category}
          variant={getCategoryChipVariant(row.category)}
        />
      ),
      description: (
        <span className="text-gray-500 truncate max-w-[150px] block" title={row.description || ""}>
          {row.description || "N/A"}
        </span>
      ),
      symptoms: (
        <span className="text-gray-500 truncate max-w-[150px] block" title={symptomsStr}>
          {symptomsStr}
        </span>
      ),
      treatment: (
        <span className="text-gray-500 truncate max-w-[150px] block" title={row.treatment}>
          {row.treatment}
        </span>
      ),
      created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
      actions: (
        <div className="flex items-center justify-end gap-2 pr-6">
          <button
            onClick={() => {}}
            type="button"
            aria-label="View disease"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            type="button"
            aria-label="Edit disease"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row._id)}
            type="button"
            aria-label="Delete disease"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-red-600 hover:border-red-200 transition-all"
            title="Delete"
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
      {/* 1. Toolbar with Search & Filters */}
      <Toolbar
        title="Diseases"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search disease..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Disease</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Category:</span>
          <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} aria-label="Filter by category" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Severity:</span>
          <select value={selectedSeverity} onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }} aria-label="Filter by severity" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {severities.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Pathogens" value={loading ? "..." : totalDiseases} icon={ClipboardList} />
        <StatCard compact title="Fungal Pathogens" value={loading ? "..." : fungalPathogens} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Insect Pests" value={loading ? "..." : insectPests} icon={Building2} color="text-amber-600" />
        <StatCard compact title="Common Pathogen" value={loading ? "..." : commonPathogen} icon={Grid} color="text-indigo-600" />
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
        total={totalDiseases}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentDisease ? "Edit Disease" : "Add Disease"}
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Leaf Spot"
              aria-label="Disease Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Scientific / Common Name
            </label>
            <input
              type="text"
              value={formData.scientific_name}
              onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
              placeholder="e.g. Cercospora durionis"
              aria-label="Common Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              aria-label="Category"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="Fungal">Fungal</option>
              <option value="Bacterial">Bacterial</option>
              <option value="Insect Pest">Insect Pest</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              aria-label="Severity Level"
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="e.g. Fungal infection causing spots..."
              aria-label="Description"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Symptoms (Comma-separated list)
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={3}
              placeholder="e.g. Circular spots, Yellow halos, Leaf drop"
              aria-label="Symptoms"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Treatment Recommendations
            </label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={3}
              placeholder="e.g. Spray copper fungicide every 14 days..."
              aria-label="Treatment"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Prevention Protocols
            </label>
            <textarea
              value={formData.prevention}
              onChange={(e) => setFormData({ ...formData, prevention: e.target.value })}
              rows={3}
              placeholder="e.g. Maintain proper pruning, avoid overhead irrigation..."
              aria-label="Prevention Protocols"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] focus:outline-none resize-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Disease"
        description="Are you sure you want to delete this disease?"
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
