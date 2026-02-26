import { AuthToken, User } from "tweeter-shared";
import { UserItemPresenter } from "./UserItemPresenter";
import { PAGE_SIZE } from "./PagedItemPresenter";

export class FollowerPresenter extends UserItemPresenter {
  protected itemDescription(): string {
    return "load followers";
  }
  protected retrieveMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[User[], boolean]> {
    return this.service.retrievePageOfFollowers(
      authToken,
      userAlias,
      PAGE_SIZE,
      this.lastItem,
    );
  }
}
