export interface Tree {
  _id: string; // MongoDB document identifier
  zone_id: string;
  tree_code: string;
  variety: string;
  planting_date?: string;
  planted_date?: string;
  age: number;
  tree_age?: number;
  status: string;
  created_at?: string;
  farm_name?: string;
  zone_name?: string;
  zone_code?: string;
}

export interface CreateTreeRequest {
  zone_id: string;
  tree_code: string;
  variety: string;
  age: number;
  status: string;
  planting_date?: string;
}

export type UpdateTreeRequest = Partial<CreateTreeRequest>;
