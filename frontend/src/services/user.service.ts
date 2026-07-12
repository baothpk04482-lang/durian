import { BaseService } from "./base.service";
import type { User } from "../types/user";

class UserService extends BaseService<User> {
  constructor() {
    super("/users");
  }
}

export const userService = new UserService();
export default userService;
