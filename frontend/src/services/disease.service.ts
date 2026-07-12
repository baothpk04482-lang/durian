import { BaseService } from "./base.service";
import type { Disease } from "../types/disease";

class DiseaseService extends BaseService<Disease> {
  constructor() {
    super("/diseases");
  }
}

export const diseaseService = new DiseaseService();
export default diseaseService;
