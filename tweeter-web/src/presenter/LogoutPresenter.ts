import { AuthToken } from "tweeter-shared";
import { AuthService } from "../model.service/AuthService";
import { MessageView, Presenter } from "./Presenter";

export interface LogoutView extends MessageView {
  clearUserInfo: () => void;
  navigateTo: (url: string) => void;
}

export class LogoutPresenter extends Presenter<LogoutView> {
  private _authService: AuthService;

  public constructor(view: LogoutView) {
    super(view);
    this._authService = new AuthService();
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const loggingOutToastId = this.view.displayInfoMessage("Logging Out...", 0);

    await this.doFailureReportingOperation("log user out", async () => {
      await this._authService.logout(authToken);
      this.view.clearUserInfo();
      this.view.navigateTo("/login");
    });

    this.view.deleteMessage(loggingOutToastId);
  }
}
