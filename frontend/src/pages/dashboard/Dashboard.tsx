import { useState, useEffect, useMemo, useRef } from "react";

import { loadDashboardData } from "../../services/dashboardDataManager.service";

import type { Tree } from "../../types/tree";
import type { Inspection } from "../../types/inspection";
import type { DetectionResult } from "../../types/detectionResult";
import type { Disease } from "../../types/disease";
import type { Alert } from "../../types/alert";
import type { Zone } from "../../types/zone";
import type { Farm } from "../../types/farm";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KPISection from "../../components/dashboard/KPISection";
import WeatherForecastCard from "../../components/dashboard/WeatherForecastCard";
import HeatmapCard from "../../components/dashboard/HeatmapCard";
import AgronomistPanel from "../../components/dashboard/AgronomistPanel";
import TreeDistributionCard from "../../components/dashboard/TreeDistributionCard";
import RealtimeInspectionCard from "../../components/dashboard/RealtimeInspectionCard";
import { DashboardSkeleton } from "../../components/dashboard/Shared/SkeletonCard";
import type { CellData, ZoneSection } from "../../components/dashboard/HeatmapGrid";
import type { InspectionRow } from "../../components/dashboard/InspectionTable";
import { formatDateTime } from "../../utils/dateFormatter";

export default function DashboardPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [, setDiseases] = useState<Disease[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiHealthyCount, setKpiHealthyCount] = useState(0);
  const [kpiMonitoringCount, setKpiMonitoringCount] = useState(0);
  const [kpiDiseasedCount, setKpiDiseasedCount] = useState(0);
  const [kpiEmergencyCount, setKpiEmergencyCount] = useState(0);
  const [kpiTotalTrees, setKpiTotalTrees] = useState(0);
  const [farmFilter, setFarmFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    loadDashboardData()
      .then(({ farms, zones, trees, inspections, detections, diseases, alerts, kpiTotalTrees: totalTrees, kpiHealthyCount, kpiMonitoringCount, kpiDiseasedCount, kpiEmergencyCount }) => {
        setTrees(trees);
        setFarms(farms);
        setZones(zones);
        setInspections(inspections);
        setDetections(detections);
        setDiseases(diseases);
        setAlerts(alerts);
        setKpiTotalTrees(totalTrees);
        setKpiHealthyCount(kpiHealthyCount);
        setKpiMonitoringCount(kpiMonitoringCount);
        setKpiDiseasedCount(kpiDiseasedCount);
        setKpiEmergencyCount(kpiEmergencyCount);
      })
      .finally(() => { setLoading(false); });
  };

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    fetchDashboardData();
  }, []);

  // --- KPI computations ---
  void kpiTotalTrees; void kpiHealthyCount; void kpiMonitoringCount; void kpiDiseasedCount; void kpiEmergencyCount;

  const newTreesThisMonth = 0;

  // --- Zone / Farm lookup maps ---
  const zoneMap = useMemo(() => {
    const m = new Map<string, Zone>();
    zones.forEach((z) => m.set(z._id, z));
    return m;
  }, [zones]);

  const farmMap = useMemo(() => {
    const m = new Map<string, Farm>();
    farms.forEach((f) => m.set(f._id, f));
    return m;
  }, [farms]);

  const treeMap = useMemo(() => {
    const m = new Map<string, Tree>();
    trees.forEach((t) => m.set(t._id, t));
    return m;
  }, [trees]);

  const inspectionMap = useMemo(() => {
    const m = new Map<string, Inspection>();
    inspections.forEach((i) => m.set(i._id, i));
    return m;
  }, [inspections]);

  // --- Filters ---
  const farmOptions = useMemo(() => {
    return [{ value: "all", label: "Tất cả trang trại" }, ...farms.map((f) => ({ value: f._id, label: f.farm_name }))];
  }, [farms]);

  const zoneOptions = useMemo(() => {
    const filtered = farmFilter === "all" ? zones : zones.filter((z) => z.farm_id === farmFilter);
    return [{ value: "all", label: "Tất cả khu vực" }, ...filtered.map((z) => ({ value: z._id, label: z.zone_name }))];
  }, [zones, farmFilter]);

  const filteredTrees = useMemo(() => {
    return trees.filter((t) => {
      if (farmFilter !== "all") {
        const zone = zoneMap.get(t.zone_id);
        if (!zone || zone.farm_id !== farmFilter) return false;
      }
      if (zoneFilter !== "all") {
        if (t.zone_id !== zoneFilter) return false;
      }
      return true;
    });
  }, [trees, farmFilter, zoneFilter, zoneMap]);

  // --- Filtered KPIs (derived from filteredTrees) ---
  const filteredKpiTotalTrees = filteredTrees.length;
  const filteredKpiHealthyCount = filteredTrees.filter((t) => t.status === "Healthy").length;
  const filteredKpiMonitoringCount = filteredTrees.filter((t) => t.status === "Monitoring").length;
  const filteredKpiDiseasedCount = filteredTrees.filter((t) => t.status !== "Healthy" && t.status !== "Monitoring").length;
  const filteredHealthyPercent = filteredKpiTotalTrees > 0 ? Math.round((filteredKpiHealthyCount / filteredKpiTotalTrees) * 100) : 0;

  // Unique farms/zones from filtered trees
  const filteredFarmIds = useMemo(() => {
    const ids = new Set<string>();
    filteredTrees.forEach((t) => {
      const zone = zoneMap.get(t.zone_id);
      if (zone) ids.add(zone.farm_id);
    });
    return ids;
  }, [filteredTrees, zoneMap]);

  const filteredZoneIds = useMemo(() => {
    const ids = new Set<string>();
    filteredTrees.forEach((t) => ids.add(t.zone_id));
    return ids;
  }, [filteredTrees]);

  const filteredFarmCount = filteredFarmIds.size;
  const filteredZoneCount = filteredZoneIds.size;
  const filteredFarmArea = useMemo(() => {
    let area = 0;
    filteredFarmIds.forEach((fid) => {
      const farm = farmMap.get(fid);
      if (farm) area += farm.area_hectare || 0;
    });
    return area;
  }, [filteredFarmIds, farmMap]);
  const filteredFarmAreaFormatted = `${filteredFarmArea.toFixed(1)} ha`;

  // Tree IDs in the filtered set (for quick lookup)
  const filteredTreeIds = useMemo(() => new Set(filteredTrees.map((t) => t._id)), [filteredTrees]);

  const detectionMap = useMemo(() => {
    const m = new Map<string, DetectionResult>();
    detections.forEach((d) => {
      const key = d.tree_id || d.tree_code;
      if (!m.has(key) || new Date(d.created_at) > new Date(m.get(key)!.created_at)) {
        m.set(key, d);
      }
    });
    return m;
  }, [detections]);

  // --- Disease Heatmap ---
  const heatmapSummary = useMemo(() => {
    let healthy = 0, monitor = 0, diseased = 0;
    filteredTrees.forEach((t) => {
      if (t.status === "Healthy") healthy++;
      else if (t.status === "Monitoring") monitor++;
      else diseased++;
    });
    return { healthy, monitor, diseased };
  }, [filteredTrees]);

  const zoneSections: ZoneSection[] = useMemo(() => {
    const nameGroups = new Map<string, Tree[]>();

    for (const t of filteredTrees) {
      const zone = zoneMap.get(t.zone_id);
      const zoneName = zone?.zone_name || t.zone_name || t.zone_id || "Chưa xác định";
      const g = nameGroups.get(zoneName);
      if (g) g.push(t);
      else nameGroups.set(zoneName, [t]);
    }

    const sections: ZoneSection[] = [];

    for (const [zoneName, zoneTrees] of nameGroups) {
      zoneTrees.sort((a, b) => (a.tree_code || "").localeCompare(b.tree_code || ""));

      let h = 0, m = 0, d = 0;
      const cells: CellData[] = zoneTrees.map((tree) => {
        if (tree.status === "Healthy") h++;
        else if (tree.status === "Monitoring") m++;
        else d++;
        const det = detectionMap.get(tree._id);
        return {
          id: tree._id,
          risk: tree.status === "Healthy" ? "healthy" : tree.status === "Monitoring" ? "monitor" : "diseased",
          treeId: tree.tree_code || tree._id,
          farm: tree.farm_name || "",
          zone: zoneName,
          riskScore: det ? Math.round(det.confidence) : 0,
          status: tree.status || "Healthy",
          disease: det?.disease_name || "",
          confidence: det ? Math.round(det.confidence) : undefined,
        };
      });

      sections.push({
        zoneName,
        trees: cells,
        healthyCount: h,
        monitoringCount: m,
        diseasedCount: d,
        totalCount: zoneTrees.length,
      });
    }

    sections.sort((a, b) => a.zoneName.localeCompare(b.zoneName));
    return sections;
  }, [filteredTrees, zoneMap, detectionMap]);

  // Last updated from real data
  const heatmapLastUpdated = useMemo(() => {
    const dates = [
      ...inspections.map((i) => i.inspection_date || i.created_at).filter(Boolean),
      ...detections.map((d) => d.created_at).filter(Boolean),
    ] as string[];
    if (dates.length === 0) return "09:30 AM";
    const latest = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return formatDateTime(latest);
  }, [inspections, detections]);

  // Farm Health Distribution
  const filteredFarmHealthData = useMemo(() => {
    return [
      { name: "Khỏe mạnh", value: filteredKpiHealthyCount, color: "#22C55E" },
      { name: "Theo dõi", value: filteredKpiMonitoringCount, color: "#EAB308" },
      { name: "Bị bệnh", value: filteredKpiDiseasedCount, color: "#EF4444" },
    ];
  }, [filteredKpiHealthyCount, filteredKpiMonitoringCount, filteredKpiDiseasedCount]);

  // Inspection table data — O(n) join using pre-built lookup maps
  const inspectionTableData: InspectionRow[] = useMemo(() => {
    const sorted = [...inspections]
      .filter((i) => i.inspection_date || i.created_at)
      .sort((a, b) => {
        const da = new Date(a.inspection_date || a.created_at || 0).getTime();
        const db = new Date(b.inspection_date || b.created_at || 0).getTime();
        return db - da;
      });

    return sorted.map((insp) => {
      const tree = treeMap.get(insp.tree_id);
      const zone = tree ? zoneMap.get(tree.zone_id) : undefined;
      const farm = zone ? farmMap.get(zone.farm_id) : undefined;
      const det = detectionMap.get(insp.tree_id);

      const risk = det?.confidence ?? 0;
        const action = risk >= 90 ? "Khám hôm nay" : risk >= 80 ? "Theo dõi" : "Xem xét";

      let time = "—";
      const dateRaw = insp.inspection_date;
      const createdRaw = insp.created_at;
      const raw = dateRaw && dateRaw.includes("T") ? dateRaw : createdRaw;
      if (raw) {
        const formatted = formatDateTime(raw);
        if (formatted !== "-") {
          time = formatted;
        }
      }

      return {
        id: insp._id,
        time,
        treeCode: tree?.tree_code || insp.tree_code || "—",
        farm: farm?.farm_name || "—",
        zone: zone?.zone_name || "—",
        disease: det?.disease_name || "Chưa phát hiện",
        risk,
        inspector: insp.inspector_name || "—",
        status: insp.status || "—",
        action,
      };
    });
  }, [inspections, treeMap, zoneMap, farmMap, detectionMap]);

  // --- Alert analytics ---
  const alertCounts = useMemo(() => {
    const high = alerts.filter((a) => (a.priority || "").toLowerCase() === "high").length;
    const medium = alerts.filter((a) => (a.priority || "").toLowerCase() === "medium").length;
    const low = alerts.filter((a) => (a.priority || "").toLowerCase() === "low").length;
    return { high, medium, low };
  }, [alerts]);

  // --- Filtered inspection table data ---
  // Filter inspections BEFORE the join, using tree→zone→farm
  const filteredInspectionRows: InspectionRow[] = useMemo(() => {
    if (farmFilter === "all" && zoneFilter === "all") return inspectionTableData;

    const sorted = [...inspections]
      .filter((i) => i.inspection_date || i.created_at)
      .sort((a, b) => {
        const da = new Date(a.inspection_date || a.created_at || 0).getTime();
        const db = new Date(b.inspection_date || b.created_at || 0).getTime();
        return db - da;
      });

    const filtered = sorted.filter((insp) => {
      const tree = treeMap.get(insp.tree_id);
      if (!tree) return false;
      if (farmFilter !== "all") {
        const zone = zoneMap.get(tree.zone_id);
        if (!zone || zone.farm_id !== farmFilter) return false;
      }
      if (zoneFilter !== "all" && tree.zone_id !== zoneFilter) return false;
      return true;
    });

    return filtered.map((insp) => {
      const tree = treeMap.get(insp.tree_id);
      const zone = tree ? zoneMap.get(tree.zone_id) : undefined;
      const farm = zone ? farmMap.get(zone.farm_id) : undefined;
      const det = detectionMap.get(insp.tree_id);

      const risk = det?.confidence ?? 0;
      const action = risk >= 90 ? "Khám hôm nay" : risk >= 80 ? "Theo dõi" : "Xem xét";

      let time = "—";
      const dateRaw = insp.inspection_date;
      const createdRaw = insp.created_at;
      const raw = dateRaw && dateRaw.includes("T") ? dateRaw : createdRaw;
      if (raw) {
        const formatted = formatDateTime(raw);
        if (formatted !== "-") {
          time = formatted;
        }
      }

      return {
        id: insp._id,
        time,
        treeCode: tree?.tree_code || insp.tree_code || "—",
        farm: farm?.farm_name || "—",
        zone: zone?.zone_name || "—",
        disease: det?.disease_name || "Chưa phát hiện",
        risk,
        inspector: insp.inspector_name || "—",
        status: insp.status || "—",
        action,
      };
    });
  }, [inspections, treeMap, zoneMap, farmMap, detectionMap, farmFilter, zoneFilter, inspectionTableData]);

  // --- Filtered detections ---
  const filteredDetections = useMemo(() => {
    if (farmFilter === "all" && zoneFilter === "all") return detections;
    return detections.filter((d) => {
      const inspection = inspectionMap.get(d.inspection_id);
      const tree = inspection ? treeMap.get(inspection.tree_id) : undefined;
      if (!tree) return false;
      if (farmFilter !== "all") {
        const zone = zoneMap.get(tree.zone_id);
        if (!zone || zone.farm_id !== farmFilter) return false;
      }
      if (zoneFilter !== "all" && tree.zone_id !== zoneFilter) return false;
      return true;
    });
  }, [detections, inspectionMap, treeMap, zoneMap, farmFilter, zoneFilter]);

  // --- Filtered priority trees (top 5 from filtered detections) ---
  const filteredPriorityTrees = useMemo(() => {
    if (filteredDetections.length === 0) return [];
    return filteredDetections
      .map((d) => {
        const inspection = inspectionMap.get(d.inspection_id);
        const tree = inspection ? treeMap.get(inspection.tree_id) : undefined;
        const confidence = Math.round(d.confidence);

        const zone = tree ? zoneMap.get(tree.zone_id) : undefined;
        const zoneName = zone?.zone_name || tree?.zone_name || "—";

        const farmId = zone?.farm_id;
        const farm = farmId ? farmMap.get(farmId) : undefined;
        const farmName = farm?.farm_name || tree?.farm_name || "—";

        const treeCode = tree?.tree_code || "Chưa có dữ liệu";
        const prediction = (d as unknown as Record<string, unknown>).prediction as string | undefined;
        const disease = prediction || d.disease_name || "Khỏe mạnh";

        return {
          id: 0,
          treeId: treeCode,
          riskScore: confidence,
          status: confidence >= 90 ? "Nghiêm trọng" : confidence >= 80 ? "Cảnh báo" : "Khỏe mạnh",
          farm: farmName,
          zone: zoneName,
          disease,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((row, i) => ({ ...row, id: i + 1 }));
  }, [filteredDetections, inspectionMap, treeMap, zoneMap, farmMap]);

  const filteredHighRiskCount = useMemo(
    () => filteredDetections.filter((d) => Math.round(d.confidence) >= 90).length,
    [filteredDetections],
  );

  // --- Filtered alert counts ---
  const filteredAlertCounts = useMemo(() => {
    if (farmFilter === "all" && zoneFilter === "all") return alertCounts;

    const filteredAlerts = alerts.filter((a) => {
      if (!a.tree_id) return true; // system alerts — always show
      const tree = treeMap.get(a.tree_id);
      if (!tree) return false;
      if (farmFilter !== "all") {
        const zone = zoneMap.get(tree.zone_id);
        if (!zone || zone.farm_id !== farmFilter) return false;
      }
      if (zoneFilter !== "all" && tree.zone_id !== zoneFilter) return false;
      return true;
    });

    const high = filteredAlerts.filter((a) => (a.priority || "").toLowerCase() === "high").length;
    const medium = filteredAlerts.filter((a) => (a.priority || "").toLowerCase() === "medium").length;
    const low = filteredAlerts.filter((a) => (a.priority || "").toLowerCase() === "low").length;
    return { high, medium, low };
  }, [alerts, farmFilter, zoneFilter, treeMap, zoneMap, alertCounts]);

  const filteredEmergencyCount = useMemo(() => {
    const highAlertTreeIdsFiltered = [
      ...new Set(
        alerts
          .filter((a) => a.tree_id && (a.priority || "").toLowerCase() === "high")
          .map((a) => a.tree_id as string)
          .filter((tid) => filteredTreeIds.has(tid))
      ),
    ];
    return highAlertTreeIdsFiltered.length;
  }, [alerts, filteredTreeIds]);

  // Reset zone filter when farm changes
  useEffect(() => {
    setZoneFilter("all");
  }, [farmFilter]);

  // Farm status
  const farmStatus = useMemo(() => {
    if (filteredPriorityTrees.length === 0) return "Healthy";
    const maxConfidence = Math.max(...filteredPriorityTrees.map((t) => t.riskScore));
    if (maxConfidence >= 90) return "Critical";
    if (maxConfidence >= 80) return "Warning";
    return "Healthy";
  }, [filteredPriorityTrees]);

  return (
    <div className="flex flex-col bg-[#F5F7FB]" style={{ gap: "20px", flex: "1 1 0%", minHeight: 0 }}>
      <DashboardHeader loading={loading} onRefresh={fetchDashboardData} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-[16px] text-sm font-semibold" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5" style={{ gridTemplateRows: "auto 520px 420px" }}>
          <div className="lg:col-span-3">
            <KPISection
              totalTrees={filteredKpiTotalTrees}
              newTreesThisMonth={newTreesThisMonth}
              healthyPercent={filteredHealthyPercent}
              farmArea={filteredFarmAreaFormatted}
              farmCount={filteredFarmCount}
              zoneCount={filteredZoneCount}
              emergencyCount={filteredEmergencyCount}
            />
          </div>
          <WeatherForecastCard />
          <HeatmapCard
            sections={zoneSections}
            lastUpdated={heatmapLastUpdated}
            summaryCounts={heatmapSummary}
            onRefresh={fetchDashboardData}
            farmOptions={farmOptions}
            zoneOptions={zoneOptions}
            selectedFarm={farmFilter}
            selectedZone={zoneFilter}
            onFarmChange={setFarmFilter}
            onZoneChange={setZoneFilter}
          />
          <div className="lg:row-span-2">
            <AgronomistPanel
              priorityTrees={filteredPriorityTrees}
              farmStatus={farmStatus}
              kpiHealthyCount={filteredKpiHealthyCount}
              kpiMonitoringCount={filteredKpiMonitoringCount}
              kpiDiseasedCount={filteredKpiDiseasedCount}
              alertCounts={filteredAlertCounts}
              highRiskCount={filteredHighRiskCount}
            />
          </div>
          <TreeDistributionCard data={filteredFarmHealthData} total={filteredKpiTotalTrees} />
          <RealtimeInspectionCard data={filteredInspectionRows} onRefresh={fetchDashboardData} />
        </div>
      )}
    </div>
  );
}
