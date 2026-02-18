import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";
import { UserService } from "../model.service/UserService";

export interface StatusItemView {
  addItems: (items: Status[]) => void;
  displayErrorMessage: (message: string) => void;
}

export abstract class StatusItemPresenter {
  private _view: StatusItemView;
  private _hasMoreItems = true;
  private _lastItem: Status | null = null;
  private _statusService: StatusService;
  private _userService: UserService;

  protected constructor(view: StatusItemView) {
    this._view = view;
    this._statusService = new StatusService();
    this._userService = new UserService();
  }

  protected get view(): StatusItemView {
    return this._view;
  }

  protected get lastItem() {
    return this._lastItem;
  }

  protected set lastItem(item: Status | null) {
    this._lastItem = item;
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }

  protected get statusService(): StatusService {
    return this._statusService;
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
