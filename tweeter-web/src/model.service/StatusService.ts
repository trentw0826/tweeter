import { AuthToken, Status } from "tweeter-shared";
import { Service } from "./Service";
import serverFacade from "../network/ServerFacade";

export class StatusService implements Service {
  public async retrievePageOfFeedItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null,
  ): Promise<[Status[], boolean]> {
    const response = await serverFacade.getFeedItems({
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastItem ? lastItem.dto : null,
    });
    const statuses = (response.items ?? []).map((dto) => Status.fromDto(dto)!);
    return [statuses, response.hasMore];
  }

  public async retrievePageOfStoryItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null,
  ): Promise<[Status[], boolean]> {
    const response = await serverFacade.getStoryItems({
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastItem ? lastItem.dto : null,
    });
    const statuses = (response.items ?? []).map((dto) => Status.fromDto(dto)!);
    return [statuses, response.hasMore];
  }

  public async postStatus(
    authToken: AuthToken,
    newStatus: Status,
  ): Promise<void> {
    await serverFacade.postStatus({
      token: authToken.token,
      newStatus: newStatus.dto,
    });
  }
}
