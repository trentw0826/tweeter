import { AuthToken, User } from "tweeter-shared";
import { AuthService } from "../model.service/AuthService";

export interface AuthView {
  setIsLoading: (value: boolean) => void;
  updateUserInfo: (
    user: User,
    authToken: AuthToken,
    rememberMe: boolean,
  ) => void;
  navigateTo: (url: string) => void;
  displayErrorMessage: (message: string) => void;
}

export abstract class AuthPresenter {
  private _view: AuthView;
  private _authService: AuthService;

  protected constructor(view: AuthView) {
    this._view = view;
    this._authService = new AuthService();
  }

  protected get view(): AuthView {
    return this._view;
  }

  protected get authService(): AuthService {
    return this._authService;
  }
}
