import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { Presenter, View } from "./Presenter";

export interface NavigateToUserView extends View {
  setDisplayedUser: (user: User) => void;
  navigateTo: (path: string) => void;
}

export class NavigateToUserPresenter extends Presenter<NavigateToUserView> {
  private _userService: UserService;
  private _selectedUserAlias: string = "";

  public constructor(view: NavigateToUserView) {
    super(view);
    this._userService = new UserService();
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
    await this.doFailureReportingOperation("get user", async () => {
      const alias = this.extractAlias(eventTargetString);
      this._selectedUserAlias = alias;

      const toUser = await this._userService.getUser(authToken, alias);

      if (toUser) {
        if (!toUser.equals(displayedUser)) {
          this.view.setDisplayedUser(toUser);
          this.view.navigateTo(`${featurePath}/${toUser.alias}`);
        }
      }
    });
  }
}
