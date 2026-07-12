// Single mock data export aligned 100% with the finalized MongoDB schema for inspections
export const inspectionsMockData = {
  statistics: {
    totalInspections: 254,
    healthyInspections: 210,
    monitoringInspections: 30,
    diseasedInspections: 14,
  },
  filters: {
    trees: [
      { tree_id: "t1", tree_code: "TR-001" },
      { tree_id: "t2", tree_code: "TR-002" },
      { tree_id: "t3", tree_code: "TR-003" },
      { tree_id: "t4", tree_code: "TR-004" },
    ],
    inspectors: [
      { inspector_id: "u3", full_name: "Somchai Jaidee" },
      { inspector_id: "u4", full_name: "Emily Watson" },
    ],
    statuses: ["All", "Healthy", "Monitoring", "Diseased"],
  },
  table: {
    rows: [
      {
        _id: "i1",
        inspection_code: "INS-0001",
        tree_id: "t1",
        inspector_id: "u3",
        health_status: "Healthy",
        confidence: 98.5,
        notes: "Tree shows optimal leaf color and water retention.",
        created_at: "2026-06-15",
      },
      {
        _id: "i2",
        inspection_code: "INS-0002",
        tree_id: "t2",
        inspector_id: "u4",
        health_status: "Monitoring",
        confidence: 64.2,
        notes: "Slight yellowing detected on upper branches.",
        created_at: "2026-06-20",
      },
      {
        _id: "i3",
        inspection_code: "INS-0003",
        tree_id: "t3",
        inspector_id: "u3",
        health_status: "Healthy",
        confidence: 95.0,
        notes: "No visual defects. Bark and soil look excellent.",
        created_at: "2026-05-10",
      },
      {
        _id: "i4",
        inspection_code: "INS-0004",
        tree_id: "t4",
        inspector_id: "u4",
        health_status: "Diseased",
        confidence: 88.0,
        notes: "Fungal infection detected. Immediate application of fungicide recommended.",
        created_at: "2026-07-02",
      },
    ],
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalRecords: 4,
  },
};
