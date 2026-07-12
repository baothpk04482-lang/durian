export interface DetectionResult {
  _id: string; // MongoDB document identifier
  inspection_id: string;
  tree_id: string;
  inspection_code: string;
  tree_code: string;
  disease_name: string;
  severity: string;
  confidence: number;
  image_url: string;
  created_at: string;
}

export type CreateDetectionResultRequest = Omit<DetectionResult, "_id" | "created_at">;
export type UpdateDetectionResultRequest = Partial<CreateDetectionResultRequest>;
