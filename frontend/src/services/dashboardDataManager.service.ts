import { farmService } from "./farm.service";
import { zoneService } from "./zone.service";
import { treeService } from "./tree.service";
import { inspectionService } from "./inspection.service";
import { detectionResultService } from "./detectionResult.service";
import { alertService } from "./alert.service";
import api from "../api";
import type { Farm } from "../types/farm";
import type { Zone } from "../types/zone";
import type { Tree } from "../types/tree";
import type { Inspection } from "../types/inspection";
import type { DetectionResult } from "../types/detectionResult";
import type { Alert } from "../types/alert";

const MAX_DASHBOARD_PAGE_SIZE = 100;

export interface DashboardErrors {
  farms: string | null;
  zones: string | null;
  trees: string | null;
  alerts: string | null;
  detections: string | null;
  inspections: string | null;
  dashboard: string | null;
}

export interface BackendKpi {
  total_farms: number;
  total_trees: number;
  healthy_trees: number;
  diseased_trees: number;
  high_risk_trees: number;
}

export interface SystemOverviewData {
  inspection_today: number;
  ai_detection_today: number;
  new_alerts_today: number;
  pending_review: number;
  updated_at: string;
}

export interface DashboardData {
  farms: Farm[];
  zones: Zone[];
  trees: Tree[];
  alerts: Alert[];
  detections: DetectionResult[];
  inspections: Inspection[];
  errors: DashboardErrors;
  backendKpi: BackendKpi;
  systemOverview: SystemOverviewData;
}

const EMPTY_ERRORS: DashboardErrors = {
  farms: null, zones: null, trees: null, alerts: null,
  detections: null, inspections: null, dashboard: null,
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

async function fetchAllTreeData(firstPage: PaginatedResponse<Tree>): Promise<Tree[]> {
  return fetchAllPages(firstPage, (p) =>
    treeService.get<Tree[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE, page: p } }),
  );
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

export async function loadDashboardData(): Promise<DashboardData> {
  const results = await Promise.allSettled([
    farmService.get<Farm[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    zoneService.get<Zone[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    treeService.get<Tree[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    inspectionService.get<Inspection[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    detectionResultService.get<DetectionResult[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    alertService.get<Alert[]>({ params: { per_page: MAX_DASHBOARD_PAGE_SIZE } }),
    api.get("/dashboard").then((r) => r.data).catch(() => null),
  ]);

  const extract = <T>(r: PromiseSettledResult<T>): T => {
    if (r.status === "fulfilled") return r.value;
    return [] as unknown as T;
  };
  const extractError = (r: PromiseSettledResult<unknown>): string | null => {
    if (r.status === "rejected") return r.reason instanceof Error ? r.reason.message : String(r.reason);
    return null;
  };

  const treesFirstPage = (extract(results[2]) || []) as PaginatedResponse<Tree>;
  const zonesFirstPage = (extract(results[1]) || []) as PaginatedResponse<Zone>;
  const farmsFirstPage = (extract(results[0]) || []) as PaginatedResponse<Farm>;

  const [allTrees, allZones, allFarms] = await Promise.all([
    fetchAllTreeData(treesFirstPage),
    fetchAllZoneData(zonesFirstPage),
    fetchAllFarmData(farmsFirstPage),
  ]);

  const dashboardResult = results[6];
  let backendKpi: BackendKpi = { total_farms: 0, total_trees: 0, healthy_trees: 0, diseased_trees: 0, high_risk_trees: 0 };
  let systemOverview: SystemOverviewData = { inspection_today: 0, ai_detection_today: 0, new_alerts_today: 0, pending_review: 0, updated_at: "" };
  if (dashboardResult.status === "fulfilled" && dashboardResult.value) {
    const resp = dashboardResult.value as { kpi?: BackendKpi; system_overview?: SystemOverviewData };
    backendKpi = resp?.kpi ?? backendKpi;
    systemOverview = resp?.system_overview ?? systemOverview;
  }

  return {
    farms: allFarms,
    zones: allZones,
    trees: allTrees,
    alerts: extract(results[5]) || [],
    detections: extract(results[4]) || [],
    inspections: extract(results[3]) || [],
    backendKpi,
    systemOverview,
    errors: {
      ...EMPTY_ERRORS,
      farms: extractError(results[0]),
      zones: extractError(results[1]),
      trees: extractError(results[2]),
      alerts: extractError(results[5]),
      detections: extractError(results[4]),
      inspections: extractError(results[3]),
      dashboard: extractError(results[6]),
    },
  };
}
