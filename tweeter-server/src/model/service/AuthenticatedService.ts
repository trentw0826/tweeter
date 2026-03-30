import type TweeterService from "./TweeterService.js";
import { DaoFactory } from "../../data-access/index.js";
import type { UserDao } from "../../data-access/index.js";
import { assertToken } from "./Validation.js";

export abstract class AuthenticatedService implements TweeterService {
  protected readonly userDao: UserDao;

  protected constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    this.userDao = daoFactory.getUserDao();
  }

  protected async requireAuthenticatedAlias(token: string): Promise<string> {
    assertToken(token);

    const alias = await this.userDao.getAliasByAuthToken(token);
    if (alias === null) {
      throw new Error("[unauthorized] Invalid auth token");
    }

    return alias;
  }
}
