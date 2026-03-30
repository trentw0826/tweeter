import type { UserDto } from "tweeter-shared";
import { AuthenticatedService } from "./AuthenticatedService.js";
import { assertAlias, assertPageSize, assertUserDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao } from "../../data-access/index.js";
import type { StatusDao } from "../../data-access/index.js";

export class FollowService extends AuthenticatedService {
  private followDao: FollowDao;
  private statusDao: StatusDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    super(daoFactory);
    this.followDao = daoFactory.getFollowDao();
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
    await this.requireAuthenticatedAlias(token);

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
    await this.requireAuthenticatedAlias(token);

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

    const currentUserAlias = await this.requireAuthenticatedAlias(token);
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

    const currentUserAlias = await this.requireAuthenticatedAlias(token);
    await this.followDao.removeFollow(currentUserAlias, userToUnfollow.alias);
    await this.userDao.updateFolloweeCount(currentUserAlias, -1);
    await this.userDao.updateFollowerCount(userToUnfollow.alias, -1);
    await this.statusDao.removeFeedItemsByAuthor(
      currentUserAlias,
      userToUnfollow.alias,
    );
  }
}
