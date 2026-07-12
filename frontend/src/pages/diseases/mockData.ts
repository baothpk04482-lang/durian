// Single mock data export aligned 100% with the finalized MongoDB schema for diseases
export const diseasesMockData = {
  statistics: {
    totalDiseases: 6,
    fungalPathogens: 4,
    insectPests: 1,
    commonPathogen: "Leaf Spot",
  },
  filters: {
    categories: ["All", "Fungal", "Bacterial", "Insect Pest", "None"],
  },
  table: {
    rows: [
      {
        _id: "dis1",
        disease_name: "Healthy",
        common_name: "Healthy Tree",
        category: "None",
        description: "Tree is healthy with normal color, growth, and leaf structure.",
        symptoms: "No symptoms present.",
        treatment: "No treatment required. Normal monitoring.",
        created_at: "2026-01-01",
      },
      {
        _id: "dis2",
        disease_name: "Leaf Spot",
        common_name: "Leaf Spot Disease",
        category: "Fungal",
        description: "Fungal infection causing circular dark spots on crop leaves.",
        symptoms: "Circular brown or black spots, leaf yellowing and premature leaf fall.",
        treatment: "Apply organic copper-based fungicide, prune infected leaves, ensure proper air flow.",
        created_at: "2026-01-05",
      },
      {
        _id: "dis3",
        disease_name: "Root Rot",
        common_name: "Root Rot Disease",
        category: "Fungal",
        description: "Fungal decay of roots caused by excessive soil water or water-logging.",
        symptoms: "Wilting, leaf yellowing, slow growth, decayed and brown/black roots.",
        treatment: "Improve soil drainage, apply systemic fungicide, reduce irrigation frequency.",
        created_at: "2026-01-10",
      },
      {
        _id: "dis4",
        disease_name: "Fruit Borer",
        common_name: "Fruit Borer Beetle",
        category: "Insect Pest",
        description: "Larvae bore into fruit causing damage and rot.",
        symptoms: "Holes in durian husks, brown frass, premature fruit drop, rotting smell.",
        treatment: "Remove infested fruit, apply neem oil or organic insecticide, place pheromone traps.",
        created_at: "2026-01-15",
      },
    ],
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalRecords: 4,
  },
};
