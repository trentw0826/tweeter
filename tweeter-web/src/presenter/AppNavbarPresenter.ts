import { AuthToken } from "tweeter-shared";
import { AuthPresenter } from "./AuthPresenter";
import { MessageView } from "./Presenter";

export interface AppNavbarView extends MessageView {
  clearUserInfo: () => void;
}

export class AppNavbarPresenter extends AuthPresenter<AppNavbarView> {
  public constructor(view: AppNavbarView) {
    super(view);
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const toastId = this.view.displayInfoMessage("Logging Out...", 0);

    await this.doFailureReportingOperation("log user out", async () => {
      await this.authService.logout(authToken);
      this.view.clearUserInfo();
      this.view.navigateTo("/login");
    });

    this.view.deleteMessage(toastId);
  }
}
