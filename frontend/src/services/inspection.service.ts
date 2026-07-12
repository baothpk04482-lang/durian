import { BaseService } from "./base.service";
import type { Inspection } from "../types/inspection";

class InspectionService extends BaseService<Inspection> {
  constructor() {
    super("/inspections");
  }
}

export const inspectionService = new InspectionService();
export default inspectionService;
