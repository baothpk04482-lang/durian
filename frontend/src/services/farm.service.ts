import { BaseService } from "./base.service";
import type { Farm } from "../types/farm";

class FarmService extends BaseService<Farm> {
  constructor() {
    super("/farms");
  }
}

export const farmService = new FarmService();
export default farmService;
