import { AuthToken } from "tweeter-shared/dist/model/domain/AuthToken";
import { User } from "tweeter-shared/dist/model/domain/User";
import { UserService } from "../model.service/UserService";

export interface UserItemView {
  addItems: (items: User[]) => void;
  displayErrorMessage: (message: string) => void;
}

export abstract class UserItemPresenter {
  private _view: UserItemView;
  private _hasMoreItems = true;
  private _lastItem: User | null = null;
  private _userService: UserService;

  // Protected constructor because this class is not meant to be instantiated directly.
  protected constructor(view: UserItemView) {
    this._view = view;
    this._userService = new UserService();
  }

  protected get view(): UserItemView {
    return this._view;
  }

  protected get lastItem() {
    return this._lastItem;
  }

  protected set lastItem(item: User | null) {
    this._lastItem = item;
  }

  public get hasMore(): boolean {
    return this._hasMoreItems;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }

  public abstract loadMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<void>;

  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    return this._userService.getUser(authToken, alias);
  }

  public reset() {
    this.lastItem = null;
    this.hasMoreItems = true;
  }
}
