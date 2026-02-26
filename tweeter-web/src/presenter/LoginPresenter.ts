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
    await this.doLoadingOperation(this.view, "log user in", async () => {
      const [user, authToken] = await this.authService.login(alias, password);
      this.view.updateUserInfo(user, authToken, rememberMe);
      this.view.navigateTo(originalUrl ?? `/feed/${user.alias}`);
    });
  }
}
