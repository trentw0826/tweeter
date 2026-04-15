import {
  AuthResponse,
  AuthToken,
  PagedStatusItemResponse,
  Status,
  StatusDto,
  User,
} from "tweeter-shared";
import {
  PostStatusPresenter,
  PostStatusView,
} from "../../src/presenter/StatusPresenter";
import { AuthService } from "../../src/model.service/AuthService";
import { StatusService } from "../../src/model.service/StatusService";
import { anything, instance, mock, verify, when } from "@typestrong/ts-mockito";

describe("Post status appends to story", () => {
  const baseUrl = "https://api.example.com/prod";
  const userDto = {
    alias: "@integration-user",
    firstName: "Integration",
    lastName: "Tester",
    imageUrl: "https://example.com/integration-user.png",
  };
  const tokenDto = {
    token: "integration-token-123",
    timestamp: 1700000000000,
  };

  let fetchMock: jest.Mock;
  let storyItems: StatusDto[];

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        __APP_CONFIG__?: { VITE_API_BASE_URL?: string };
      }
    ).__APP_CONFIG__ = {
      VITE_API_BASE_URL: baseUrl,
    };

    storyItems = [];
    fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const endpoint = url.replace(baseUrl, "");
      const request = JSON.parse((init?.body as string | undefined) ?? "{}");

      if (endpoint === "/auth/login") {
        const response: AuthResponse = {
          success: true,
          message: null,
          user: userDto,
          authToken: tokenDto,
        };

        return {
          ok: true,
          status: 200,
          json: async () => response,
        };
      }

      if (endpoint === "/status/poststatus") {
        if (request.token !== tokenDto.token) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ error: "[unauthorized] Invalid auth token" }),
          };
        }

        storyItems = [request.newStatus as StatusDto, ...storyItems];

        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: null }),
        };
      }

      if (endpoint === "/status/getstoryitems") {
        if (request.token !== tokenDto.token) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ error: "[unauthorized] Invalid auth token" }),
          };
        }

        const pageSize = Number(request.pageSize ?? 10);
        const response: PagedStatusItemResponse = {
          success: true,
          message: null,
          items: storyItems.slice(0, pageSize),
          hasMore: storyItems.length > pageSize,
        };

        return {
          ok: true,
          status: 200,
          json: async () => response,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `Unhandled endpoint: ${endpoint}` }),
      };
    });

    Object.defineProperty(globalThis, "fetch", {
      writable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("logs in, posts via presenter, shows success message, and returns the status in story", async () => {
    const authService = new AuthService();
    const statusService = new StatusService();

    const [loggedInUser, authToken] = await authService.login(
      userDto.alias,
      "password",
    );

    const mockView = mock<PostStatusView>();
    when(mockView.displayInfoMessage("Posting status...", 0)).thenReturn(
      "posting-toast-id",
    );
    const presenter = new PostStatusPresenter(instance(mockView));

    const postText = `integration post ${Date.now()}`;
    await presenter.submitPost(postText, authToken, loggedInUser);

    verify(mockView.displayInfoMessage("Status posted!", 2000)).once();
    verify(mockView.clearPost()).once();
    verify(mockView.deleteMessage("posting-toast-id")).once();
    verify(mockView.displayErrorMessage(anything())).never();

    const [story, hasMore] = await statusService.retrievePageOfStoryItems(
      authToken,
      loggedInUser.alias,
      10,
      null,
    );

    expect(hasMore).toBe(false);
    expect(story.length).toBeGreaterThan(0);

    const newestStatus: Status = story[0];
    expect(newestStatus.post).toBe(postText);
    expect(newestStatus.user.alias).toBe(loggedInUser.alias);
    expect(newestStatus.user.firstName).toBe(loggedInUser.firstName);
    expect(newestStatus.user.lastName).toBe(loggedInUser.lastName);
    expect(newestStatus.user.imageUrl).toBe(loggedInUser.imageUrl);
    expect(typeof newestStatus.timestamp).toBe("number");
    expect(newestStatus.timestamp).toBeGreaterThan(0);
  });
});
