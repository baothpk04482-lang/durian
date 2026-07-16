export interface Disease {
  _id: string;
  code: string;
  name: string;
  affected_part: string;
  severity: string;
  description?: string;
  recommendation: string;
  created_at: string;
}

export interface CreateDiseaseRequest {
  code: string;
  name: string;
  affected_part: string;
  severity: string;
  description?: string;
  recommendation: string;
}

export type UpdateDiseaseRequest = Partial<CreateDiseaseRequest>;
