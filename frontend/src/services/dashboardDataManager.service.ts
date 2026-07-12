import { companyService } from "./company.service";
import { farmService } from "./farm.service";
import { zoneService } from "./zone.service";
import { treeService } from "./tree.service";
import { userService } from "./user.service";
import { inspectionService } from "./inspection.service";
import { detectionResultService } from "./detectionResult.service";
import { diseaseService } from "./disease.service";
import { alertService } from "./alert.service";
import type { Farm } from "../types/farm";
import type { Zone } from "../types/zone";
import type { Tree } from "../types/tree";
import type { Inspection } from "../types/inspection";
import type { DetectionResult } from "../types/detectionResult";
import type { Disease } from "../types/disease";
import type { Alert } from "../types/alert";

// Backend max per_page = 100 (app/core/dependencies.py:75, le=100)
const MAX_DASHBOARD_PAGE_SIZE = 100;

export interface DashboardErrors {
  companies: string | null;
  farms: string | null;
  zones: string | null;
  trees: string | null;
  users: string | null;
  alerts: string | null;
  detections: string | null;
  inspections: string | null;
  diseases: string | null;
}

export interface DashboardData {
  companies: unknown[];
  farms: Farm[];
  zones: Zone[];
  trees: Tree[];
  users: unknown[];
  alerts: Alert[];
  detections: DetectionResult[];
  inspections: Inspection[];
  diseases: Disease[];
  errors: DashboardErrors;
  kpiTotalTrees: number;
  kpiFarmCount: number;
  kpiZoneCount: number;
  kpiFarmArea: number;
  kpiHealthyCount: number;
  kpiMonitoringCount: number;
  kpiDiseasedCount: number;
  kpiEmergencyCount: number;
}

const EMPTY_ERRORS: DashboardErrors = {
  companies: null, farms: null, zones: null, trees: null,
  users: null, alerts: null, detections: null, inspections: null, diseases: null,
};

type PaginatedResponse<T> = T[] & { total?: number };

async function fetchAllPages<T>(
  firstPage: PaginatedResponse<T>,
  fetchPage: (page: number) => Promise<T[]>,
): Promise<T[]> {
  const total = firstPage.total ?? firstPage.length;
  if (total <= firstPage.length) return [...firstPage];

  const remainingPages = Math.ceil(total / MAX_DASHBOARD_PAGE_SIZE) - 1;
  const pagePromises: Promise<T[]>[] = [];
  for (let p = 2; p <= remainingPages + 1; p++) {
    pagePromises.push(fetchPage(p).catch(() => [] as T[]));
  }
  const restPages = await Promise.all(pagePromises);
  const all: T[] = [...firstPage];
  for (const page of restPages) {
    all.push(...page);
  }
  return all;
}

async function fetchAllTreeData(firstPage: PaginatedResponse<Tree>): Promise<{
  allTrees: Tree[];
  healthy: number;
  monitoring: number;
  diseased: number;
}> {
  const allTrees = await fetchAllPages(firstPage, (p) =>
    treeService.get<Tree[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE, page: p } }),
  );

  let healthy = 0;
  let monitoring = 0;
  let diseased = 0;
  for (const t of allTrees) {
    if (t.status === "Healthy") healthy++;
    else if (t.status === "Monitoring") monitoring++;
    else diseased++;
  }
  return { allTrees, healthy, monitoring, diseased };
}

async function fetchAllDetectionData(firstPage: PaginatedResponse<DetectionResult>): Promise<{
  allDetections: DetectionResult[];
  emergencyCount: number;
}> {
  const allDetections = await fetchAllPages(firstPage, (p) =>
    detectionResultService.get<DetectionResult[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE, page: p } }),
  );

  const distinct = new Set<string>();
  for (const d of allDetections) {
    if (d.confidence >= 80 && d.tree_id) distinct.add(d.tree_id);
  }
  return { allDetections, emergencyCount: distinct.size };
}

async function fetchAllZoneData(firstPage: PaginatedResponse<Zone>): Promise<Zone[]> {
  return fetchAllPages(firstPage, (p) =>
    zoneService.get<Zone[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE, page: p } }),
  );
}

async function fetchAllFarmData(firstPage: PaginatedResponse<Farm>): Promise<Farm[]> {
  return fetchAllPages(firstPage, (p) =>
    farmService.get<Farm[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE, page: p } }),
  );
}

// TODO: Replace DashboardDataManager with Dashboard Overview API when backend Release 2 is available
export async function loadDashboardData(): Promise<DashboardData> {
  const results = await Promise.allSettled([
    companyService.get<any[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    farmService.get<Farm[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    zoneService.get<Zone[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    treeService.get<Tree[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    userService.get<any[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    inspectionService.get<Inspection[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    detectionResultService.get<DetectionResult[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    diseaseService.get<Disease[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    alertService.get<Alert[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
  ]);

  const extract = <T>(r: PromiseSettledResult<T>): T => {
    if (r.status === "fulfilled") return r.value;
    return [] as unknown as T;
  };
  const extractError = (r: PromiseSettledResult<unknown>): string | null => {
    if (r.status === "rejected") return r.reason instanceof Error ? r.reason.message : String(r.reason);
    return null;
  };

  const treesFirstPage = (extract(results[3]) || []) as PaginatedResponse<Tree>;
  const detectionsFirstPage = (extract(results[6]) || []) as PaginatedResponse<DetectionResult>;
  const zonesFirstPage = (extract(results[2]) || []) as PaginatedResponse<Zone>;
  const farmsFirstPage = (extract(results[1]) || []) as PaginatedResponse<Farm>;

  const [treeResult, detectionResult, allZones, allFarms] = await Promise.all([
    fetchAllTreeData(treesFirstPage),
    fetchAllDetectionData(detectionsFirstPage),
    fetchAllZoneData(zonesFirstPage),
    fetchAllFarmData(farmsFirstPage),
  ]);

  const kpiTotalTrees = treesFirstPage.total ?? treesFirstPage.length;
  const kpiFarmCount = farmsFirstPage.total ?? farmsFirstPage.length;
  const kpiZoneCount = zonesFirstPage.total ?? zonesFirstPage.length;
  const kpiFarmArea = allFarms.reduce((sum, f) => sum + (f.area_hectare || 0), 0);

  return {
    companies: extract(results[0]) || [],
    farms: allFarms,
    zones: allZones,
    trees: treeResult.allTrees,
    users: extract(results[4]) || [],
    alerts: extract(results[8]) || [],
    detections: detectionResult.allDetections,
    inspections: extract(results[5]) || [],
    diseases: extract(results[7]) || [],
    kpiTotalTrees,
    kpiFarmCount,
    kpiZoneCount,
    kpiFarmArea,
    kpiHealthyCount: treeResult.healthy,
    kpiMonitoringCount: treeResult.monitoring,
    kpiDiseasedCount: treeResult.diseased,
    kpiEmergencyCount: detectionResult.emergencyCount,
    errors: {
      ...EMPTY_ERRORS,
      companies: extractError(results[0]),
      farms: extractError(results[1]),
      zones: extractError(results[2]),
      trees: extractError(results[3]),
      users: extractError(results[4]),
      alerts: extractError(results[8]),
      detections: extractError(results[6]),
      inspections: extractError(results[5]),
      diseases: extractError(results[7]),
    },
  };
}
