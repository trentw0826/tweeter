import { AuthToken, User } from "tweeter-shared";
import {
  PostStatusPresenter,
  PostStatusView,
} from "../../src/presenter/StatusPresenter";
import {
  anything,
  capture,
  instance,
  mock,
  spy,
  verify,
  when,
} from "@typestrong/ts-mockito";
import { StatusService } from "../../src/model.service/StatusService";

describe("PostStatusPresenter", () => {
  let mockView: PostStatusView;
  let presenter: PostStatusPresenter;
  let mockService: StatusService;

  const postingToastId = "posting-toast-id";
  const authToken = new AuthToken("test-token", Date.now());
  const currentUser = new User(
    "Test",
    "User",
    "@testuser",
    "https://example.com/pic.png",
  );
  const postText = "Hello, Tweeter!";

  beforeEach(() => {
    mockView = mock<PostStatusView>();
    const viewInstance = instance(mockView);

    // Mock the "Posting status..." toast to return a known ID
    when(mockView.displayInfoMessage("Posting status...", 0)).thenReturn(
      postingToastId,
    );

    const presenterSpy = spy(new PostStatusPresenter(viewInstance));
    presenter = instance(presenterSpy);

    mockService = mock<StatusService>();
    when(presenterSpy.statusService).thenReturn(instance(mockService));
  });

  it("tells the view to display a posting status message", async () => {
    await presenter.submitPost(postText, authToken, currentUser);

    verify(mockView.displayInfoMessage("Posting status...", 0)).once();
  });

  it("calls postStatus on the status service with the correct status string and auth token", async () => {
    await presenter.submitPost(postText, authToken, currentUser);

    verify(mockService.postStatus(anything(), anything())).once();

    const [capturedAuthToken, capturedStatus] = capture(
      mockService.postStatus,
    ).last();
    expect(capturedAuthToken).toEqual(authToken);
    expect(capturedStatus.post).toEqual(postText);
  });

  it("when posting is successful, the presenter tells the view to clear the info message, clear the post, and display a status posted message", async () => {
    await presenter.submitPost(postText, authToken, currentUser);

    verify(mockView.deleteMessage(postingToastId)).once();
    verify(mockView.clearPost()).once();
    verify(mockView.displayInfoMessage("Status posted!", 2000)).once();

    verify(mockView.displayErrorMessage(anything())).never();
  });

  it("when posting is not successful, the presenter tells the view to clear the info message and display an error message but does not tell it to clear the post or display a status posted message", async () => {
    const error = new Error("Post failed");
    when(mockService.postStatus(anything(), anything())).thenThrow(error);

    await presenter.submitPost(postText, authToken, currentUser);

    verify(
      mockView.displayErrorMessage(
        'Failed operation "post the status" because of exception: Post failed',
      ),
    ).once();
    verify(mockView.deleteMessage(postingToastId)).once();

    verify(mockView.clearPost()).never();
    verify(mockView.displayInfoMessage("Status posted!", 2000)).never();
  });
});
