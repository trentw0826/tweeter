import type { StatusDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import { assertAlias, assertPageSize, assertStatusDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao, StatusDao, UserDao } from "../../data-access/index.js";
import { requireAuthenticatedAlias } from "./Authentication.js";

export class StatusService implements TweeterService {
  private readonly statusDao: StatusDao;
  private readonly followDao: FollowDao;
  private readonly userDao: UserDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    this.statusDao = daoFactory.getStatusDao();
    this.followDao = daoFactory.getFollowDao();
    this.userDao = daoFactory.getUserDao();
  }

  public async retrievePageOfFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastItem !== null) {
      assertStatusDto(lastItem, "lastItem");
    }

    await requireAuthenticatedAlias(this.userDao, token);

    const page = await this.statusDao.getFeedPage(
      userAlias,
      pageSize,
      lastItem?.timestamp ?? null,
    );

    return [page.items, page.hasMore];
  }

  public async retrievePageOfStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastItem !== null) {
      assertStatusDto(lastItem, "lastItem");
    }

    await requireAuthenticatedAlias(this.userDao, token);

    const page = await this.statusDao.getStoryPage(
      userAlias,
      pageSize,
      lastItem?.timestamp ?? null,
    );

    return [page.items, page.hasMore];
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    assertStatusDto(newStatus, "newStatus");

    const postingAlias = await requireAuthenticatedAlias(this.userDao, token);

    if (postingAlias !== newStatus.user.alias) {
      throw new Error("[bad-request] Token does not match posting user");
    }

    await this.statusDao.saveStatus(newStatus);
    await this.statusDao.addStatusToFeed(postingAlias, newStatus);

    const followerAliases = await this.followDao.getAllFollowers(postingAlias);
    await this.statusDao.addStatusToFeeds(followerAliases, newStatus);
  }
}
