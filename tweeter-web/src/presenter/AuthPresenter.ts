import { AuthToken, User } from "tweeter-shared";
import { AuthService } from "../model.service/AuthService";
import { Presenter, View } from "./Presenter";

export interface AuthView extends View {
  setIsLoading: (value: boolean) => void;
  updateUserInfo: (
    user: User,
    authToken: AuthToken,
    rememberMe: boolean,
  ) => void;
  navigateTo: (url: string) => void;
}

export abstract class AuthPresenter extends Presenter<AuthView> {
  private _authService: AuthService;

  protected constructor(view: AuthView) {
    super(view);
    this._authService = new AuthService();
  }

  protected get authService(): AuthService {
    return this._authService;
  }
}
