import { AuthToken, User } from "tweeter-shared";
import { UserServicePresenter } from "./UserServicePresenter";
import { View } from "./Presenter";
import { Service } from "../model.service/Service";

export const PAGE_SIZE = 10;

export interface PagedItemView<T> extends View {
  addItems: (items: T[]) => void;
}

export abstract class PagedItemPresenter<
  T,
  U extends Service,
> extends UserServicePresenter<PagedItemView<T>> {
  private _hasMoreItems = true;
  private _lastItem: T | null = null;
  private _service: U;

  public constructor(view: PagedItemView<T>) {
    super(view);
    this._service = this.serviceFactory();
  }

  protected abstract serviceFactory(): U;

  protected get lastItem() {
    return this._lastItem;
  }

  protected set lastItem(item: T | null) {
    this._lastItem = item;
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }

  protected get service(): U {
    return this._service;
  }

  public async loadMoreItems(authToken: AuthToken, userAlias: string) {
    this.doFailureReportingOperation(this.itemDescription(), async () => {
      const [newItems, hasMore] = await this.retrieveMoreItems(
        authToken!,
        userAlias,
      );

      this.hasMoreItems = hasMore;
      this.lastItem =
        newItems.length > 0 ? newItems[newItems.length - 1] : null;
      this.view.addItems(newItems);
    });
  }

  protected abstract itemDescription(): string;

  protected abstract retrieveMoreItems(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[T[], boolean]>;

  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    return this.userService.getUser(authToken, alias);
  }

  public reset() {
    this.lastItem = null;
    this.hasMoreItems = true;
  }
}
