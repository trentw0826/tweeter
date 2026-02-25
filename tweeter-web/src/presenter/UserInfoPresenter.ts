import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { FollowService } from "../model.service/FollowService";
import { MessageView, Presenter } from "./Presenter";

export interface UserInfoView extends MessageView {
  setIsFollower: (value: boolean) => void;
  setFolloweeCount: (count: number) => void;
  setFollowerCount: (count: number) => void;
  setIsLoading: (value: boolean) => void;
  setDisplayedUser: (user: User) => void;
  navigateTo: (path: string) => void;
}

export class UserInfoPresenter extends Presenter<UserInfoView> {
  private _userService: UserService;
  private _followService: FollowService;

  public constructor(view: UserInfoView) {
    super(view);
    this._userService = new UserService();
    this._followService = new FollowService();
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
    await this.doFailureReportingOperation(
      "determine follower status",
      async () => {
        if (currentUser.equals(displayedUser)) {
          this.view.setIsFollower(false);
        } else {
          const isFollower = await this._userService.isFollower(
            authToken,
            currentUser,
            displayedUser,
          );
          this.view.setIsFollower(isFollower);
        }
      },
    );
  }

  public async loadFolloweeCount(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.doFailureReportingOperation("get followees count", async () => {
      const count = await this._userService.getFolloweeCount(
        authToken,
        displayedUser,
      );
      this.view.setFolloweeCount(count);
    });
  }

  public async loadFollowerCount(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.doFailureReportingOperation("get followers count", async () => {
      const count = await this._userService.getFollowerCount(
        authToken,
        displayedUser,
      );
      this.view.setFollowerCount(count);
    });
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

    this.view.setIsLoading(true);
    followingUserToast = this.view.displayInfoMessage(
      `Following ${displayedUser.name}...`,
      0,
    );

    await this.doFailureReportingOperation("follow user", async () => {
      await this._followService.follow(authToken, displayedUser);
      this.view.setIsFollower(true);
      await this.loadFollowerCount(authToken, displayedUser);
      await this.loadFolloweeCount(authToken, displayedUser);
    });

    this.view.deleteMessage(followingUserToast);
    this.view.setIsLoading(false);
  }

  public async unfollow(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    let unfollowingUserToast = "";

    this.view.setIsLoading(true);
    unfollowingUserToast = this.view.displayInfoMessage(
      `Unfollowing ${displayedUser.name}...`,
      0,
    );

    await this.doFailureReportingOperation("unfollow user", async () => {
      await this._followService.unfollow(authToken, displayedUser);
      this.view.setIsFollower(false);
      await this.loadFollowerCount(authToken, displayedUser);
      await this.loadFolloweeCount(authToken, displayedUser);
    });

    this.view.deleteMessage(unfollowingUserToast);
    this.view.setIsLoading(false);
  }
}
