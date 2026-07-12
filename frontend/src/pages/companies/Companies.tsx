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
import { companyService } from "../../services/company.service";
import type { Company } from "../../types/company";

export default function CompaniesPage() {
  // Live API data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    company_code: "",
    company_name: "",
    district: "",
    province: "",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Build query params and fetch companies from server
  const fetchCompanies = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;

    companyService.get<Company[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Company[];
        setCompanies(arr);
        setTotalCompanies((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to fetch companies data.";
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
        companyService.get<Company[] & { total?: number; total_pages?: number }>({ params }),
      ])
        .then(([companiesResult]) => {
          if (companiesResult.status === "fulfilled") {
            const companiesData = companiesResult.value;
            const arr = companiesData as unknown as Company[];
            setCompanies(arr);
            setTotalCompanies((companiesData as any).total ?? arr.length);
            setTotalPages((companiesData as any).total_pages ?? Math.ceil(((companiesData as any).total ?? arr.length) / perPage));
          } else {
            const msg = companiesResult.reason instanceof Error ? companiesResult.reason.message : "Failed to fetch companies data.";
            setError(msg);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchCompanies();
  }, [currentPage, searchQuery, fetchCompanies]);

  // Set form states for Add Company
  const handleAddClick = () => {
    setCurrentCompany(null);
    setFormData({
      company_code: "",
      company_name: "",
      district: "",
      province: "",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Company
  const handleEditClick = (company: Company) => {
    setCurrentCompany(company);
    setFormData({
      company_code: company.company_code,
      company_name: company.company_name,
      district: company.district,
      province: company.province,
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCompany) {
        // Edit Action
        await companyService.put(currentCompany._id, formData);
      } else {
        // Create Action
        await companyService.post(formData);
      }
      setIsDrawerOpen(false);
      fetchCompanies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving company data.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedCompanyId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedCompanyId) {
      try {
        await companyService.delete(selectedCompanyId);
        fetchCompanies();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting company.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedCompanyId(null);
      }
    }
  };

  // Dynamically resolve filters from API payload
  const provinces = ["All", ...Array.from(new Set(companies.map((c) => c.province)))];
  const districts = ["All", ...Array.from(new Set(companies.map((c) => c.district)))];

  // Client-side filtering for province/district (unsupported by backend)
  const filteredCompanies = companies.filter((c) => {
    const matchesProvince = selectedProvince === "All" || c.province === selectedProvince;
    const matchesDistrict = selectedDistrict === "All" || c.district === selectedDistrict;
    return matchesProvince && matchesDistrict;
  });

  // Dynamic statistics aggregations
  const totalFarms = filteredCompanies.reduce((sum, c) => sum + (c.total_farms || 0), 0);
  const totalZones = filteredCompanies.reduce((sum, c) => sum + (c.total_zones || 0), 0);
  const totalTrees = filteredCompanies.reduce((sum, c) => sum + (c.total_trees || 0), 0);

  // Column mapping
  const columns = [
    { key: "company_code", label: "Company Code", width: "120px" },
    { key: "company_name", label: "Company Name", width: "1fr" },
    { key: "district", label: "District", width: "1fr" },
    { key: "province", label: "Province", width: "1fr" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = filteredCompanies.map((row) => ({
    company_code: <span className="font-semibold text-gray-900">{row.company_code}</span>,
    company_name: <span className="text-gray-700">{row.company_name}</span>,
    district: <span className="text-gray-600">{row.district}</span>,
    province: <span className="text-gray-600">{row.province}</span>,
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
      {/* 1. Toolbar */}
      <Toolbar
        title="Companies"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search company..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Province:</span>
          <select value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setCurrentPage(1); }} aria-label="Filter by province" className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none">
            {provinces.map((prov) => (<option key={prov} value={prov}>{prov}</option>))}
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
        <StatCard compact title="Total Companies" value={loading ? "..." : totalCompanies.toLocaleString()} icon={Building2} />
        <StatCard compact title="Total Farms" value={loading ? "..." : totalFarms} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Total Zones" value={loading ? "..." : totalZones} icon={Grid} color="text-amber-600" />
        <StatCard compact title="Total Trees" value={loading ? "..." : totalTrees} icon={TreePine} color="text-indigo-600" />
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
        total={totalCompanies}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentCompany ? "Edit Company" : "Add Company"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Company Code
            </label>
            <input
              type="text"
              value={formData.company_code}
              onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
              placeholder="e.g. COM-005"
              aria-label="Company Code"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g. Chumphon Green Fields"
              aria-label="Company Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
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
              Province
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              placeholder="e.g. Chumphon"
              aria-label="Province"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Company"
        description="Are you sure you want to delete this company?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedCompanyId(null);
        }}
      />
    </div>
  );
}
