export interface DiseaseHistory {
  _id: string; // MongoDB document identifier
  tree_id: string;
  tree_code?: string;
  disease: string;
  date: string;
  action: string;
  created_at: string;
}

export interface CreateDiseaseHistoryRequest {
  tree_id: string;
  disease: string;
  date: string;
  action: string;
}

export type UpdateDiseaseHistoryRequest = Partial<CreateDiseaseHistoryRequest>;
