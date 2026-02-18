import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";

export interface PostStatusView {
  displayInfoMessage: (
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ) => string;
  displayErrorMessage: (message: string) => void;
  deleteMessage: (toastId: string) => void;
  setIsLoading: (value: boolean) => void;
  clearPost: () => void;
}

export class PostStatusPresenter {
  private _view: PostStatusView;
  private _statusService: StatusService;

  public constructor(view: PostStatusView) {
    this._view = view;
    this._statusService = new StatusService();
  }

  protected get view(): PostStatusView {
    return this._view;
  }

  protected get statusService(): StatusService {
    return this._statusService;
  }

  public isPostButtonDisabled(
    post: string,
    authToken: AuthToken | null,
    currentUser: User | null,
  ): boolean {
    return !post.trim() || !authToken || !currentUser;
  }

  public async submitPost(
    post: string,
    authToken: AuthToken,
    currentUser: User,
  ): Promise<void> {
    let postingStatusToastId = "";

    try {
      this._view.setIsLoading(true);
      postingStatusToastId = this._view.displayInfoMessage(
        "Posting status...",
        0,
      );

      const status = new Status(post, currentUser, Date.now());
      await this._statusService.postStatus(authToken, status);

      this._view.clearPost();
      this._view.displayInfoMessage("Status posted!", 2000);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to post the status because of exception: ${error}`,
      );
    } finally {
      this._view.deleteMessage(postingStatusToastId);
      this._view.setIsLoading(false);
    }
  }
}
