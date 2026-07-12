import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  Sprout,
  Grid,
  TreePine,
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
import { farmService } from "../../services/farm.service";
import { companyService } from "../../services/company.service";
import type { Farm } from "../../types/farm";
import type { Company } from "../../types/company";

export default function FarmsPage() {
  // Live API data states
  const [farms, setFarms] = useState<Farm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({
    farm_code: "",
    farm_name: "",
    company_id: "",
    district: "",
    area_hectare: 0,
    address: "",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  // Build query params and fetch farms from server
  const fetchFarms = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    farmService.get<Farm[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Farm[];
        setFarms(arr);
        setTotalFarms((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load farm details.";
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
        farmService.get<Farm[] & { total?: number; total_pages?: number }>({ params }),
        companyService.get({ params: { per_page: 100 } }),
      ])
        .then(([farmsResult, companiesResult]) => {
          if (farmsResult.status === "fulfilled") {
            const farmsData = farmsResult.value;
            const arr = farmsData as unknown as Farm[];
            setFarms(arr);
            setTotalFarms((farmsData as any).total ?? arr.length);
            setTotalPages((farmsData as any).total_pages ?? Math.ceil(((farmsData as any).total ?? arr.length) / perPage));
          } else {
            const msg = farmsResult.reason instanceof Error ? farmsResult.reason.message : "Failed to load farm details.";
            setError(msg);
          }
          if (companiesResult.status === "fulfilled") {
            setCompanies(companiesResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchFarms();
  }, [currentPage, searchQuery, fetchFarms]);

  const getCompanyName = (id: string) => {
    const company = companies.find((c) => c._id === id || c.company_code === id);
    return company ? company.company_name : id;
  };

  // Set form states for Add Farm
  const handleAddClick = () => {
    setCurrentFarm(null);
    setFormData({
      farm_code: "",
      farm_name: "",
      company_id: companies[0]?._id || "",
      district: "",
      area_hectare: 0,
      address: "",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Farm
  const handleEditClick = (farm: Farm) => {
    setCurrentFarm(farm);
    setFormData({
      farm_code: farm.farm_code,
      farm_name: farm.farm_name,
      company_id: farm.company_id,
      district: farm.district,
      area_hectare: farm.area_hectare,
      address: farm.address || "",
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.farm_name,
      farm_code: formData.farm_code,
      company_id: formData.company_id,
      district: formData.district,
      area: Number(formData.area_hectare) || 0,
      address: formData.address || "",
    };

    try {
      if (currentFarm) {
        // Edit Action
        await farmService.put(currentFarm._id, payload);
      } else {
        // Create Action
        await farmService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchFarms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving farm data.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedFarmId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedFarmId) {
      try {
        await farmService.delete(selectedFarmId);
        fetchFarms();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting farm.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedFarmId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const districts = ["All", ...Array.from(new Set(farms.map((f) => f.district).filter(Boolean)))];

  // Client-side filtering for company/district (unsupported by backend)
  const filteredFarms = farms.filter((f) => {
    const matchesCompany = selectedCompanyId === "All" || f.company_id === selectedCompanyId;
    const matchesDistrict = selectedDistrict === "All" || f.district === selectedDistrict;
    return matchesCompany && matchesDistrict;
  });

  // Dynamic statistics aggregations
  const totalAreaHectare = Number(filteredFarms.reduce((sum, f) => sum + (f.area_hectare || 0), 0).toFixed(1));
  const averageAreaHectare = totalFarms > 0 ? Number((totalAreaHectare / totalFarms).toFixed(1)) : 0;
  const totalTrees = filteredFarms.reduce((sum, f) => sum + (f.tree_count || 0), 0);

  // Column mapping
  const columns = [
    { key: "farm_code", label: "Farm Code", width: "120px" },
    { key: "farm_name", label: "Farm Name", width: "1fr" },
    { key: "company_id", label: "Company", width: "1fr" },
    { key: "district", label: "District", width: "1fr" },
    { key: "area_hectare", label: "Area (Ha)", width: "110px" },
    { key: "tree_count", label: "Trees", width: "100px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredFarms.map((row) => ({
    farm_code: <span className="font-semibold text-gray-900">{row.farm_code}</span>,
    farm_name: <span className="text-gray-700">{row.farm_name}</span>,
    company_id: <span className="text-gray-600 font-semibold">{getCompanyName(row.company_id)}</span>,
    district: <span className="text-gray-600">{row.district}</span>,
    area_hectare: <span className="text-gray-700 whitespace-nowrap">{row.area_hectare || 0} Ha</span>,
    tree_count: <span className="text-gray-700">{(row.tree_count || 0).toLocaleString()}</span>,
    created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => {}}
          type="button"
          aria-label="View farm"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit farm"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete farm"
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
        title="Farms"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search farm..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Farm</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Company:</span>
          <select value={selectedCompanyId} onChange={(e) => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }} aria-label="Filter by company" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            <option value="All">All</option>
            {companies.map((c) => (<option key={c._id} value={c._id}>{c.company_name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">District:</span>
          <select value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }} aria-label="Filter by district" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {districts.map((dist) => (<option key={dist} value={dist}>{dist}</option>))}
          </select>
        </div>
      </Toolbar>

      {/* 3. Aggregated Stat Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          compact
          title="Total Farms"
          value={loading ? "..." : totalFarms.toLocaleString()}
          icon={Sprout}
        />
        <StatCard
          compact
          title="Average Area (Ha)"
          value={loading ? "..." : `${averageAreaHectare} Ha`}
          icon={Building2}
          color="text-blue-600"
        />
        <StatCard
          compact
          title="Total Area"
          value={loading ? "..." : `${totalAreaHectare} Ha`}
          icon={Grid}
          color="text-amber-600"
        />
        <StatCard
          compact
          title="Total Trees"
          value={loading ? "..." : totalTrees.toLocaleString()}
          icon={TreePine}
          color="text-indigo-600"
        />
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
        total={totalFarms}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentFarm ? "Edit Farm" : "Add Farm"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Farm Code
            </label>
            <input
              type="text"
              value={formData.farm_code}
              onChange={(e) => setFormData({ ...formData, farm_code: e.target.value })}
              placeholder="e.g. FRM-005"
              aria-label="Farm Code"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Farm Name
            </label>
            <input
              type="text"
              value={formData.farm_name}
              onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
              placeholder="e.g. Chumphon Gold Hill"
              aria-label="Farm Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Company
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              aria-label="Company"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              District
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Lamae"
              aria-label="District"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Area (Ha)
            </label>
            <input
              type="number"
              step="any"
              value={formData.area_hectare}
              onChange={(e) => setFormData({ ...formData, area_hectare: Number(e.target.value) || 0 })}
              placeholder="e.g. 10.5"
              aria-label="Area in Hectares"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Lamae Road"
              aria-label="Address"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
            />
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Farm"
        description="Are you sure you want to delete this farm?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedFarmId(null);
        }}
      />
    </div>
  );
}
