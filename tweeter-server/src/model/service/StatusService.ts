import { FakeData, Status, type StatusDto } from "tweeter-shared";
import type TweeterService from "./TweeterService.js";
import {
  assertAlias,
  assertPageSize,
  assertStatusDto,
  assertToken,
} from "./Validation.js";

export class StatusService implements TweeterService {
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

    // TODO: Replace with real DB call
    return this.getFakeData(lastItem, pageSize);
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

    // TODO: Replace with real DB call
    return this.getFakeData(lastItem, pageSize);
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    assertToken(token);
    assertStatusDto(newStatus, "newStatus");

    // TODO: Persist status and fan out to followers' feeds (SQS in Milestone 4)
  }

  private async getFakeData(
    lastItem: StatusDto | null,
    pageSize: number,
  ): Promise<[StatusDto[], boolean]> {
    const lastStatus = lastItem ? Status.fromDto(lastItem) : null;

    const [items, hasMore] = FakeData.instance.getPageOfStatuses(
      lastStatus,
      pageSize,
    );
    const dtos = items.map((s: Status) => s.dto);
    return [dtos, hasMore];
  }
}
