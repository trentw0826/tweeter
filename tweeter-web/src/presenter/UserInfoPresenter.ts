import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { FollowService } from "../model.service/FollowService";

export interface UserInfoView {
  displayInfoMessage: (
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ) => string;
  displayErrorMessage: (message: string) => void;
  deleteMessage: (toastId: string) => void;
  setIsFollower: (value: boolean) => void;
  setFolloweeCount: (count: number) => void;
  setFollowerCount: (count: number) => void;
  setIsLoading: (value: boolean) => void;
  setDisplayedUser: (user: User) => void;
  navigateTo: (path: string) => void;
}

export class UserInfoPresenter {
  private _view: UserInfoView;
  private _userService: UserService;
  private _followService: FollowService;

  public constructor(view: UserInfoView) {
    this._view = view;
    this._userService = new UserService();
    this._followService = new FollowService();
  }

  protected get view(): UserInfoView {
    return this._view;
  }

  protected get userService(): UserService {
    return this._userService;
  }

  protected get followService(): FollowService {
    return this._followService;
  }

  public async loadFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User,
  ): Promise<void> {
    try {
      if (currentUser.equals(displayedUser)) {
        this._view.setIsFollower(false);
      } else {
        const isFollower = await this._userService.isFollower(
          authToken,
          currentUser,
          displayedUser,
        );
        this._view.setIsFollower(isFollower);
      }
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to determine follower status because of exception: ${error}`,
      );
    }
  }

  public async loadFolloweeCount(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    try {
      const count = await this._userService.getFolloweeCount(
        authToken,
        displayedUser,
      );
      this._view.setFolloweeCount(count);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to get followees count because of exception: ${error}`,
      );
    }
  }

  public async loadFollowerCount(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    try {
      const count = await this._userService.getFollowerCount(
        authToken,
        displayedUser,
      );
      this._view.setFollowerCount(count);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to get followers count because of exception: ${error}`,
      );
    }
  }

  public getBaseUrl(pathname: string): string {
    const segments = pathname.split("/@");
    return segments.length > 1 ? segments[0] : "/";
  }

  public async follow(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    let followingUserToast = "";

    try {
      this._view.setIsLoading(true);
      followingUserToast = this._view.displayInfoMessage(
        `Following ${displayedUser.name}...`,
        0,
      );

      await this._followService.follow(authToken, displayedUser);

      this._view.setIsFollower(true);
      await this.loadFollowerCount(authToken, displayedUser);
      await this.loadFolloweeCount(authToken, displayedUser);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to follow user because of exception: ${error}`,
      );
    } finally {
      this._view.deleteMessage(followingUserToast);
      this._view.setIsLoading(false);
    }
  }

  public async unfollow(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    let unfollowingUserToast = "";

    try {
      this._view.setIsLoading(true);
      unfollowingUserToast = this._view.displayInfoMessage(
        `Unfollowing ${displayedUser.name}...`,
        0,
      );

      await this._followService.unfollow(authToken, displayedUser);

      this._view.setIsFollower(false);
      await this.loadFollowerCount(authToken, displayedUser);
      await this.loadFolloweeCount(authToken, displayedUser);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to unfollow user because of exception: ${error}`,
      );
    } finally {
      this._view.deleteMessage(unfollowingUserToast);
      this._view.setIsLoading(false);
    }
  }
}
