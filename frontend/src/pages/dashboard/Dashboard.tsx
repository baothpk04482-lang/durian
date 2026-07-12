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
  const healthyPercent = kpiTotalTrees > 0 ? Math.round((kpiHealthyCount / kpiTotalTrees) * 100) : 0;

  const highAlertTreeIds = [...new Set(alerts.filter((a) => a.tree_id && (a.priority || "").toLowerCase() === "high").map((a) => a.tree_id as string))];
  const emergencyCount = kpiEmergencyCount > 0 ? kpiEmergencyCount : highAlertTreeIds.length;

  const newTreesThisMonth = 0;

  const kpiFarmCount = farms.length;
  const kpiZoneCount = zones.length;
  const farmArea = farms.reduce((sum, f) => sum + (f.area_hectare || 0), 0);
  const kpiFarmAreaFormatted = `${farmArea.toFixed(1)} ha`;

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
    return [{ value: "all", label: "All Farms" }, ...farms.map((f) => ({ value: f._id, label: f.farm_name }))];
  }, [farms]);

  const zoneOptions = useMemo(() => {
    const filtered = farmFilter === "all" ? zones : zones.filter((z) => z.farm_id === farmFilter);
    return [{ value: "all", label: "All Zones" }, ...filtered.map((z) => ({ value: z._id, label: z.zone_name }))];
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
      const zoneName = zone?.zone_name || t.zone_name || t.zone_id || "Unknown";
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

  // --- Priority Trees ---
  const priorityTrees = useMemo(() => {
    if (detections.length === 0) return [];
    return detections
      .map((d) => {
        const inspection = inspectionMap.get(d.inspection_id);
        const tree = inspection ? treeMap.get(inspection.tree_id) : undefined;
        const confidence = Math.round(d.confidence);

        const zone = tree ? zoneMap.get(tree.zone_id) : undefined;
        const zoneName = zone?.zone_name || tree?.zone_name || "—";

        const farmId = zone?.farm_id;
        const farm = farmId ? farmMap.get(farmId) : undefined;
        const farmName = farm?.farm_name || tree?.farm_name || "—";

        const treeCode = tree?.tree_code || "Tree unavailable";
        const prediction = (d as unknown as Record<string, unknown>).prediction as string | undefined;
        const disease = prediction || d.disease_name || "Healthy";

        return {
          id: 0,
          treeId: treeCode,
          riskScore: confidence,
          status: confidence >= 90 ? "Critical" : confidence >= 80 ? "Warning" : "Healthy",
          farm: farmName,
          zone: zoneName,
          disease,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((row, i) => ({ ...row, id: i + 1 }));
  }, [detections, inspectionMap, treeMap, zoneMap, farmMap]);

  const highRiskCount = useMemo(
    () => detections.filter((d) => Math.round(d.confidence) >= 90).length,
    [detections],
  );

  // Last updated from real data
  const heatmapLastUpdated = useMemo(() => {
    const dates = [
      ...inspections.map((i) => i.inspection_date || i.created_at).filter(Boolean),
      ...detections.map((d) => d.created_at).filter(Boolean),
    ] as string[];
    if (dates.length === 0) return "09:30 AM";
    const latest = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return new Date(latest).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [inspections, detections]);

  // Farm Health Distribution
  const farmHealthData = useMemo(() => {
    return [
      { name: "Healthy", value: kpiHealthyCount, color: "#22C55E" },
      { name: "Monitoring", value: kpiMonitoringCount, color: "#EAB308" },
      { name: "Diseased", value: kpiDiseasedCount, color: "#EF4444" },
    ];
  }, [kpiHealthyCount, kpiMonitoringCount, kpiDiseasedCount]);

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
      const action = risk >= 90 ? "Inspect Today" : risk >= 80 ? "Monitor" : "Review";

      let time = "—";
      const dateRaw = insp.inspection_date;
      const createdRaw = insp.created_at;
      const raw = dateRaw && dateRaw.includes("T") ? dateRaw : createdRaw;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
        }
      }

      return {
        id: insp._id,
        time,
        treeCode: tree?.tree_code || insp.tree_code || "—",
        farm: farm?.farm_name || "—",
        zone: zone?.zone_name || "—",
        disease: det?.disease_name || "Not Detected",
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

  // Reset zone filter when farm changes
  useEffect(() => {
    setZoneFilter("all");
  }, [farmFilter]);

  // Farm status
  const farmStatus = useMemo(() => {
    if (priorityTrees.length === 0) return "Healthy";
    const maxConfidence = Math.max(...priorityTrees.map((t) => t.riskScore));
    if (maxConfidence >= 90) return "Critical";
    if (maxConfidence >= 80) return "Warning";
    return "Healthy";
  }, [priorityTrees]);

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
              totalTrees={kpiTotalTrees}
              newTreesThisMonth={newTreesThisMonth}
              healthyPercent={healthyPercent}
              farmArea={kpiFarmAreaFormatted}
              farmCount={kpiFarmCount}
              zoneCount={kpiZoneCount}
              emergencyCount={emergencyCount}
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
              priorityTrees={priorityTrees}
              farmStatus={farmStatus}
              kpiHealthyCount={kpiHealthyCount}
              kpiMonitoringCount={kpiMonitoringCount}
              kpiDiseasedCount={kpiDiseasedCount}
              alertCounts={alertCounts}
              highRiskCount={highRiskCount}
            />
          </div>
          <TreeDistributionCard data={farmHealthData} total={kpiTotalTrees} />
          <RealtimeInspectionCard data={inspectionTableData} onRefresh={fetchDashboardData} />
        </div>
      )}
    </div>
  );
}
