import { AuthToken, User } from "tweeter-shared";
import { UserServicePresenter } from "./UserServicePresenter";
import { FollowService } from "../model.service/FollowService";
import { MessageView } from "./Presenter";

export interface UserInfoView extends MessageView {
  setIsFollower: (value: boolean) => void;
  setFolloweeCount: (count: number) => void;
  setFollowerCount: (count: number) => void;
  setIsLoading: (value: boolean) => void;
  setDisplayedUser: (user: User) => void;
  navigateTo: (path: string) => void;
}

export class UserInfoPresenter extends UserServicePresenter<UserInfoView> {
  private _followService: FollowService;

  public constructor(view: UserInfoView) {
    super(view);
    this._followService = new FollowService();
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
          const isFollower = await this.userService.isFollower(
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
      const count = await this.userService.getFolloweeCount(
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
      const count = await this.userService.getFollowerCount(
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

  private async performFollowAction(
    authToken: AuthToken,
    displayedUser: User,
    action: "follow" | "unfollow",
    isFollowerValue: boolean,
  ): Promise<void> {
    const actionVerb = action === "follow" ? "Following" : "Unfollowing";
    await this.doLoadingOperationWithToast(
      this.view,
      `${actionVerb} ${displayedUser.name}...`,
      `${action} user`,
      async () => {
        await this._followService[action](authToken, displayedUser);
        this.view.setIsFollower(isFollowerValue);
        await this.loadFollowerCount(authToken, displayedUser);
        await this.loadFolloweeCount(authToken, displayedUser);
      },
    );
  }

  public async follow(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.performFollowAction(authToken, displayedUser, "follow", true);
  }

  public async unfollow(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.performFollowAction(authToken, displayedUser, "unfollow", false);
  }
}
