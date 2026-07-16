export interface Alert {
  _id: string;
  farm_id: string;
  tree_id?: string;
  alert_type: string;
  priority: string;
  date: string;
  created_at: string;
}

export interface CreateAlertRequest {
  farm_id: string;
  tree_id?: string;
  alert_type: string;
  priority: string;
  date: string;
}

export type UpdateAlertRequest = Partial<CreateAlertRequest>;
