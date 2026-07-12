// Single mock data export aligned 100% with the finalized MongoDB schema for disease_history
export const diseaseHistoryMockData = {
  statistics: {
    totalRecords: 196,
    activeInfections: 32,
    averageConfidence: 89.2,
    severeCases: 8,
  },
  filters: {
    trees: [
      { tree_id: "t1", tree_code: "TR-001" },
      { tree_id: "t2", tree_code: "TR-002" },
      { tree_id: "t3", tree_code: "TR-003" },
      { tree_id: "t4", tree_code: "TR-004" },
    ],
    diseases: ["All", "Healthy", "Root Rot", "Leaf Spot", "Fruit Borer", "Powdery Mildew", "Phytophthora"],
    severities: ["All", "Mild", "Moderate", "Severe"],
  },
  table: {
    rows: [
      {
        _id: "h1",
        tree_id: "t1",
        disease_name: "Healthy",
        confidence: 98.5,
        severity: "Mild",
        image_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-06-15",
      },
      {
        _id: "h2",
        tree_id: "t2",
        disease_name: "Leaf Spot",
        confidence: 64.2,
        severity: "Moderate",
        image_url: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-06-20",
      },
      {
        _id: "h3",
        tree_id: "t3",
        disease_name: "Healthy",
        confidence: 95.0,
        severity: "Mild",
        image_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-05-10",
      },
      {
        _id: "h4",
        tree_id: "t4",
        disease_name: "Phytophthora",
        confidence: 88.0,
        severity: "Severe",
        image_url: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=120",
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
