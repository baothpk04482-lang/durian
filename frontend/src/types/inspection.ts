export interface Inspection {
  _id: string; // MongoDB document identifier
  tree_id: string;
  inspector_id: string;
  tree_code: string;
  inspector_name: string;
  inspection_code: string;
  inspection_date: string;
  status: string;
  health_status?: string;
  confidence?: number;
  notes: string;
  created_at: string;
}

export interface CreateInspectionRequest {
  tree_id: string;
  inspector_id: string;
  inspection_code: string;
  inspection_date: string;
  status: string;
  notes: string;
  confidence?: number;
}

export type UpdateInspectionRequest = Partial<CreateInspectionRequest>;
