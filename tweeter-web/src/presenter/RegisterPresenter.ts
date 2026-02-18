import { AuthPresenter, AuthView } from "./AuthPresenter";

export class RegisterPresenter extends AuthPresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string,
    rememberMe: boolean,
  ): Promise<void> {
    try {
      this.view.setIsLoading(true);

      const [user, authToken] = await this.authService.register(
        firstName,
        lastName,
        alias,
        password,
        userImageBytes,
        imageFileExtension,
      );

      this.view.updateUserInfo(user, authToken, rememberMe);
      this.view.navigateTo(`/feed/${user.alias}`);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to register user because of exception: ${error}`,
      );
    } finally {
      this.view.setIsLoading(false);
    }
  }
}
