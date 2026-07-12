export interface Zone {
  _id: string; // MongoDB document identifier
  farm_id: string;
  zone_code?: string;
  zone_name: string;
  tree_count: number;
  created_at: string;
}

export interface CreateZoneRequest {
  farm_id: string;
  name: string;
  tree_count: number;
}

export type UpdateZoneRequest = Partial<CreateZoneRequest>;
