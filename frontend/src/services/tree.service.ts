import { BaseService } from "./base.service";
import type { Tree } from "../types/tree";

class TreeService extends BaseService<Tree> {
  constructor() {
    super("/trees");
  }
}

export const treeService = new TreeService();
export default treeService;
