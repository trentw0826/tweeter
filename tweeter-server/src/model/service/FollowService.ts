import type { UserDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import { assertAlias, assertPageSize, assertUserDto } from "./Validation.js";
import { requireAuthenticatedAlias } from "./Authentication.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao } from "../../data-access/index.js";
import type { UserDao } from "../../data-access/index.js";
import type { StatusDao } from "../../data-access/index.js";

export class FollowService implements TweeterService {
  private followDao: FollowDao;
  private userDao: UserDao;
  private statusDao: StatusDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
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
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastFollower !== null) {
      assertUserDto(lastFollower, "lastFollower");
    }

    await requireAuthenticatedAlias(this.userDao, token);

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
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastFollowee !== null) {
      assertUserDto(lastFollowee, "lastFollowee");
    }

    await requireAuthenticatedAlias(this.userDao, token);

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
    assertUserDto(userToFollow, "userToFollow");

    const currentUserAlias = await requireAuthenticatedAlias(
      this.userDao,
      token,
    );
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
    assertUserDto(userToUnfollow, "userToUnfollow");

    const currentUserAlias = await requireAuthenticatedAlias(
      this.userDao,
      token,
    );
    await this.followDao.removeFollow(currentUserAlias, userToUnfollow.alias);
    await this.userDao.updateFolloweeCount(currentUserAlias, -1);
    await this.userDao.updateFollowerCount(userToUnfollow.alias, -1);
    await this.statusDao.removeFeedItemsByAuthor(
      currentUserAlias,
      userToUnfollow.alias,
    );
  }
}
