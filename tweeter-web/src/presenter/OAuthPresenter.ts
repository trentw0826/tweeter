import { AuthService } from "../model.service/AuthService";

export interface OAuthView {
  displayInfoMessage: (
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ) => void;
  displayErrorMessage: (message: string) => void;
}

export class OAuthPresenter {
  private _view: OAuthView;
  private _authService: AuthService;

  public constructor(view: OAuthView) {
    this._view = view;
    this._authService = new AuthService();
  }

  public async handleOAuthClick(providerName: string): Promise<void> {
    try {
      const isAuthenticated = await this._authService.oauthLogin(providerName);

      if (!isAuthenticated) {
        this._view.displayInfoMessage(
          `${providerName} registration is not implemented.`,
          3000,
          "text-white bg-primary",
        );
      }
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to authenticate with ${providerName} because of exception: ${error}`,
      );
    }
  }
}
