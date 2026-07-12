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
import StatusChip from "../../components/common/StatusChip";
import { treeService } from "../../services/tree.service";
import { zoneService } from "../../services/zone.service";
import { farmService } from "../../services/farm.service";
import type { Tree } from "../../types/tree";
import type { Zone } from "../../types/zone";
import type { Farm } from "../../types/farm";

export default function TreesPage() {
  // Live API data states
  const [trees, setTrees] = useState<Tree[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination metadata
  const [totalTrees, setTotalTrees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("All");
  const [selectedZoneId, setSelectedZoneId] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination local states
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Drawer Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentTree, setCurrentTree] = useState<Tree | null>(null);
  const [formData, setFormData] = useState({
    tree_code: "",
    zone_id: "",
    variety: "",
    planting_date: "",
    tree_age: 0,
    status: "Healthy",
  });

  // Delete Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  // Build query params and fetch trees from server
  const fetchTrees = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;
    if (selectedFarmId !== "All") params.farm_id = selectedFarmId;
    if (selectedZoneId !== "All") params.zone_id = selectedZoneId;
    if (selectedStatus !== "All") params.status = selectedStatus;

    treeService.get<Tree[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Tree[];
        setTrees(arr);
        setTotalTrees((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load tree details.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, searchQuery, selectedFarmId, selectedZoneId, selectedStatus]);

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
        treeService.get<Tree[] & { total?: number; total_pages?: number }>({ params }),
        zoneService.get({ params: { per_page: 100 } }),
        farmService.get({ params: { per_page: 100 } }),
      ])
        .then(([treesResult, zonesResult, farmsResult]) => {
          if (treesResult.status === "fulfilled") {
            const treesData = treesResult.value;
            const arr = treesData as unknown as Tree[];
            setTrees(arr);
            setTotalTrees((treesData as any).total ?? arr.length);
            setTotalPages((treesData as any).total_pages ?? Math.ceil(((treesData as any).total ?? arr.length) / perPage));
          } else {
            const msg = treesResult.reason instanceof Error ? treesResult.reason.message : "Failed to load tree details.";
            setError(msg);
          }
          if (zonesResult.status === "fulfilled") {
            setZones(zonesResult.value);
          }
          if (farmsResult.status === "fulfilled") {
            setFarms(farmsResult.value);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    fetchTrees();
  }, [currentPage, searchQuery, selectedFarmId, selectedZoneId, selectedStatus, fetchTrees]);

  // Helper to map status to StatusChip variants
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

  // Set form states for Add Tree
  const handleAddClick = () => {
    setCurrentTree(null);
    setFormData({
      tree_code: "",
      zone_id: zones[0]?._id || "",
      variety: "Ri6",
      planting_date: new Date().toISOString().split("T")[0],
      tree_age: 0,
      status: "Healthy",
    });
    setIsDrawerOpen(true);
  };

  // Set form states for Edit Tree
  const handleEditClick = (tree: Tree) => {
    setCurrentTree(tree);
    const dateOnly = tree.planting_date
      ? tree.planting_date.split("T")[0]
      : tree.planted_date
      ? tree.planted_date.split("T")[0]
      : "";

    setFormData({
      tree_code: tree.tree_code,
      zone_id: tree.zone_id,
      variety: tree.variety,
      planting_date: dateOnly,
      tree_age: tree.tree_age ?? tree.age ?? 0,
      status: tree.status,
    });
    setIsDrawerOpen(true);
  };

  // Trigger Save/Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      zone_id: formData.zone_id,
      tree_code: formData.tree_code,
      variety: formData.variety,
      age: Number(formData.tree_age) || 0,
      status: formData.status,
      planting_date: formData.planting_date || undefined,
    };

    try {
      if (currentTree) {
        await treeService.put(currentTree._id, payload);
      } else {
        await treeService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchTrees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving tree data.";
      alert(msg);
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setSelectedTreeId(id);
    setIsDialogOpen(true);
  };

  // Trigger Delete API
  const handleDeleteConfirm = async () => {
    if (selectedTreeId) {
      try {
        await treeService.delete(selectedTreeId);
        fetchTrees();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting tree.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedTreeId(null);
      }
    }
  };

  const statuses = ["All", "Healthy", "Monitoring", "Diseased"];

  // Stat calculations use the currently-loaded trees
  const healthyTrees = trees.filter((t) => t.status === "Healthy").length;
  const monitoringTrees = trees.filter((t) => t.status === "Monitoring").length;
  const diseasedTrees = trees.filter((t) => t.status === "Diseased").length;

  const getFarmName = (id: string) => {
    const farm = farms.find((f) => f._id === id || f.farm_code === id);
    return farm ? farm.farm_name : id;
  };

  // Column mapping
  const columns = [
    { key: "tree_code", label: "Tree Code", width: "120px" },
    { key: "farm_name", label: "Farm", width: "1fr" },
    { key: "zone_name", label: "Zone", width: "1fr" },
    { key: "variety", label: "Variety", width: "120px" },
    { key: "tree_age", label: "Age (Yrs)", width: "100px" },
    { key: "status", label: "Status", width: "110px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  // Map database elements to components representation
  const tableRows = trees.map((row) => ({
    tree_code: <span className="font-semibold text-gray-900">{row.tree_code}</span>,
    farm_name: <span className="text-gray-600 font-semibold">{row.farm_name || "—"}</span>,
    zone_name: <span className="text-gray-600 font-semibold">{row.zone_name || row.zone_code || "—"}</span>,
    variety: <span className="text-gray-700">{row.variety}</span>,
    tree_age: <span className="text-gray-700 whitespace-nowrap">{row.tree_age ?? row.age ?? 0} Yrs</span>,
    status: <StatusChip label={row.status} variant={getStatusChipVariant(row.status)} />,
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
      <Toolbar
        title="Trees"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search tree..."
        action={
          <button
            onClick={handleAddClick}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tree</span>
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Farm:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedZoneId("All");
              setCurrentPage(1);
            }}
            aria-label="Filter by farm"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            <option value="All">All</option>
            {farms.map((f) => (
              <option key={f._id} value={f._id}>
                {f.farm_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Zone:</span>
          <select
            value={selectedZoneId}
            onChange={(e) => {
              setSelectedZoneId(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by zone"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            <option value="All">All</option>
            {zones
              .filter((z) => selectedFarmId === "All" || z.farm_id === selectedFarmId)
              .map((z) => (
                <option key={z._id} value={z._id}>
                  {z.zone_name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by status"
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Trees" value={loading ? "..." : totalTrees.toLocaleString()} icon={TreePine} />
        <StatCard compact title="Healthy Trees" value={loading ? "..." : healthyTrees.toLocaleString()} icon={Sprout} color="text-blue-600" />
        <StatCard compact title="Monitoring Trees" value={loading ? "..." : monitoringTrees} icon={Building2} color="text-amber-600" />
        <StatCard compact title="Diseased Trees" value={loading ? "..." : diseasedTrees} icon={Grid} color="text-indigo-600" />
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
        total={totalTrees}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      {/* 6. Slide-Out Drawer Form Container */}
      <DrawerForm
        title={currentTree ? "Edit Tree" : "Add Tree"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tree Code
            </label>
            <input
              type="text"
              value={formData.tree_code}
              onChange={(e) => setFormData({ ...formData, tree_code: e.target.value })}
              placeholder="e.g. TR-005"
              aria-label="Tree Code"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Zone
            </label>
            <select
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              aria-label="Zone"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="">Select a zone</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.zone_name} ({getFarmName(z.farm_id)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Variety
            </label>
            <select
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              aria-label="Variety"
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] text-gray-700 focus:outline-none"
              required
            >
              <option value="Ri6">Ri6</option>
              <option value="Monthong">Monthong</option>
              <option value="Kanyao">Kanyao</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Planting Date
            </label>
            <input
              type="date"
              value={formData.planting_date}
              onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
              aria-label="Planting Date"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tree Age (Yrs)
            </label>
            <input
              type="number"
              value={formData.tree_age}
              onChange={(e) => setFormData({ ...formData, tree_age: Number(e.target.value) || 0 })}
              placeholder="e.g. 5"
              aria-label="Tree Age"
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
        </form>
      </DrawerForm>

      {/* 7. Dialog Confirmation Modal */}
      <ConfirmDialog
        title="Delete Tree"
        description="Are you sure you want to delete this tree?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedTreeId(null);
        }}
      />
    </div>
  );
}
