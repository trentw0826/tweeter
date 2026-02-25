import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { Presenter, View } from "./Presenter";

export interface UserItemView extends View {
  addItems: (items: User[]) => void;
}

export abstract class UserItemPresenter extends Presenter<UserItemView> {
  private _hasMoreItems = true;
  private _lastItem: User | null = null;
  private _userService: UserService;

  protected constructor(view: UserItemView) {
    super(view);
    this._userService = new UserService();
  }

  protected get lastItem() {
    return this._lastItem;
  }

  protected set lastItem(item: User | null) {
    this._lastItem = item;
  }

  public get hasMoreItems(): boolean {
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
