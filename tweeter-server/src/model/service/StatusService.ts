import type { StatusDto } from "tweeter-shared";
import { AuthenticatedService } from "./AuthenticatedService.js";
import { assertAlias, assertPageSize, assertStatusDto } from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { StatusDao } from "../../data-access/index.js";

export class StatusService extends AuthenticatedService {
  private readonly statusDao: StatusDao;

  public constructor(daoFactory: DaoFactory = DaoFactory.getInstance()) {
    super(daoFactory);
    this.statusDao = daoFactory.getStatusDao();
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
  }

  public async addStatusToFeeds(
    followerAliases: string[],
    status: StatusDto,
  ): Promise<void> {
    assertStatusDto(status, "status");
    await this.statusDao.addStatusToFeeds(followerAliases, status);
  }
}
