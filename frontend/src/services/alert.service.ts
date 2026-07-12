import { BaseService } from "./base.service";
import type { Alert } from "../types/alert";

class AlertService extends BaseService<Alert> {
  constructor() {
    super("/alerts");
  }
}

export const alertService = new AlertService();
export default alertService;
