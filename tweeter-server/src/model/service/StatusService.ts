import type { StatusDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import {
  assertAlias,
  assertPageSize,
  assertStatusDto,
  assertToken,
} from "./Validation.js";
import { DaoFactory } from "../../data-access/index.js";
import type { StatusDao } from "../../data-access/index.js";

export class StatusService implements TweeterService {
  private statusDao: StatusDao;

  public constructor() {
    const daoFactory = DaoFactory.getInstance();
    this.statusDao = daoFactory.getStatusDao();
  }

  public async retrievePageOfFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    assertToken(token);
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastItem !== null) {
      assertStatusDto(lastItem, "lastItem");
    }

    // TODO: Query DAO to retrieve paginated feed items based on lastItem
    const feedItems = await this.statusDao.getStatusesByUser(userAlias);
    return [feedItems, false];
  }

  public async retrievePageOfStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    assertToken(token);
    assertAlias(userAlias, "userAlias");
    assertPageSize(pageSize);
    if (lastItem !== null) {
      assertStatusDto(lastItem, "lastItem");
    }

    // TODO: Query DAO to retrieve paginated story items based on lastItem
    const storyItems = await this.statusDao.getStatusesByUser(userAlias);
    return [storyItems, false];
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    assertToken(token);
    assertStatusDto(newStatus, "newStatus");

    // TODO: Persist status via DAO and fan out to followers' feeds (SQS in Milestone 4)
    await this.statusDao.saveStatus(newStatus);
  }
}
