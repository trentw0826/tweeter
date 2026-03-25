import type { UserDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import { assertAlias, assertToken, assertUserDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { UserDao } from "../../data-access/index.js";
import type { FollowDao } from "../../data-access/index.js";

export class UserService implements TweeterService {
  private userDao: UserDao;
  private followDao: FollowDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    this.userDao = daoFactory.getUserDao();
    this.followDao = daoFactory.getFollowDao();
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    assertToken(token);
    assertAlias(alias);

    return this.userDao.getUser(alias);
  }

  public async isFollower(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    assertToken(token);
    assertUserDto(user, "user");
    assertUserDto(selectedUser, "selectedUser");

    return this.followDao.isFollowing(user.alias, selectedUser.alias);
  }

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    assertToken(token);
    assertUserDto(user, "user");

    return this.userDao.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    assertToken(token);
    assertUserDto(user, "user");

    return this.userDao.getFollowerCount(user.alias);
  }
}
