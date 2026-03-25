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
import type { StatusDao } from "../../data-access/index.js";

export class FollowService implements TweeterService {
  private followDao: FollowDao;
  private userDao: UserDao;
  private statusDao: StatusDao;

  public constructor() {
    const daoFactory = DaoFactory.getInstance();
    this.followDao = daoFactory.getFollowDao();
    this.userDao = daoFactory.getUserDao();
    this.statusDao = daoFactory.getStatusDao();
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

    const page = await this.followDao.getFollowersPage(
      userAlias,
      pageSize,
      lastFollower?.alias ?? null,
    );

    const followers: UserDto[] = [];
    for (const alias of page.items) {
      const user = await this.userDao.getUser(alias);
      if (user) {
        followers.push(user);
      }
    }

    return [followers, page.hasMore];
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

    const page = await this.followDao.getFolloweesPage(
      userAlias,
      pageSize,
      lastFollowee?.alias ?? null,
    );

    const followees: UserDto[] = [];
    for (const alias of page.items) {
      const user = await this.userDao.getUser(alias);
      if (user) {
        followees.push(user);
      }
    }

    return [followees, page.hasMore];
  }

  public async follow(token: string, userToFollow: UserDto): Promise<void> {
    assertToken(token);
    assertUserDto(userToFollow, "userToFollow");

    const currentUserAlias = await this.getAliasFromTokenOrThrow(token);
    if (currentUserAlias === userToFollow.alias) {
      throw new Error("[bad-request] Cannot follow yourself");
    }

    await this.followDao.addFollow(currentUserAlias, userToFollow.alias);
    await this.userDao.updateFolloweeCount(currentUserAlias, 1);
    await this.userDao.updateFollowerCount(userToFollow.alias, 1);
    await this.statusDao.backfillFeedFromStory(
      currentUserAlias,
      userToFollow.alias,
    );
  }

  public async unfollow(token: string, userToUnfollow: UserDto): Promise<void> {
    assertToken(token);
    assertUserDto(userToUnfollow, "userToUnfollow");

    const currentUserAlias = await this.getAliasFromTokenOrThrow(token);
    await this.followDao.removeFollow(currentUserAlias, userToUnfollow.alias);
    await this.userDao.updateFolloweeCount(currentUserAlias, -1);
    await this.userDao.updateFollowerCount(userToUnfollow.alias, -1);
    await this.statusDao.removeFeedItemsByAuthor(
      currentUserAlias,
      userToUnfollow.alias,
    );
  }

  private async getAliasFromTokenOrThrow(token: string): Promise<string> {
    const alias = await this.userDao.getAliasByAuthToken(token);
    if (alias === null) {
      throw new Error("[unauthorized] Invalid auth token");
    }

    return alias;
  }
}
