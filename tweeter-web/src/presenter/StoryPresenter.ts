import { AuthToken, Status } from "tweeter-shared";
import { PAGE_SIZE } from "./PagedItemPresenter";
import { StatusItemPresenter } from "./StatusItemPresenter";

export class StoryPresenter extends StatusItemPresenter {
  protected itemDescription(): string {
    return "load story items";
  }

  protected retrieveMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[Status[], boolean]> {
    return this.service.retrievePageOfStoryItems(
      authToken,
      userAlias,
      PAGE_SIZE,
      this.lastItem,
    );
  }
}
