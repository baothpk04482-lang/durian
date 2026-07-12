export interface Disease {
  _id: string; // MongoDB document identifier
  name: string;
  disease_name?: string;
  common_name?: string;
  scientific_name: string;
  category: string;
  description?: string;
  symptoms: string[] | string;
  treatment: string;
  prevention: string;
  severity: string;
  created_at: string;
}

export interface CreateDiseaseRequest {
  name: string;
  scientific_name: string;
  category: string;
  symptoms: string[] | string;
  treatment: string;
  prevention: string;
  severity: string;
  description?: string;
}

export type UpdateDiseaseRequest = Partial<CreateDiseaseRequest>;
