export interface User {
  _id: string; // MongoDB document identifier
  user_code?: string;
  company_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  created_at: string;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password?: string;
  role: string;
  company_id?: string;
  status?: string;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;
