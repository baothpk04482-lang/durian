export interface Alert {
  _id: string; // MongoDB document identifier
  farm_id: string;
  tree_id?: string;
  title: string;
  content: string;
  status: string;
  alert_type?: string;
  priority?: string;
  created_at: string;
}

export interface CreateAlertRequest {
  farm_id: string;
  tree_id?: string;
  title: string;
  content: string;
  status: string;
}

export type UpdateAlertRequest = Partial<CreateAlertRequest>;
