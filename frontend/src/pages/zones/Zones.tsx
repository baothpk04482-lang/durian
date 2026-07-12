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
import { zoneService } from "../../services/zone.service";
import { farmService } from "../../services/farm.service";
import type { Zone } from "../../types/zone";
import type { Farm } from "../../types/farm";

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalZones, setTotalZones] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState({
    zone_name: "",
    farm_id: "",
    tree_count: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const fetchZones = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: perPage,
    };
    if (searchQuery) params.keyword = searchQuery;
    if (selectedFarmId !== "All") params.farm_id = selectedFarmId;

    zoneService.get<Zone[] & { total?: number; total_pages?: number }>({ params })
      .then((data) => {
        const arr = data as unknown as Zone[];
        setZones(arr);
        setTotalZones((data as any).total ?? arr.length);
        setTotalPages((data as any).total_pages ?? Math.ceil(((data as any).total ?? arr.length) / perPage));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load zone details.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, searchQuery, selectedFarmId]);

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
        zoneService.get<Zone[] & { total?: number; total_pages?: number }>({ params }),
        farmService.get({ params: { per_page: 100 } }),
      ])
        .then(([zonesResult, farmsResult]) => {
          if (zonesResult.status === "fulfilled") {
            const zonesData = zonesResult.value;
            const arr = zonesData as unknown as Zone[];
            setZones(arr);
            setTotalZones((zonesData as any).total ?? arr.length);
            setTotalPages((zonesData as any).total_pages ?? Math.ceil(((zonesData as any).total ?? arr.length) / perPage));
          } else {
            const msg = zonesResult.reason instanceof Error ? zonesResult.reason.message : "Failed to load zone details.";
            setError(msg);
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

    fetchZones();
  }, [currentPage, searchQuery, selectedFarmId, fetchZones]);

  const getFarmName = (id: string) => {
    const farm = farms.find((f) => f._id === id || f.farm_code === id);
    return farm ? farm.farm_name : id;
  };

  const handleAddClick = () => {
    setCurrentZone(null);
    setFormData({
      zone_name: "",
      farm_id: farms[0]?._id || "",
      tree_count: 0,
    });
    setIsDrawerOpen(true);
  };

  const handleEditClick = (zone: Zone) => {
    setCurrentZone(zone);
    setFormData({
      zone_name: zone.zone_name,
      farm_id: zone.farm_id,
      tree_count: zone.tree_count,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.zone_name,
      farm_id: formData.farm_id,
      tree_count: Number(formData.tree_count) || 0,
    };

    try {
      if (currentZone) {
        await zoneService.put(currentZone._id, payload);
      } else {
        await zoneService.post(payload);
      }
      setIsDrawerOpen(false);
      fetchZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving zone data.";
      alert(msg);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedZoneId(id);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedZoneId) {
      try {
        await zoneService.delete(selectedZoneId);
        fetchZones();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting zone.";
        alert(msg);
      } finally {
        setIsDialogOpen(false);
        setSelectedZoneId(null);
      }
    }
  };

  const totalTrees = zones.reduce((sum, z) => sum + (z.tree_count || 0), 0);
  const averageTreesPerZone = totalZones > 0 ? Math.round(totalTrees / totalZones) : 0;
  const maxTreesPerZone = zones.length > 0 ? Math.max(...zones.map((z) => z.tree_count || 0)) : 0;

  const columns = [
    { key: "zone_name", label: "Zone Name", width: "1fr" },
    { key: "farm_id", label: "Farm", width: "1fr" },
    { key: "tree_count", label: "Trees", width: "100px" },
    { key: "created_at", label: "Created At", width: "140px" },
    { key: "actions", label: "Actions", width: "130px", className: "text-right" },
  ];

  const tableRows = zones.map((row) => ({
    zone_name: <span className="font-semibold text-gray-900">{row.zone_name}</span>,
    farm_id: <span className="text-gray-600 font-semibold">{getFarmName(row.farm_id)}</span>,
    tree_count: <span className="text-gray-700">{(row.tree_count || 0).toLocaleString()}</span>,
    created_at: <span className="text-gray-500">{row.created_at || "N/A"}</span>,
    actions: (
      <div className="flex items-center justify-end gap-2 pr-6">
        <button
          onClick={() => {}}
          type="button"
          aria-label="View zone"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-[#1E8449] hover:border-[#1E8449]/20 transition-all"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEditClick(row)}
          type="button"
          aria-label="Edit zone"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-[#F8FAFC] hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row._id)}
          type="button"
          aria-label="Delete zone"
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
        title="Zones"
        searchValue={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
        searchPlaceholder="Search zone..."
        action={
          <button onClick={handleAddClick} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E8449] text-white rounded-[12px] text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all focus:outline-none">
            <Plus className="w-4 h-4" />
            <span>Add Zone</span>
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
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard compact title="Total Zones" value={loading ? "..." : totalZones} icon={Grid} />
        <StatCard compact title="Average Trees / Zone" value={loading ? "..." : averageTreesPerZone} icon={Building2} color="text-blue-600" />
        <StatCard compact title="Total Trees" value={loading ? "..." : totalTrees.toLocaleString()} icon={TreePine} color="text-amber-600" />
        <StatCard compact title="Max Trees in Zone" value={loading ? "..." : maxTreesPerZone} icon={Sprout} color="text-indigo-600" />
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
        total={totalZones}
        perPage={perPage}
        onChange={(p) => setCurrentPage(p)}
      />

      <DrawerForm
        title={currentZone ? "Edit Zone" : "Add Zone"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        footer={drawerFooter}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Zone Name
            </label>
            <input
              type="text"
              value={formData.zone_name}
              onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
              placeholder="e.g. Zone A3"
              aria-label="Zone Name"
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
              Tree Count
            </label>
            <input
              type="number"
              value={formData.tree_count}
              onChange={(e) => setFormData({ ...formData, tree_count: Number(e.target.value) || 0 })}
              placeholder="e.g. 150"
              aria-label="Tree Count"
              className="w-full px-3 py-2 border border-gray-200 rounded-[10px] bg-white text-[14px] focus:outline-none"
              required
            />
          </div>
        </form>
      </DrawerForm>

      <ConfirmDialog
        title="Delete Zone"
        description="Are you sure you want to delete this zone?"
        open={isDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedZoneId(null);
        }}
      />
    </div>
  );
}
