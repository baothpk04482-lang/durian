export interface DiseaseHistory {
  _id: string; // MongoDB document identifier
  tree_id: string;
  detection_result_id: string;
  inspection_id: string;
  tree_code: string;
  disease_name: string;
  severity: string;
  confidence: number;
  status: string;
  created_at: string;
}

export interface CreateDiseaseHistoryRequest {
  tree_id: string;
  detection_result_id: string;
  inspection_id: string;
  disease_name: string;
  severity: string;
  confidence: number;
  status: string;
}

export type UpdateDiseaseHistoryRequest = Partial<CreateDiseaseHistoryRequest>;
