import { AuthService } from "../model.service/AuthService";
import { IconName } from "@fortawesome/fontawesome-svg-core";

export interface OAuthView {
  displayInfoMessage: (
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ) => void;
  displayErrorMessage: (message: string) => void;
}

export interface OAuthProps {
  heading: string;
}

export interface OAuthProvider {
  name: string;
  icon: IconName;
}

export class OAuthPresenter {
  private _view: OAuthView;
  private _authService: AuthService;
  private readonly _providers: OAuthProvider[] = [
    { name: "Google", icon: "google" },
    { name: "Facebook", icon: "facebook" },
    { name: "Twitter", icon: "twitter" },
    { name: "LinkedIn", icon: "linkedin" },
    { name: "GitHub", icon: "github" },
  ];

  public constructor(view: OAuthView) {
    this._view = view;
    this._authService = new AuthService();
  }

  public getProviders(): OAuthProvider[] {
    return this._providers;
  }

  public async handleOAuthClick(provider: OAuthProvider): Promise<void> {
    try {
      const isAuthenticated = await this._authService.oauthLogin(provider.name);

      if (!isAuthenticated) {
        this._view.displayInfoMessage(
          `${provider.name} registration is not implemented.`,
          3000,
          "text-white bg-primary",
        );
      }
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to authenticate with ${provider.name} because of exception: ${error}`,
      );
    }
  }

  public getOAuthProviders(): OAuthProvider[] {
    return this._providers;
  }
}
