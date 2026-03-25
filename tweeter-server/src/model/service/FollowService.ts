import type { UserDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import {
  assertAlias,
  assertPageSize,
  assertToken,
  assertUserDto,
} from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao } from "../../data-access/index.js";
import type { UserDao } from "../../data-access/index.js";

export class FollowService implements TweeterService {
  private followDao: FollowDao;
  private userDao: UserDao;

  public constructor() {
    const daoFactory = DaoFactory.getInstance();
    this.followDao = daoFactory.getFollowDao();
    this.userDao = daoFactory.getUserDao();
  }

  public async retrievePageOfFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastFollower: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    assertToken(token);
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastFollower !== null) {
      assertUserDto(lastFollower, "lastFollower");
    }

    // TODO: Query DAO to retrieve paginated followers based on lastFollower
    const followerAliases = await this.followDao.getFollowers(userAlias);
    const followers: UserDto[] = [];
    for (const alias of followerAliases) {
      const user = await this.userDao.getUser(alias);
      if (user) {
        followers.push(user);
      }
    }
    return [followers, false];
  }

  public async retrievePageOfFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastFollowee: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    assertToken(token);
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastFollowee !== null) {
      assertUserDto(lastFollowee, "lastFollowee");
    }

    // TODO: Query DAO to retrieve paginated followees based on lastFollowee
    const followeeAliases = await this.followDao.getFollowees(userAlias);
    const followees: UserDto[] = [];
    for (const alias of followeeAliases) {
      const user = await this.userDao.getUser(alias);
      if (user) {
        followees.push(user);
      }
    }
    return [followees, false];
  }

  public async follow(token: string, userToFollow: UserDto): Promise<void> {
    assertToken(token);
    assertUserDto(userToFollow, "userToFollow");

    // TODO: Get current user from token and add follow relationship via DAO
    await this.followDao.addFollow("[current-user-alias]", userToFollow.alias);
  }

  public async unfollow(token: string, userToUnfollow: UserDto): Promise<void> {
    assertToken(token);
    assertUserDto(userToUnfollow, "userToUnfollow");

    // TODO: Get current user from token and remove follow relationship via DAO
    await this.followDao.removeFollow(
      "[current-user-alias]",
      userToUnfollow.alias,
    );
  }
}
