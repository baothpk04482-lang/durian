import { BaseService } from "./base.service";
import type { Zone } from "../types/zone";

class ZoneService extends BaseService<Zone> {
  constructor() {
    super("/zones");
  }
}

export const zoneService = new ZoneService();
export default zoneService;
