import { AuthService } from "../model.service/AuthService";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { MessageView, Presenter, View } from "./Presenter";

export interface OAuthView extends View {
  displayInfoMessage: (
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ) => void;
}

export interface OAuthProps {
  heading: string;
}

export interface OAuthProvider {
  name: string;
  icon: IconName;
}

export class OAuthPresenter extends Presenter<OAuthView> {
  private _authService: AuthService;
  private readonly _providers: OAuthProvider[] = [
    { name: "Google", icon: "google" },
    { name: "Facebook", icon: "facebook" },
    { name: "Twitter", icon: "twitter" },
    { name: "LinkedIn", icon: "linkedin" },
    { name: "GitHub", icon: "github" },
  ];

  public constructor(view: OAuthView) {
    super(view);
    this._authService = new AuthService();
  }

  public getProviders(): OAuthProvider[] {
    return this._providers;
  }

  public async handleOAuthClick(provider: OAuthProvider): Promise<void> {
    await this.doFailureReportingOperation(
      `authenticate with ${provider.name}`,
      async () => {
        const isAuthenticated = await this._authService.oauthLogin(
          provider.name,
        );

        if (!isAuthenticated) {
          this.view.displayInfoMessage(
            `${provider.name} registration is not implemented.`,
            3000,
            "text-white bg-primary",
          );
        }
      },
    );
  }

  public getOAuthProviders(): OAuthProvider[] {
    return this._providers;
  }
}
