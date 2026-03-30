import type { UserDto } from "tweeter-shared";
import { AuthenticatedService } from "./AuthenticatedService.js";
import { assertAlias, assertUserDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao } from "../../data-access/index.js";
import { requireAuthenticatedAlias } from "./Authentication.js";

export class UserService extends AuthenticatedService {
  private followDao: FollowDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    super(daoFactory);
    this.followDao = daoFactory.getFollowDao();
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    await this.requireAuthenticatedAlias(token);
    assertAlias(alias);
    await requireAuthenticatedAlias(this.userDao, token);

    return this.userDao.getUser(alias);
  }

  public async isFollower(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    await this.requireAuthenticatedAlias(token);
    assertUserDto(user, "user");
    assertUserDto(selectedUser, "selectedUser");
    await requireAuthenticatedAlias(this.userDao, token);

    return this.followDao.isFollowing(user.alias, selectedUser.alias);
  }

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    await this.requireAuthenticatedAlias(token);
    assertUserDto(user, "user");
    await requireAuthenticatedAlias(this.userDao, token);

    return this.userDao.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    await this.requireAuthenticatedAlias(token);
    assertUserDto(user, "user");
    await requireAuthenticatedAlias(this.userDao, token);

    return this.userDao.getFollowerCount(user.alias);
  }
}
