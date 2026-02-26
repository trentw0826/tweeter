import { AuthToken, Status } from "tweeter-shared";
import { PAGE_SIZE } from "./PagedItemPresenter";
import { StatusItemPresenter } from "./StatusItemPresenter";

export class FeedPresenter extends StatusItemPresenter {
  protected itemDescription(): string {
    return "load feed items";
  }

  protected retrieveMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[Status[], boolean]> {
    return this.service.retrievePageOfFeedItems(
      authToken,
      userAlias,
      PAGE_SIZE,
      this.lastItem,
    );
  }
}
