import { AuthToken } from "tweeter-shared";
import {
  AppNavbarPresenter,
  AppNavbarView,
} from "../../src/presenter/AppNavbarPresenter";
import {
  anyNumber,
  anything,
  capture,
  instance,
  mock,
  spy,
  verify,
  when,
} from "@typestrong/ts-mockito";
import { AuthService } from "../../src/model.service/AuthService";

describe("AppNavbarPresenter", () => {
  let mockAppNavbarPresenterView: AppNavbarView;
  let appNavbarPresenter: AppNavbarPresenter;
  let mockService: AuthService;

  const messageId = "test-message-id";
  const authToken = new AuthToken("test-user", Date.now());

  beforeEach(() => {
    mockAppNavbarPresenterView = mock<AppNavbarView>();
    const mockAppNavbarPresentViewInstance = instance(
      mockAppNavbarPresenterView,
    );
    when(
      mockAppNavbarPresenterView.displayInfoMessage(anything(), 0),
    ).thenReturn(messageId);

    const appNavbarPresenterSpy = spy(
      new AppNavbarPresenter(mockAppNavbarPresentViewInstance),
    );
    appNavbarPresenter = instance(appNavbarPresenterSpy);

    mockService = mock<AuthService>();

    when(appNavbarPresenterSpy.authService).thenReturn(instance(mockService));
  });

  it("tells the view to display a logging-out message", async () => {
    await appNavbarPresenter.logout(authToken);
    verify(
      mockAppNavbarPresenterView.displayInfoMessage("Logging Out...", 0),
    ).once();
  });

  it("calls logout on the user service with the correct auth token", async () => {
    await appNavbarPresenter.logout(authToken);
    verify(mockService.logout(authToken)).once();

    // Example of capturing arguments passed to a mock method
    let [capturedAuthToken] = capture(mockService.logout).last();
    expect(capturedAuthToken).toEqual(authToken);
  });

  it("when the logout is successful, the presenter tells the view to clear the info message that was displayed previously, clear the user info, and navigate to the login page.", async () => {
    await appNavbarPresenter.logout(authToken);

    verify(mockAppNavbarPresenterView.deleteMessage(messageId)).once();
    verify(mockAppNavbarPresenterView.clearUserInfo()).once();
    verify(mockAppNavbarPresenterView.navigateTo("/login")).once();

    verify(mockAppNavbarPresenterView.displayErrorMessage(anything())).never();
  });

  it("when the logout is not successful, the presenter tells the view to display an error message and does not tell it to clear the info message, clear the user info or navigate to the login page.", async () => {
    let error = new Error("Logout failed");
    when(mockService.logout(anything())).thenThrow(error);

    await appNavbarPresenter.logout(authToken);

    verify(
      mockAppNavbarPresenterView.displayErrorMessage(
        'Failed operation "log user out" because of exception: Logout failed',
      ),
    ).once();
    verify(mockAppNavbarPresenterView.deleteMessage(anyNumber())).never();
    verify(mockAppNavbarPresenterView.clearUserInfo()).never();
    verify(mockAppNavbarPresenterView.navigateTo("/login")).never();
  });
});
