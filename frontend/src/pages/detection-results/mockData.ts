// Single mock data export aligned 100% with the finalized MongoDB schema for detection_results
export const detectionResultsMockData = {
  statistics: {
    totalDetections: 142,
    highConfidenceDetections: 110,
    averageConfidence: 86.4,
    severeDetections: 12,
  },
  filters: {
    inspections: [
      { inspection_id: "i1", inspection_code: "INS-0001" },
      { inspection_id: "i2", inspection_code: "INS-0002" },
      { inspection_id: "i3", inspection_code: "INS-0003" },
      { inspection_id: "i4", inspection_code: "INS-0004" },
    ],
    severities: ["All", "Mild", "Moderate", "Severe"],
    predictions: ["All", "Healthy", "Root Rot", "Leaf Spot", "Fruit Borer", "Powdery Mildew", "Phytophthora"],
  },
  table: {
    rows: [
      {
        _id: "d1",
        inspection_id: "i1",
        prediction: "Healthy",
        confidence: 98.5,
        severity: "Mild",
        image_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-06-15",
      },
      {
        _id: "d2",
        inspection_id: "i2",
        prediction: "Leaf Spot",
        confidence: 64.2,
        severity: "Moderate",
        image_url: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-06-20",
      },
      {
        _id: "d3",
        inspection_id: "i3",
        prediction: "Healthy",
        confidence: 95.0,
        severity: "Mild",
        image_url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=120",
        created_at: "2026-05-10",
      },
      {
        _id: "d4",
        inspection_id: "i4",
        prediction: "Phytophthora",
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
