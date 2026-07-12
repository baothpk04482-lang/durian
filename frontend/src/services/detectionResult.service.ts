import { BaseService } from "./base.service";
import type { DetectionResult } from "../types/detectionResult";

class DetectionResultService extends BaseService<DetectionResult> {
  constructor() {
    super("/detection-results");
  }
}

export const detectionResultService = new DetectionResultService();
export default detectionResultService;
