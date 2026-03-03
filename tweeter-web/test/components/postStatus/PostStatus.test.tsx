import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { instance, mock, verify } from "@typestrong/ts-mockito";
import { AuthToken, User } from "tweeter-shared";
import PostStatus from "../../../src/components/postStatus/PostStatus";
import { PostStatusPresenter } from "../../../src/presenter/StatusPresenter";
import { useUserInfo } from "../../../src/components/userInfo/userInfoHooks";

// Mock the userInfoHook so the component can access currentUser and authToken
jest.mock("../../../src/components/userInfo/userInfoHooks", () => ({
  ...jest.requireActual("../../../src/components/userInfo/userInfoHooks"),
  __esModule: true,
  useUserInfo: jest.fn(),
}));

describe("PostStatus Component", () => {
  const mockUser = new User(
    "Test",
    "User",
    "@testuser",
    "https://example.com/pic.png",
  );
  const mockAuthToken = new AuthToken("test-token", Date.now());
  const postText = "Hello, Tweeter!";

  beforeAll(() => {
    (useUserInfo as jest.Mock).mockReturnValue({
      currentUser: mockUser,
      authToken: mockAuthToken,
    });
  });

  const setup = (presenter?: PostStatusPresenter) => {
    const user = userEvent.setup();

    render(!!presenter ? <PostStatus presenter={presenter} /> : <PostStatus />);

    return {
      user,
      postStatusButton: screen.getByRole("button", { name: /Post Status/i }),
      clearButton: screen.getByRole("button", { name: /Clear/i }),
      textArea: screen.getByPlaceholderText(/What's on your mind\?/i),
    };
  };

  it("starts with the Post Status and Clear buttons both disabled", () => {
    const { postStatusButton, clearButton } = setup();

    expect(postStatusButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("enables both buttons when the text field has text", async () => {
    const { user, postStatusButton, clearButton, textArea } = setup();

    await user.type(textArea, postText);

    expect(postStatusButton).toBeEnabled();
    expect(clearButton).toBeEnabled();
  });

  it("disables both buttons when the text field is cleared", async () => {
    const { user, postStatusButton, clearButton, textArea } = setup();

    await user.type(textArea, postText);
    await user.clear(textArea);

    expect(postStatusButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("calls the presenter's submitPost method with the correct parameters when Post Status is clicked", async () => {
    const mockPresenter = mock<PostStatusPresenter>();
    const mockPresenterInstance = instance(mockPresenter);

    const { user, postStatusButton, textArea } = setup(mockPresenterInstance);

    await user.type(textArea, postText);
    await user.click(postStatusButton);

    verify(mockPresenter.submitPost(postText, mockAuthToken, mockUser)).once();
  });
});
