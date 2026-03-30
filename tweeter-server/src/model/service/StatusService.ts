import type { StatusDto } from "tweeter-shared";
import { AuthenticatedService } from "./AuthenticatedService.js";
import { assertAlias, assertPageSize, assertStatusDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { FollowDao, StatusDao } from "../../data-access/index.js";

export class StatusService extends AuthenticatedService {
  private readonly statusDao: StatusDao;
  private readonly followDao: FollowDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    super(daoFactory);
    this.statusDao = daoFactory.getStatusDao();
    this.followDao = daoFactory.getFollowDao();
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
    await this.requireAuthenticatedAlias(token);

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
    await this.requireAuthenticatedAlias(token);

    const page = await this.statusDao.getStoryPage(
      userAlias,
      pageSize,
      lastItem?.timestamp ?? null,
    );

    return [page.items, page.hasMore];
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    assertStatusDto(newStatus, "newStatus");

    const postingAlias = await this.requireAuthenticatedAlias(token);

    if (postingAlias !== newStatus.user.alias) {
      throw new Error("[bad-request] Token does not match posting user");
    }

    await this.statusDao.saveStatus(newStatus);
    await this.statusDao.addStatusToFeed(postingAlias, newStatus);

    const followerAliases = await this.followDao.getAllFollowers(postingAlias);
    await this.statusDao.addStatusToFeeds(followerAliases, newStatus);
  }
}
