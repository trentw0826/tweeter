import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";

export interface NavigateToUserView {
  displayErrorMessage: (message: string) => void;
  setDisplayedUser: (user: User) => void;
  navigateTo: (path: string) => void;
}

export class NavigateToUserPresenter {
  private _view: NavigateToUserView;
  private _userService: UserService;
  private _selectedUserAlias: string = "";

  public constructor(view: NavigateToUserView) {
    this._view = view;
    this._userService = new UserService();
  }

  protected get view(): NavigateToUserView {
    return this._view;
  }

  protected get userService(): UserService {
    return this._userService;
  }

  public extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  }

  public async navigateToUser(
    eventTargetString: string,
    authToken: AuthToken,
    displayedUser: User,
    featurePath: string,
  ): Promise<void> {
    try {
      const alias = this.extractAlias(eventTargetString);
      this._selectedUserAlias = alias;

      const toUser = await this._userService.getUser(authToken, alias);

      if (toUser) {
        if (!toUser.equals(displayedUser)) {
          this._view.setDisplayedUser(toUser);
          this._view.navigateTo(`${featurePath}/${toUser.alias}`);
        }
      }
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to get user because of exception: ${error}`,
      );
    }
  }
}
