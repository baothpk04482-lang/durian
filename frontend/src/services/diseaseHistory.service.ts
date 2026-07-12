import { BaseService } from "./base.service";
import type { DiseaseHistory } from "../types/diseaseHistory";

class DiseaseHistoryService extends BaseService<DiseaseHistory> {
  constructor() {
    super("/disease-history");
  }
}

export const diseaseHistoryService = new DiseaseHistoryService();
export default diseaseHistoryService;
