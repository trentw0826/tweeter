import { AuthToken, User } from "tweeter-shared";
import { UserItemPresenter } from "./UserItemPresenter";
import { PAGE_SIZE } from "./PagedItemPresenter";

export class FolloweePresenter extends UserItemPresenter {
  protected itemDescription(): string {
    return "load followees";
  }

  protected retrieveMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[User[], boolean]> {
    return this.service.retrievePageOfFollowees(
      authToken,
      userAlias,
      PAGE_SIZE,
      this.lastItem,
    );
  }
}
