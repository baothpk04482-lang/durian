// Single mock data export aligned 100% with the finalized MongoDB schema for farms
export const farmsMockData = {
  statistics: {
    totalFarms: 36,
    averageAreaHectare: 10.5,
    totalAreaHectare: 378.5,
    totalTrees: 8450,
  },
  filters: {
    companies: [
      { company_id: "COM-001", company_name: "Thai Durian Alliance" },
      { company_id: "COM-002", company_name: "Green Harvest Corp" },
      { company_id: "COM-003", company_name: "Chumphon Growers Co" },
    ],
    districts: ["All", "Mueang Chanthaburi", "Klaeng", "Lamae"],
  },
  table: {
    rows: [
      {
        _id: "f1",
        farm_code: "FRM-001",
        farm_name: "Chanthaburi Gold",
        company_id: "COM-001",
        district: "Mueang Chanthaburi",
        area_hectare: 12.5,
        tree_count: 1250,
        created_at: "2026-01-15",
      },
      {
        _id: "f2",
        farm_code: "FRM-002",
        farm_name: "Rayong Sweet",
        company_id: "COM-002",
        district: "Klaeng",
        area_hectare: 8.2,
        tree_count: 820,
        created_at: "2026-02-20",
      },
      {
        _id: "f3",
        farm_code: "FRM-003",
        farm_name: "Chumphon Valley",
        company_id: "COM-003",
        district: "Lamae",
        area_hectare: 15.0,
        tree_count: 1500,
        created_at: "2026-03-10",
      },
      {
        _id: "f4",
        farm_code: "FRM-004",
        farm_name: "East Durian Orchard",
        company_id: "COM-001",
        district: "Mueang Chanthaburi",
        area_hectare: 6.8,
        tree_count: 680,
        created_at: "2026-04-25",
      },
    ],
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalRecords: 4,
  },
};
