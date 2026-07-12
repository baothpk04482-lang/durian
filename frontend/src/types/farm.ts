export interface Farm {
  _id: string; // MongoDB document identifier
  farm_code: string;
  farm_name: string;
  company_id: string;
  district: string;
  area_hectare: number;
  tree_count: number;
  created_at: string;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
}

export interface CreateFarmRequest {
  name: string;
  farm_code: string;
  company_id: string;
  district: string;
  area: number;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
}

export type UpdateFarmRequest = Partial<CreateFarmRequest>;
