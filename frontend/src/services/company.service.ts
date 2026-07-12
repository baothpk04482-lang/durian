import { BaseService } from "./base.service";
import type { Company } from "../types/company";

class CompanyService extends BaseService<Company> {
  constructor() {
    super("/companies");
  }
}

export const companyService = new CompanyService();
export default companyService;
