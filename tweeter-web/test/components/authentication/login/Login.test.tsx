import { MemoryRouter } from "react-router-dom";
import Login from "../../../../src/components/authentication/login/Login";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import "@testing-library/jest-dom";
import { LoginPresenter } from "../../../../src/presenter/LoginPresenter";
import { instance, mock, verify } from "@typestrong/ts-mockito";
import { consumeUnauthorizedToastMessage } from "../../../../src/session/AuthSession";

const displayInfoMessageMock = jest.fn();

jest.mock("../../../../src/components/toaster/messageHooks", () => ({
  useMessageActions: () => ({
    displayErrorMessage: jest.fn(),
    displayInfoMessage: displayInfoMessageMock,
    deleteMessage: jest.fn(),
    deleteAllMessages: jest.fn(),
  }),
}));

jest.mock("../../../../src/session/AuthSession", () => ({
  consumeUnauthorizedToastMessage: jest.fn(),
}));

library.add(fab);

describe("Login Component", () => {
  const originalUrl = "/";
  const alternateOriginalUrl = "/some-other-page";
  const alias = "test-user";
  const password = "test-password";

  const setup = (url: string = originalUrl, presenter?: LoginPresenter) => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        {!!presenter ? (
          <Login originalUrl={url} presenter={presenter} />
        ) : (
          <Login originalUrl={url} />
        )}
      </MemoryRouter>,
    );

    return {
      user,
      signInButton: screen.getByRole("button", { name: /Sign in/i }),
      aliasField: screen.getByLabelText(/alias/i),
      passwordField: screen.getByLabelText(/password/i),
    };
  };

  const enterValidCredentials = async (
    user: ReturnType<typeof userEvent.setup>,
    aliasField: HTMLElement,
    passwordField: HTMLElement,
  ) => {
    await user.type(aliasField, alias);
    await user.type(passwordField, password);
  };

  it("starts with the sign-in button disabled", () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(null);
    const { signInButton } = setup();
    expect(signInButton).toBeDisabled();
  });

  it("enables the sign-in button when both alias and password have text", async () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(null);
    const { user, signInButton, aliasField, passwordField } = setup();

    await enterValidCredentials(user, aliasField, passwordField);

    expect(signInButton).toBeEnabled();
  });

  it("disables the sign-in button when alias is empty", async () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(null);
    const { user, signInButton, aliasField, passwordField } = setup();

    await enterValidCredentials(user, aliasField, passwordField);
    await user.clear(aliasField);

    expect(signInButton).toBeDisabled();
  });

  it("disables the sign-in button when password is empty", async () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(null);
    const { user, signInButton, aliasField, passwordField } = setup();

    await enterValidCredentials(user, aliasField, passwordField);
    await user.clear(passwordField);

    expect(signInButton).toBeDisabled();
  });

  it("calls the presenter's login method with the correct credentials when the sign-in button is clicked", async () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(null);
    const mockPresenter = mock<LoginPresenter>();
    const mockPresenterInstance = instance(mockPresenter);

    const { user, signInButton, aliasField, passwordField } = setup(
      alternateOriginalUrl,
      mockPresenterInstance,
    );

    await enterValidCredentials(user, aliasField, passwordField);
    await user.click(signInButton);

    verify(
      mockPresenter.login(alias, password, false, alternateOriginalUrl),
    ).once();
  });

  it("displays a toast when an unauthorized session message is present", () => {
    (consumeUnauthorizedToastMessage as jest.Mock).mockReturnValue(
      "Session expired. Please sign in again.",
    );

    setup();

    expect(displayInfoMessageMock).toHaveBeenCalledWith(
      "Session expired. Please sign in again.",
      4000,
      "text-bg-warning",
    );
  });
});
