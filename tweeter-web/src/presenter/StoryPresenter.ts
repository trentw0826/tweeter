import { AuthToken } from "tweeter-shared";
import { StatusItemPresenter, StatusItemView } from "./StatusItemPresenter";

export const PAGE_SIZE = 10;

export class StoryPresenter extends StatusItemPresenter {
  public constructor(view: StatusItemView) {
    super(view);
  }

  public async loadMoreItems(authToken: AuthToken, userAlias: string) {
    this.doFailureReportingOperation("load story items", async () => {
      const [newItems, hasMore] =
        await this.statusService.retrievePageOfStoryItems(
          authToken,
          userAlias,
          PAGE_SIZE,
          this.lastItem,
        );

      this.hasMoreItems = hasMore;
      this.lastItem =
        newItems.length > 0 ? newItems[newItems.length - 1] : null;
      this.view.addItems(newItems);
    });
  }
}
