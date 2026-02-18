import { AuthPresenter, AuthView } from "./AuthPresenter";

export class LoginPresenter extends AuthPresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async login(
    alias: string,
    password: string,
    rememberMe: boolean,
    originalUrl?: string,
  ): Promise<void> {
    try {
      this.view.setIsLoading(true);

      const [user, authToken] = await this.authService.login(alias, password);

      this.view.updateUserInfo(user, authToken, rememberMe);
      this.view.navigateTo(originalUrl ?? `/feed/${user.alias}`);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to log user in because of exception: ${error}`,
      );
    } finally {
      this.view.setIsLoading(false);
    }
  }
}
