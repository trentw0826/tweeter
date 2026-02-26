import { AuthToken } from "tweeter-shared";
import { AuthPresenter } from "./AuthPresenter";
import { MessageView } from "./Presenter";

export interface LogoutView extends MessageView {
  clearUserInfo: () => void;
  navigateTo: (url: string) => void;
}

export class LogoutPresenter extends AuthPresenter<LogoutView> {
  public constructor(view: LogoutView) {
    super(view);
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const loggingOutToastId = this.view.displayInfoMessage("Logging Out...", 0);

    await this.doFailureReportingOperation("log user out", async () => {
      await this.authService.logout(authToken);
      this.view.clearUserInfo();
      this.view.navigateTo("/login");
    });

    this.view.deleteMessage(loggingOutToastId);
  }
}
