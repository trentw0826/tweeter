import { UserService } from "../model.service/UserService";
import { Presenter, View } from "./Presenter";

export abstract class UserServicePresenter<
  V extends View,
> extends Presenter<V> {
  private _userService: UserService;

  protected constructor(view: V) {
    super(view);
    this._userService = new UserService();
  }

  protected get userService(): UserService {
    return this._userService;
  }
}
