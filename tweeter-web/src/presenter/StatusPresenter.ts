import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";
import { MessageView, Presenter } from "./Presenter";

export interface PostStatusView extends MessageView {
  setIsLoading: (value: boolean) => void;
  clearPost: () => void;
}

export class PostStatusPresenter extends Presenter<PostStatusView> {
  private _statusService: StatusService;

  public constructor(view: PostStatusView) {
    super(view);
    this._statusService = new StatusService();
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
    await this.doLoadingOperationWithToast(
      this.view,
      "Posting status...",
      "post the status",
      async () => {
        const status = new Status(post, currentUser, Date.now());
        await this._statusService.postStatus(authToken, status);

        this.view.clearPost();
        this.view.displayInfoMessage("Status posted!", 2000);
      },
    );
  }
}
