// Single mock data export aligned 100% with the finalized MongoDB schema for zones
export const zonesMockData = {
  statistics: {
    totalZones: 96,
    averageTreesPerZone: 88,
    totalTrees: 8450,
    maxTreesPerZone: 250,
  },
  filters: {
    farms: [
      { farm_id: "f1", farm_name: "Chanthaburi Gold" },
      { farm_id: "f2", farm_name: "Rayong Sweet" },
      { farm_id: "f3", farm_name: "Chumphon Valley" },
      { farm_id: "f4", farm_name: "East Durian Orchard" },
    ],
  },
  table: {
    rows: [
      {
        _id: "z1",
        zone_name: "Zone A1",
        farm_id: "f1",
        tree_count: 150,
        created_at: "2026-01-16",
      },
      {
        _id: "z2",
        zone_name: "Zone A2",
        farm_id: "f1",
        tree_count: 120,
        created_at: "2026-01-18",
      },
      {
        _id: "z3",
        zone_name: "Zone B1",
        farm_id: "f2",
        tree_count: 220,
        created_at: "2026-02-22",
      },
      {
        _id: "z4",
        zone_name: "Zone C1",
        farm_id: "f3",
        tree_count: 180,
        created_at: "2026-03-12",
      },
    ],
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalRecords: 4,
  },
};
