import { AuthToken } from "tweeter-shared";
import { AuthService } from "../model.service/AuthService";

export interface LogoutView {
  displayInfoMessage: (message: string, duration: number) => string;
  deleteMessage: (messageId: string) => void;
  clearUserInfo: () => void;
  navigateTo: (url: string) => void;
  displayErrorMessage: (message: string) => void;
}

export class LogoutPresenter {
  private _view: LogoutView;
  private _authService: AuthService;

  public constructor(view: LogoutView) {
    this._view = view;
    this._authService = new AuthService();
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const loggingOutToastId = this._view.displayInfoMessage(
      "Logging Out...",
      0,
    );

    try {
      await this._authService.logout(authToken);

      this._view.deleteMessage(loggingOutToastId);
      this._view.clearUserInfo();
      this._view.navigateTo("/login");
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to log user out because of exception: ${error}`,
      );
    }
  }
}
