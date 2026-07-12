export interface Company {
  _id: string; // MongoDB document identifier
  company_code: string;
  company_name: string;
  district: string;
  province: string;
  created_at?: string;
  total_farms?: number;
  total_zones?: number;
  total_trees?: number;
}

export type CreateCompanyRequest = Omit<Company, "_id" | "created_at" | "total_farms" | "total_zones" | "total_trees">;
export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;
